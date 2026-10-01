"use client";

// 멘토·학생 1:1 채팅 (시연 버전)
// 대화는 이 브라우저의 localStorage에만 저장된다. 상대방 계정으로 로그인하면 답장할 수 있다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import { moderateChatMessage } from "@/lib/moderate-chat";
import { formatSession } from "@/lib/schedule";
import { canChat, markChatRead, sendMessage, useStore } from "@/lib/store";

const MAX_LENGTH = 500;

// 미성년자 보호: 전화번호는 보내지 못하게 막고, 외부 메신저 이야기는 주의 안내만 한다
const PHONE_PATTERN = /01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/;
const OUTSIDE_PATTERN = /카톡|카카오톡|오픈채팅|인스타|텔레그램|디엠|DM/i;

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, currentUser, requests, allMentors, messages } = useStore();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const req = requests.find((r) => r.id === id);
  const mentor = req ? allMentors.find((m) => m.id === req.mentorId) : undefined;
  const chat = messages.filter((m) => m.requestId === id);
  const isMentor = currentUser?.role === "mentor";
  const allowed =
    !!req && !!currentUser && (isMentor ? req.mentorId === currentUser.mentorId : req.studentId === currentUser.id);

  // 새 메시지가 오면 맨 아래로 스크롤하고 읽음 처리한다
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
    if (allowed && currentUser) markChatRead(id, currentUser.id);
  }, [chat.length, allowed, currentUser, id]);

  if (!ready) return null;

  if (!req || !mentor || !allowed || !currentUser) {
    return (
      <div className="container page empty">
        들어갈 수 없는 채팅방이에요. <Link href="/mypage">마이페이지로</Link>
      </div>
    );
  }

  const other = isMentor
    ? { name: `${req.studentName} 학생`, seed: req.studentName }
    : { name: `${mentor.name} 멘토`, seed: mentor.id + mentor.name };
  const open = canChat(req);
  const trimmed = text.trim();
  const blocked = PHONE_PATTERN.test(trimmed);
  const outside = !blocked && OUTSIDE_PATTERN.test(trimmed);

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trimmed || blocked || !open) return;
    sendMessage(req.id, currentUser, trimmed);
    // 전송은 막지 않고, 보낸 뒤에 안전 점검을 한다
    void moderateChatMessage({
      text: trimmed,
      requestId: req.id,
      sessionLabel: `${mentor.name} 멘토 · ${formatSession(req.date, req.time)}`,
      senderRole: isMentor ? "mentor" : "student",
      mentorId: mentor.id,
      mentorName: mentor.name,
      studentName: req.studentName,
    });
    setText("");
  };

  return (
    <div className="container narrow page chat-page">
      <div className="chat-head card">
        <Link href="/mypage" className="chat-back" aria-label="마이페이지로">←</Link>
        <Avatar seed={other.seed} size={44} />
        <div className="chat-head-info">
          <strong>{other.name}</strong>
          <span className="muted">
            {formatSession(req.date, req.time)} · {req.method}
          </span>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <div className="chat-notice">
        전화번호나 SNS 아이디 같은 개인 연락처는 공유하지 말고, 대화는 이 채팅방에서만 해 주세요.
        <br />
        <span className="muted">🛡️ 안전을 위해 보낸 메시지는 AI(OpenAI)로 점검돼요. 비속어·괴롭힘·외부 연락 유도가 감지되면 해당 메시지의 일부가 운영자에게 전달될 수 있어요.</span>
      </div>

      <div className="chat-log card">
        <div className="chat-bubble-wrap them">
          <div className="chat-bubble chat-first">
            <div className="chat-first-label">멘토링 신청 내용</div>
            {req.message}
          </div>
          <span className="chat-meta">{req.studentName} · {timeLabel(req.createdAt)}</span>
        </div>

        {chat.length === 0 && (
          <div className="chat-empty muted">
            {open ? "첫 메시지를 보내 인사해 보세요." : "멘토가 신청을 승인하면 채팅을 시작할 수 있어요."}
          </div>
        )}

        {chat.map((m) => {
          const mine = m.senderId === currentUser.id;
          return (
            <div key={m.id} className={`chat-bubble-wrap ${mine ? "me" : "them"}`}>
              <div className="chat-bubble">{m.text}</div>
              <span className="chat-meta">
                {mine ? "나" : m.senderName} · {timeLabel(m.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={send}>
        <textarea
          className="textarea"
          value={text}
          maxLength={MAX_LENGTH}
          disabled={!open}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter로 보내고, Shift+Enter로 줄을 바꾼다 (한글 조합 중에는 보내지 않음)
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={open ? "메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)" : "멘토 승인 후 채팅할 수 있어요"}
        />
        <button className="btn" disabled={!trimmed || blocked || !open}>
          보내기
        </button>
      </form>
      {blocked && <div className="field-error">전화번호처럼 보이는 내용은 보낼 수 없어요.</div>}
      {outside && <div className="chat-warn">외부 메신저로 옮기기보다 이 채팅방에서 대화해 주세요.</div>}
    </div>
  );
}
