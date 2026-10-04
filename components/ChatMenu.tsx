"use client";

// 헤더의 채팅 아이콘: 안 읽은 메시지 총합을 배지로 보여 주고, 누르면 채팅방 목록이 열린다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import { canChat, mentorUnreadFromAdmin, roomActiveRequest, roomKey, roomMessages, unreadCount, useStore } from "@/lib/store";

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
};

export default function ChatMenu() {
  const { currentUser, requests, messages, lastRead, allMentors, adminMessages } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥을 누르거나 Esc를 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!currentUser) return null;
  const isMentor = currentUser.role === "mentor";

  // 내가 참여한 채팅방 (멘토 승인 이후), 최근 대화 순. 같은 학생·멘토의 신청은 채팅방 하나로 묶는다.
  const db = { requests, messages, lastRead };
  const mine = requests.filter((r) => canChat(r) && (isMentor ? r.mentorId === currentUser.mentorId : r.studentId === currentUser.id));
  const rooms = [...new Map(mine.map((r) => [roomKey(r), r])).values()]
    .map((pair) => {
      const r = roomActiveRequest(db, pair) ?? pair;
      const mentor = allMentors.find((m) => m.id === r.mentorId);
      const last = roomMessages(db, r).at(-1);
      return {
        req: r,
        name: isMentor ? `${r.studentName} 학생` : `${mentor?.name ?? "멘토"} 멘토`,
        seed: isMentor ? r.studentName : `${mentor?.id ?? ""}${mentor?.name ?? ""}`,
        preview: last ? `${last.senderId === currentUser.id ? "나: " : ""}${last.text}` : "첫 메시지를 보내 인사해 보세요.",
        at: last?.createdAt ?? r.createdAt,
        unread: unreadCount(db, r, currentUser.id),
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at));

  // 운영팀이 멘토에게 메시지를 보냈으면 운영팀 대화방을 맨 위에 둔다
  const adminThread = isMentor && currentUser.mentorId ? adminMessages.filter((m) => m.mentorId === currentUser.mentorId) : [];
  const adminLast = adminThread.at(-1);
  const adminUnread = adminLast ? mentorUnreadFromAdmin({ adminMessages, lastRead }, currentUser.mentorId!, currentUser.id) : 0;

  const total = rooms.reduce((sum, r) => sum + r.unread, 0) + adminUnread;

  return (
    <div className="chat-menu" ref={ref}>
      <button
        type="button"
        className={`chat-icon-btn ${open ? "on" : ""}`}
        aria-label={total ? `채팅, 안 읽은 메시지 ${total}개` : "채팅"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3.5c-4.97 0-9 3.36-9 7.5 0 2.2 1.14 4.18 2.96 5.55L5.2 20.2l4.02-2.13c.9.22 1.83.33 2.78.33 4.97 0 9-3.36 9-7.5S16.97 3.5 12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="8.2" cy="11" r="1.1" fill="currentColor" />
          <circle cx="12" cy="11" r="1.1" fill="currentColor" />
          <circle cx="15.8" cy="11" r="1.1" fill="currentColor" />
        </svg>
        {total > 0 && <span className="chat-icon-badge">{total > 99 ? "99+" : total}</span>}
      </button>

      {open && (
        <div className="chat-dropdown" role="menu">
          <div className="chat-dropdown-head">채팅</div>
          {adminLast && (
            <Link href="/support" className="chat-room chat-room-admin" onClick={() => setOpen(false)}>
              <span className="support-avatar" aria-hidden="true">🛡️</span>
              <div className="chat-room-body">
                <div className="chat-room-top">
                  <strong>Menco 운영팀</strong>
                  <span className="chat-room-time">{timeLabel(adminLast.createdAt)}</span>
                </div>
                <div className="chat-room-bottom">
                  <span className={`chat-room-preview ${adminUnread ? "bold" : ""}`}>{adminLast.from === "mentor" ? "나: " : ""}{adminLast.text}</span>
                  {adminUnread > 0 && <span className="unread">{adminUnread}</span>}
                </div>
              </div>
            </Link>
          )}
          {rooms.length === 0 && !adminLast ? (
            <div className="chat-dropdown-empty">
              아직 채팅방이 없어요.
              <br />
              {isMentor ? "학생의 신청을 승인하면 채팅방이 생겨요." : "멘토가 신청을 승인하면 채팅방이 생겨요."}
            </div>
          ) : rooms.length === 0 ? null : (
            <ul className="chat-room-list">
              {rooms.map((r) => (
                <li key={r.req.id}>
                  <Link href={`/chat/${r.req.id}`} className="chat-room" onClick={() => setOpen(false)}>
                    <Avatar seed={r.seed} size={40} />
                    <div className="chat-room-body">
                      <div className="chat-room-top">
                        <strong>{r.name}</strong>
                        <span className="chat-room-time">{timeLabel(r.at)}</span>
                      </div>
                      <div className="chat-room-bottom">
                        <span className={`chat-room-preview ${r.unread ? "bold" : ""}`}>{r.preview}</span>
                        {r.unread > 0 && <span className="unread">{r.unread}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
