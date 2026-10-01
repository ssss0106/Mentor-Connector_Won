// 시연방(공유 모드) 저장소 API. 같은 방 코드를 입력한 브라우저끼리 데이터를 공유한다.
// 방 코드가 곧 접근 권한이므로 시연용 가상 데이터만 쓰고, 코드는 팀 안에서만 공유한다.

import { NextResponse } from "next/server";
import { fail, limited } from "@/lib/server-openai";
import { applyOps, cleanOps } from "@/lib/shared-ops";
import { getRow, insertRow, supabaseConfigured, updateRow } from "@/lib/server-supabase";

export const runtime = "nodejs";

const ROOM = /^[A-Za-z0-9_-]{3,40}$/;
const MAX_DOC_BYTES = 4 * 1024 * 1024;

const NOT_READY = "공유 저장소(Supabase)가 아직 설정되지 않았어요.";

export async function GET(req: Request) {
  if (!supabaseConfigured()) return fail(NOT_READY, 503);
  if (limited("db-read", req, 3000)) return fail("요청이 너무 많아요.", 429);
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room") ?? "";
  if (!ROOM.test(room)) return fail("방 코드는 영문·숫자·-·_ 3~40자로 입력해 주세요.", 400);
  const since = Number(searchParams.get("since") ?? -1);
  try {
    const row = await getRow(room);
    if (!row) return NextResponse.json({ version: 0, data: {} });
    if (row.version === since) return NextResponse.json({ version: row.version, unchanged: true });
    return NextResponse.json({ version: row.version, data: row.data });
  } catch {
    return fail("공유 저장소에 연결하지 못했어요.", 502);
  }
}

export async function POST(req: Request) {
  if (!supabaseConfigured()) return fail(NOT_READY, 503);
  if (limited("db-write", req, 1200)) return fail("요청이 너무 많아요.", 429);
  let body: { room?: unknown; ops?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("요청을 읽을 수 없어요.", 400);
  }
  const room = String(body.room ?? "");
  const ops = cleanOps(body.ops);
  if (!ROOM.test(room) || !ops) return fail("잘못된 요청이에요.", 400);

  try {
    // 읽은 뒤 그 사이 다른 브라우저가 저장했다면(버전이 달라지면) 처음부터 다시 반영한다
    for (let attempt = 0; attempt < 6; attempt++) {
      const row = await getRow(room);
      const next = applyOps(structuredClone(row?.data ?? {}), ops);
      if (JSON.stringify(next).length > MAX_DOC_BYTES) return fail("저장된 데이터가 너무 커요. 데모 데이터를 초기화해 주세요.", 413);
      const ok = row ? await updateRow(room, row.version, next) : await insertRow(room, next);
      if (ok) return NextResponse.json({ version: (row?.version ?? 0) + 1, data: next });
    }
    return fail("동시에 너무 많이 저장되어 잠시 후 다시 시도해 주세요.", 409);
  } catch {
    return fail("공유 저장소에 연결하지 못했어요.", 502);
  }
}
