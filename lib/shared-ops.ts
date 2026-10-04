// 공유 모드(시연방)에서 두 브라우저가 서로의 데이터를 지우지 않도록, 전체를 덮어쓰지 않고 "항목 단위 변경(op)"만 주고받는다.
// 브라우저에서는 diffDocs로 변경 내용을 만들고, 서버에서는 applyOps로 저장된 문서에 반영한다. (같은 규칙을 양쪽이 쓴다)

export type Doc = Record<string, unknown>;

export type Op =
  | { t: "reset" }
  | { t: "up"; k: string; kf: string; item: Doc } // 배열 항목을 추가하거나 교체
  | { t: "del"; k: string; kf: string; key: unknown } // 배열 항목 삭제
  | { t: "set"; k: string; key: string; value: unknown } // 객체 항목 설정
  | { t: "unset"; k: string; key: string } // 객체 항목 삭제
  | { t: "put"; k: string; value: unknown }; // 값 전체 교체

const BAD = new Set(["__proto__", "constructor", "prototype"]);
export const validKey = (k: string) => /^[A-Za-z][A-Za-z0-9]{0,30}$/.test(k) && !BAD.has(k);
// 로그인한 사용자는 각 브라우저에만 두고 공유하지 않는다
export const LOCAL_ONLY_KEYS = new Set(["currentUserId"]);

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const isObj = (v: unknown): v is Doc => !!v && typeof v === "object" && !Array.isArray(v);
const keyField = (arr: unknown[]) =>
  arr.every((x) => isObj(x) && "id" in x) ? "id" : arr.every((x) => isObj(x) && "userId" in x) ? "userId" : null;

export function diffDocs(before: Doc, after: Doc): Op[] {
  const ops: Op[] = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (LOCAL_ONLY_KEYS.has(k) || !validKey(k)) continue;
    const a = before[k];
    const b = after[k];
    if (same(a, b)) continue;

    if ((a === undefined || Array.isArray(a)) && (b === undefined || Array.isArray(b))) {
      const A = (a as unknown[] | undefined) ?? [];
      const B = (b as unknown[] | undefined) ?? [];
      const kf = keyField([...A, ...B]);
      if (!kf) {
        ops.push({ t: "put", k, value: b });
        continue;
      }
      const am = new Map(A.map((x) => [(x as Doc)[kf], x]));
      const bm = new Map(B.map((x) => [(x as Doc)[kf], x]));
      for (const [key, item] of bm) if (!am.has(key) || !same(am.get(key), item)) ops.push({ t: "up", k, kf, item: item as Doc });
      for (const key of am.keys()) if (!bm.has(key)) ops.push({ t: "del", k, kf, key });
    } else if ((a === undefined || isObj(a)) && (b === undefined || isObj(b))) {
      const A = (a as Doc | undefined) ?? {};
      const B = (b as Doc | undefined) ?? {};
      for (const key of Object.keys(B)) if (!same(A[key], B[key])) ops.push({ t: "set", k, key, value: B[key] });
      for (const key of Object.keys(A)) if (!(key in B)) ops.push({ t: "unset", k, key });
    } else {
      ops.push({ t: "put", k, value: b });
    }
  }
  return ops;
}

export function applyOps(doc: Doc, ops: Op[]): Doc {
  let d = doc;
  for (const op of ops) {
    if (op.t === "reset") {
      d = {};
      continue;
    }
    if (!validKey(op.k)) continue;
    if (op.t === "up" || op.t === "del") {
      const arr = Array.isArray(d[op.k]) ? (d[op.k] as Doc[]) : [];
      d[op.k] = arr;
      if (op.t === "up") {
        const i = arr.findIndex((x) => isObj(x) && x[op.kf] === op.item[op.kf]);
        if (i >= 0) arr[i] = op.item;
        else arr.push(op.item);
      } else {
        d[op.k] = arr.filter((x) => !(isObj(x) && x[op.kf] === op.key));
      }
    } else if (op.t === "set" || op.t === "unset") {
      if (BAD.has(op.key)) continue;
      const obj = isObj(d[op.k]) ? (d[op.k] as Doc) : {};
      d[op.k] = obj;
      if (op.t === "set") obj[op.key] = op.value;
      else delete obj[op.key];
    } else if (op.t === "put") {
      if (op.value === undefined) delete d[op.k];
      else d[op.k] = op.value;
    }
  }
  return d;
}

// 서버가 브라우저에서 받은 op를 검사한다 (모양이 맞지 않으면 사유와 함께 거절한다)
export const MAX_OPS_PER_REQUEST = 1000;
export const CLIENT_CHUNK = 150;

export function cleanOps(raw: unknown): { ops: Op[] } | { error: string } {
  if (!Array.isArray(raw)) return { error: "변경 내용이 배열이 아니에요" };
  if (raw.length > MAX_OPS_PER_REQUEST) return { error: `변경 내용이 너무 많아요 (${raw.length}개)` };
  const out: Op[] = [];
  for (let i = 0; i < raw.length; i++) {
    const o = raw[i];
    const where = `${i + 1}번째 변경`;
    if (!isObj(o)) return { error: `${where}: 형식이 아니에요` };
    if (o.t === "reset") out.push({ t: "reset" });
    else if (typeof o.k !== "string" || !validKey(o.k)) return { error: `${where}: 항목 이름이 올바르지 않아요 (${String(o.k).slice(0, 30)})` };
    else if (o.t === "up" && (o.kf === "id" || o.kf === "userId") && isObj(o.item)) out.push({ t: "up", k: o.k, kf: o.kf, item: o.item });
    else if (o.t === "del" && (o.kf === "id" || o.kf === "userId")) out.push({ t: "del", k: o.k, kf: o.kf, key: o.key });
    else if (o.t === "set" && typeof o.key === "string" && !BAD.has(o.key)) out.push({ t: "set", k: o.k, key: o.key, value: o.value });
    else if (o.t === "unset" && typeof o.key === "string") out.push({ t: "unset", k: o.k, key: o.key });
    else if (o.t === "put") out.push({ t: "put", k: o.k, value: o.value });
    else return { error: `${where}: 알 수 없는 종류예요 (${String(o.t).slice(0, 10)}:${o.k})` };
  }
  return { ops: out };
}
