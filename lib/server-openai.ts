// 서버 전용: OpenAI 호출에 필요한 공통 코드 (키는 여기서만 읽고 브라우저로 내려가지 않는다)

import { NextResponse } from "next/server";

export class UpstreamError extends Error {
  constructor(public status: number) {
    super(`upstream ${status}`);
  }
}

export const openaiBase = () => process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

// 돈이 드는 API라서 IP당 10분에 max번까지만 허용한다 (서버가 재시작되면 초기화됨)
const hits = new Map<string, number[]>();
export function limited(bucket: string, req: Request, max: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const id = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < 10 * 60_000);
  const over = recent.length >= max;
  if (!over) recent.push(now);
  hits.set(id, recent);
  return over;
}

export const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export function upstreamFailure(e: unknown) {
  const status = e instanceof UpstreamError ? e.status : 0;
  if (status === 401) return fail("OpenAI API 키가 올바르지 않아요. 키를 확인해 주세요.", 502);
  if (status === 429) return fail("OpenAI 크레딧이 부족하거나 요청이 너무 많아요. 잔액을 확인해 주세요.", 502);
  return fail("AI 요청에 실패했어요. 잠시 후 다시 시도해 주세요.", 502);
}

// 글로 답하는 요청을 보내고, JSON으로 받은 답을 파싱해서 돌려준다
export async function chatJson(key: string, system: string, user: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${openaiBase()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new UpstreamError(res.status);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}
