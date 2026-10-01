// 서버 전용: Supabase(PostgREST)에 공유 모드 데이터를 읽고 쓴다.
// SUPABASE_SECRET_KEY는 서버에서만 읽고 브라우저로 내려가지 않는다.

import type { Doc } from "./shared-ops";

// Project URL 끝에 /rest/v1/ 까지 붙여 넣어도 동작하게 정리한다
const base = () => process.env.SUPABASE_URL?.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const key = () => process.env.SUPABASE_SECRET_KEY;

export const supabaseConfigured = () => !!(base() && key());

function headers(extra?: Record<string, string>) {
  const k = key()!;
  // 새 방식의 secret key(sb_secret_…)는 apikey 헤더만, 옛 방식(JWT, eyJ…)은 Authorization도 함께 보낸다
  return { apikey: k, ...(k.startsWith("eyJ") ? { Authorization: `Bearer ${k}` } : {}), "Content-Type": "application/json", ...extra };
}

const table = () => `${base()}/rest/v1/app_state`;

// 유휴 연결이 닫힌 뒤 재사용되는 일시적인 네트워크 오류가 있어 한 번 다시 시도한다.
// 쓰기도 안전하다: 수정은 읽은 버전이 같을 때만 적용되고, 새로 만들기는 이미 있으면 409로 끝난다.
async function call(url: string, init: RequestInit): Promise<Response> {
  const run = () => fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) });
  try {
    return await run();
  } catch {
    return run();
  }
}

export interface Row {
  data: Doc;
  version: number;
}

export async function getRow(room: string): Promise<Row | null> {
  const res = await call(`${table()}?room=eq.${encodeURIComponent(room)}&select=data,version`, { headers: headers() });
  if (!res.ok) throw new Error(`supabase get ${res.status}`);
  const rows = (await res.json()) as Row[];
  return rows[0] ? { data: rows[0].data ?? {}, version: Number(rows[0].version) } : null;
}

// 방이 처음 만들어질 때. 동시에 만들어졌다면 false를 돌려준다
export async function insertRow(room: string, data: Doc): Promise<boolean> {
  const res = await call(table(), {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({ room, data, version: 1 }),
  });
  if (res.status === 409) return false;
  if (!res.ok) throw new Error(`supabase insert ${res.status}`);
  return true;
}

// 읽은 버전 그대로일 때만 저장한다. 그 사이 누가 바꿨다면 false
export async function updateRow(room: string, version: number, data: Doc): Promise<boolean> {
  const res = await call(`${table()}?room=eq.${encodeURIComponent(room)}&version=eq.${version}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({ data, version: version + 1, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`supabase update ${res.status}`);
  return ((await res.json()) as unknown[]).length > 0;
}
