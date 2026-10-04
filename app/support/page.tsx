"use client";

// 멘토 ↔ 운영자 1:1 채팅
// 운영자가 신고·안전 알림을 확인하면서 멘토에게 사실 확인이나 안내를 할 때 쓴다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sanctionLabel } from "@/components/AdminMentorManage";
import { activeSanction, markAdminChatRead, sendAdminMessage, useStore } from "@/lib/store";

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function SupportChatPage() {
  const router = useRouter();
  const store = useStore();
  const { ready, currentUser, adminMessages } = store;
  const [text, setText] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const mentorId = currentUser?.role === "mentor" ? currentUser.mentorId : undefined;
  const thread = adminMessages.filter((m) => m.mentorId === mentorId);

  useEffect(() => {
    if (ready && !mentorId) router.replace("/mypage");
  }, [ready, mentorId, router]);

  useEffect(() => {
    // 페이지는 그대로 두고 대화 목록 상자 안에서만 맨 아래로 내린다
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
    if (mentorId && currentUser) markAdminChatRead(mentorId, currentUser.id);
  }, [thread.length, mentorId, currentUser]);

  if (!ready || !mentorId || !currentUser) return null;

  const sanction = activeSanction(store, mentorId);
  const trimmed = text.trim();
  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trimmed) return;
    sendAdminMessage(mentorId, "mentor", trimmed, currentUser.id);
    setText("");
  };

  return (
    <div className="container narrow page chat-page">
      <div className="chat-head card">
        <Link href="/mypage" className="chat-back" aria-label="마이페이지로">←</Link>
        <span className="support-avatar" aria-hidden="true">🛡️</span>
        <div className="chat-head-info">
          <strong>Menco 운영팀</strong>
          <span className="muted">멘토 활동·신고 관련 안내</span>
        </div>
      </div>

      {sanction && (
        <div className="chat-notice sanction-notice">
          현재 계정 상태: <strong>{sanctionLabel(sanction)}</strong> · 사유: {sanction.reason}
        </div>
      )}

      <div className="chat-log card" ref={logRef}>
        {thread.length === 0 && <div className="chat-empty muted">운영팀에 궁금한 점을 남겨 주세요.</div>}
        {thread.map((m) => {
          const mine = m.from === "mentor";
          return (
            <div key={m.id} className={`chat-bubble-wrap ${mine ? "me" : "them"}`}>
              <div className="chat-bubble">{m.text}</div>
              <span className="chat-meta">{mine ? "나" : "운영팀"} · {timeLabel(m.createdAt)}</span>
            </div>
          );
        })}
      </div>

      <form className="chat-input" onSubmit={send}>
        <textarea
          className="textarea"
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="운영팀에 보낼 메시지 (Enter 전송, Shift+Enter 줄바꿈)"
        />
        <button className="btn" disabled={!trimmed}>보내기</button>
      </form>
    </div>
  );
}
