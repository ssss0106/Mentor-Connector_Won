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

// AI 없이도 잡아야 하는 표현 (AI 키가 없거나 AI 점검이 실패해도 동작한다)
// 일상 표현과 겹치지 않도록 "미친 듯이"처럼 흔한 말은 넣지 않는다.
const RULES: { type: string; severity: "warning" | "urgent"; pattern: RegExp; reason: string }[] = [
  {
    type: "자해·위기",
    severity: "urgent",
    pattern: /자살|자해|죽고\s*싶|죽어\s*버리고|살기\s*싫|사라지고\s*싶|극단적\s*(선택|생각)|손목\s*(을\s*)?긋|뛰어\s*내리|목\s*매/,
    reason: "자해나 자살을 암시하는 표현이 있어요. 바로 확인이 필요해요.",
  },
  {
    type: "비속어·욕설",
    severity: "warning",
    pattern: /씨\s*발|시\s*발|ㅅ\s*ㅂ|ㅆ\s*ㅂ|씹|좆|존나|졸라|ㅈ\s*ㄴ|지랄|ㅈ\s*ㄹ|개새|개\s*같|ㄱ\s*ㅅ\s*ㄲ|엿\s*먹/,
    reason: "욕설이나 비속어가 있어요.",
  },
  {
    type: "모욕·괴롭힘",
    severity: "warning",
    pattern: /미친\s*(놈|년|새끼|것|거\s*아|애)|미쳤냐|병신|ㅂ\s*ㅅ|븅신|등신|멍청(이|한\s*(놈|년|새끼))|바보\s*같은\s*(놈|년|새끼)|찐따|한심한\s*(놈|년|새끼)|꺼져|닥쳐|닥치고/,
    reason: "상대를 모욕하거나 깎아내리는 표현이 있어요.",
  },
  {
    type: "폭력·위협",
    severity: "warning",
    pattern: /죽여\s*버|죽일\s*(거|까)|패\s*버리|때려\s*버리|가만\s*안\s*둬|두고\s*보자/,
    reason: "상대를 위협하는 표현이 있어요.",
  },
];

// 긴 글(수업 녹음)에서는 문제가 된 부분 앞뒤만 잘라 보여 준다
function around(text: string, pattern: RegExp) {
  if (text.length <= 100) return text;
  const i = text.search(pattern);
  const start = Math.max(0, i - 40);
  return `${start > 0 ? "…" : ""}${text.slice(start, start + 100)}…`;
}

export function checkRules(text: string): Safety {
  const hits = RULES.filter((r) => r.pattern.test(text));
  if (!hits.length) return NO_SAFETY_ISSUE;
  return {
    flagged: true,
    severity: hits.some((h) => h.severity === "urgent") ? "urgent" : "warning",
    types: hits.map((h) => h.type),
    excerpt: maskPersonal(around(text, hits[0].pattern)),
    reason: hits[0].reason,
  };
}

// 두 점검 결과를 합친다 (유형은 합치고 심각도는 높은 쪽을 따른다)
export function mergeSafety(a: Safety, b: Safety): Safety {
  if (!a.flagged) return b;
  if (!b.flagged) return a;
  return {
    flagged: true,
    severity: a.severity === "urgent" || b.severity === "urgent" ? "urgent" : "warning",
    types: [...new Set([...a.types, ...b.types])].slice(0, 4),
    excerpt: b.excerpt || a.excerpt,
    reason: a.severity === "urgent" ? a.reason : b.reason || a.reason,
  };
}

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
