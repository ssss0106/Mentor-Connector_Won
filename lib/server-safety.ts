// 서버 전용: 수업 녹음과 채팅이 함께 쓰는 안전 점검 규칙과 운영자 알림 메시지

import { sendAlert } from "./server-alert";

// 안전 점검에서 쓸 수 있는 유형 (이 목록에 없는 값은 버린다)
export const SAFETY_TYPES = ["비속어·욕설", "모욕·괴롭힘", "성적 표현", "폭력·위협", "자해·위기", "연락처·만남 유도", "기타 부적절"];
export const SAFETY_TYPES_TEXT = SAFETY_TYPES.map((t) => `"${t}"`).join(", ");

export interface Safety {
  flagged: boolean;
  severity: "none" | "warning" | "urgent";
  types: string[];
  excerpt: string;
  reason: string;
}

export const NO_SAFETY_ISSUE: Safety = { flagged: false, severity: "none", types: [], excerpt: "", reason: "" };

// 전화번호·이메일처럼 보이는 부분은 서버에서도 한 번 더 가린다
export const maskPersonal = (s: string) => s.replace(/\d[\d\-\s]{6,}\d/g, "○○○").replace(/\S+@\S+/g, "○○○");

export function cleanSafety(raw: unknown): Safety {
  const s = (raw ?? {}) as Record<string, unknown>;
  const types = (Array.isArray(s.types) ? s.types : [])
    .map((x) => String(x).trim())
    .filter((t) => SAFETY_TYPES.includes(t))
    .slice(0, 4);
  if (s.flagged !== true || types.length === 0) return NO_SAFETY_ISSUE;
  return {
    flagged: true,
    severity: s.severity === "urgent" || types.includes("자해·위기") ? "urgent" : "warning",
    types,
    excerpt: maskPersonal(String(s.excerpt ?? "").trim().slice(0, 120)),
    reason: String(s.reason ?? "").trim().slice(0, 150),
  };
}

// 학생·멘토 이름은 보내지 않는다. 자세한 내용은 운영자 페이지에서 신청번호로 확인한다.
export async function alertAdmin(opts: {
  source: "수업 녹음" | "채팅";
  sessionLabel: string;
  requestId: string;
  safety: Safety;
  senderRole?: "student" | "mentor";
}) {
  const { source, sessionLabel, requestId, safety, senderRole } = opts;
  const who = senderRole ? ` (보낸 사람: ${senderRole === "mentor" ? "멘토" : "학생"})` : "";
  return sendAlert(
    [
      `⚠️ [Mentor Connector] ${source}에서 부적절한 표현 감지 (${safety.severity === "urgent" ? "긴급" : "주의"})`,
      `출처: ${source}${who}`,
      `세션: ${sessionLabel || "-"} (신청번호 ${requestId || "-"})`,
      `유형: ${safety.types.join(", ")}`,
      `발언 일부: "${safety.excerpt || "-"}"`,
      `사유: ${safety.reason || "-"}`,
      "※ AI가 자동으로 감지한 결과라 틀릴 수 있어요. 운영자 페이지의 '안전 알림'에서 확인해 주세요.",
    ].join("\n"),
  );
}
