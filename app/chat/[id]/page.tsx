"use client";

// 멘토·학생 1:1 채팅
// 같은 학생과 멘토는 멘토링을 여러 번 해도 하나의 채팅방에서 대화를 이어 간다. 주소의 id는 두 사람의 신청 중 하나다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import { moderateChatMessage } from "@/lib/moderate-chat";
import { formatSession } from "@/lib/schedule";
import { REACTIONS, activeSanction, markChatRead, otherReadAt, reactMessage, roomActiveRequest, roomMessages, roomRequests, sendMessage, useStore } from "@/lib/store";
import type { ChatMessage, MentoringRequest } from "@/lib/types";

const MAX_LENGTH = 500;

// 미성년자 보호: 전화번호는 보내지 못하게 막고, 외부 메신저 이야기는 주의 안내만 한다
const PHONE_PATTERN = /01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/;
const OUTSIDE_PATTERN = /카톡|카카오톡|오픈채팅|인스타|텔레그램|디엠|DM/i;

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

// 메시지 아래에 남긴 감정을 모아서 보여 준다
function Reactions({ m, myId }: { m: ChatMessage; myId: string }) {
  const entries = Object.entries(m.reactions ?? {});
  if (!entries.length) return null;
  const counts = REACTIONS.map((e) => ({ e, n: entries.filter(([, v]) => v === e).length, mine: m.reactions?.[myId] === e })).filter((x) => x.n);
  return (
    <div className="chat-reactions">
      {counts.map((c) => (
        <button
          key={c.e}
          type="button"
          className={`chat-reaction ${c.mine ? "mine" : ""}`}
          onClick={() => c.mine && reactMessage(m.id, myId, c.e)}
          title={c.mine ? "내 감정 지우기" : undefined}
        >
          {c.e}
          {c.n > 1 && <span>{c.n}</span>}
        </button>
      ))}
    </div>
  );
}

type Item = { kind: "request"; at: string; req: MentoringRequest } | { kind: "message"; at: string; m: ChatMessage };

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const { ready, currentUser, requests, allMentors } = store;
  const [text, setText] = useState("");
  const [picker, setPicker] = useState<string | null>(null); // 감정 고르기를 연 메시지 id
  const logRef = useRef<HTMLDivElement>(null);

  const req = requests.find((r) => r.id === id);
  const mentor = req ? allMentors.find((m) => m.id === req.mentorId) : undefined;
  const isMentor = currentUser?.role === "mentor";
  const allowed =
    !!req && !!currentUser && (isMentor ? req.mentorId === currentUser.mentorId : req.studentId === currentUser.id);
  const chat = req && allowed ? roomMessages(store, req) : [];

  // 새 메시지가 오면 맨 아래로 스크롤하고 읽음 처리한다
  useEffect(() => {
    // 페이지 전체가 아니라 대화 목록 상자 안에서만 맨 아래로 내린다 (scrollIntoView는 페이지까지 움직여 입력창이 가려졌다)
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
    if (allowed && currentUser && req) markChatRead(req, currentUser.id);
  }, [chat.length, allowed, currentUser?.id, req?.id]);

  // 감정 고르기 창은 바깥을 누르거나 Esc로 닫는다
  useEffect(() => {
    if (!picker) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".chat-picker, .chat-bubble")) setPicker(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicker(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [picker]);

  if (!ready) return null;

  if (!req || !mentor || !allowed || !currentUser) {
    return (
      <div className="container page empty">
        들어갈 수 없는 채팅방이에요. <Link href="/mypage">마이페이지로</Link>
      </div>
    );
  }

  const roomReqs = roomRequests(store, req);
  const active = roomActiveRequest(store, req);
  const latest = active ?? roomReqs.at(-1)!;
  const other = isMentor
    ? { name: `${req.studentName} 학생`, seed: req.studentName }
    : { name: `${mentor.name} 멘토`, seed: mentor.id + mentor.name };
  const locked = !!activeSanction(store, mentor.id);
  const open = !!active && !locked;
  const trimmed = text.trim();
  const blocked = PHONE_PATTERN.test(trimmed);
  const outside = !blocked && OUTSIDE_PATTERN.test(trimmed);

  // 상대방이 읽은 시각보다 늦게 보낸 내 메시지에는 "1"을 표시한다
  const readAt = otherReadAt(store, req, currentUser);
  const myMessages = chat.filter((m) => m.senderId === currentUser.id);
  const lastReadMine = [...myMessages].reverse().find((m) => m.createdAt <= readAt)?.id;

  // 신청 내용(멘토링마다 하나)과 메시지를 시간순으로 섞어서 보여 준다
  const items: Item[] = [
    ...roomReqs.map((r) => ({ kind: "request" as const, at: r.createdAt, req: r })),
    ...chat.map((m) => ({ kind: "message" as const, at: m.createdAt, m })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trimmed || blocked || !open) return;
    const target = sendMessage(req, currentUser, trimmed);
    if (target) {
      // 전송은 막지 않고, 보낸 뒤에 안전 점검을 한다
      void moderateChatMessage({
        text: trimmed,
        requestId: target.id,
        sessionLabel: `${mentor.name} 멘토 · ${formatSession(target.date, target.time)}`,
        senderRole: isMentor ? "mentor" : "student",
        mentorId: mentor.id,
        mentorName: mentor.name,
        studentName: req.studentName,
      });
    }
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
            {roomReqs.length > 1 ? `함께한 멘토링 ${roomReqs.filter((r) => r.status !== "cancelled").length}회 · ` : ""}
            최근 {formatSession(latest.date, latest.time)} · {latest.method}
          </span>
        </div>
        <StatusBadge status={latest.status} />
      </div>

      <div className="chat-notice">
        전화번호나 SNS 아이디 같은 개인 연락처는 공유하지 말고, 대화는 이 채팅방에서만 해 주세요.
        <br />
        <span className="muted">🛡️ 안전을 위해 보낸 메시지는 AI(OpenAI)로 점검돼요. 비속어·괴롭힘·외부 연락 유도가 감지되면 해당 메시지의 일부가 운영자에게 전달되고, 학생의 보호자에게도 바로 알림이 가요.</span>
      </div>

      {locked && (
        <div className="chat-notice sanction-notice">
          {isMentor ? "운영 정책에 따라 멘토 활동이 제한되어 지금은 메시지를 보낼 수 없어요. 마이페이지에서 운영팀 안내를 확인해 주세요." : "운영 정책에 따라 이 멘토의 활동이 제한되어 지금은 대화할 수 없어요."}
        </div>
      )}

      <div className="chat-log card" ref={logRef}>
        {items.map((it) => {
          if (it.kind === "request") {
            const r = it.req;
            return (
              <div key={r.id} className="chat-session">
                <div className="chat-divider">
                  <span>📅 {formatSession(r.date, r.time)} 멘토링{r.status === "cancelled" ? " · 취소됨" : ""}</span>
                </div>
                <div className="chat-bubble-wrap them">
                  <div className="chat-bubble chat-first">
                    <div className="chat-first-label">멘토링 신청 내용</div>
                    {r.message}
                  </div>
                  <span className="chat-meta">{r.studentName} · {timeLabel(r.createdAt)}</span>
                </div>
              </div>
            );
          }
          const m = it.m;
          const mine = m.senderId === currentUser.id;
          const unreadByOther = mine && m.createdAt > readAt;
          return (
            <div key={m.id} className={`chat-bubble-wrap ${mine ? "me" : "them"}`}>
              <div className="chat-bubble-row">
                {mine && unreadByOther && <span className="chat-unread-one" title="상대방이 아직 읽지 않았어요">1</span>}
                <button
                  type="button"
                  className="chat-bubble"
                  onClick={() => setPicker(picker === m.id ? null : m.id)}
                  aria-label="감정 남기기"
                >
                  {m.text}
                </button>
                {picker === m.id && (
                  <div className="chat-picker" role="menu">
                    {REACTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className={m.reactions?.[currentUser.id] === e ? "on" : ""}
                        onClick={() => {
                          reactMessage(m.id, currentUser.id, e);
                          setPicker(null);
                        }}
                        aria-label={`${e} 감정 남기기`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Reactions m={m} myId={currentUser.id} />
              <span className="chat-meta">
                {mine ? "나" : m.senderName} · {timeLabel(m.createdAt)}
                {m.id === lastReadMine && <span className="chat-read"> · 읽음</span>}
              </span>
            </div>
          );
        })}

        {chat.length === 0 && (
          <div className="chat-empty muted">
            {open ? "첫 메시지를 보내 인사해 보세요." : locked ? "지금은 대화할 수 없어요." : latest.status === "cancelled" ? "취소된 멘토링이에요." : "멘토가 신청을 승인하면 채팅을 시작할 수 있어요."}
          </div>
        )}
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
          placeholder={open ? "메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)" : locked ? "지금은 메시지를 보낼 수 없어요" : latest.status === "cancelled" ? "취소된 멘토링이라 메시지를 보낼 수 없어요" : "멘토 승인 후 채팅할 수 있어요"}
        />
        <button className="btn" disabled={!trimmed || blocked || !open}>
          보내기
        </button>
      </form>
      {blocked && <div className="field-error">전화번호처럼 보이는 내용은 보낼 수 없어요.</div>}
      {outside && <div className="chat-warn">외부 메신저로 옮기기보다 이 채팅방에서 대화해 주세요.</div>}
      {open && <p className="muted small chat-hint">메시지를 누르면 감정을 남길 수 있어요.</p>}
    </div>
  );
}
