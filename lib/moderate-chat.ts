"use client";

// 채팅 메시지를 보낸 뒤 서버에서 안전 점검을 하고, 문제가 있으면 운영자 알림(브라우저 저장소)에 남긴다.
// 대화를 막지 않으며, 점검에 실패해도 조용히 넘어간다.

import { addReport } from "./store";

export async function moderateChatMessage(args: {
  text: string;
  requestId: string;
  sessionLabel: string;
  senderRole: "student" | "mentor";
  mentorId: string;
  mentorName: string;
  studentName: string;
}) {
  const { text, requestId, sessionLabel, senderRole, mentorId, mentorName, studentName } = args;
  try {
    const res = await fetch("/api/moderate-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, requestId, sessionLabel, senderRole }),
    });
    if (!res.ok) return;
    const { safety } = await res.json();
    if (!safety?.flagged) return;
    addReport({
      source: "chat",
      senderRole,
      requestId,
      mentorId,
      mentorName,
      studentName,
      severity: safety.severity === "urgent" ? "urgent" : "warning",
      types: safety.types,
      excerpt: safety.excerpt,
      reason: safety.reason,
    });
  } catch {}
}
