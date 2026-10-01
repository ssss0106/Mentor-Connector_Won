"use client";

// 운영자 페이지 헤더의 채팅 아이콘: 멘토들과의 대화방 목록과 안 읽은 메시지 수를 보여 준다.
// 대화방을 누르면 운영자 페이지의 멘토 관리 창이 채팅이 열린 상태로 뜬다.

import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { adminUnread, useStore } from "@/lib/store";

export const ADMIN_UNLOCK_KEY = "mentor-connector:admin";
export const ADMIN_OPEN_CHAT = "menco:admin-open-chat";

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  return new Date().toDateString() === d.toDateString()
    ? d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
};

export default function AdminChatMenu() {
  const store = useStore();
  const { ready, adminMessages, allMentors } = store;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  if (!ready || sessionStorage.getItem(ADMIN_UNLOCK_KEY) !== "1") return null;

  const rooms = [...new Set(adminMessages.map((m) => m.mentorId))]
    .map((mentorId) => {
      const mentor = allMentors.find((m) => m.id === mentorId);
      const last = adminMessages.filter((m) => m.mentorId === mentorId).at(-1)!;
      return { mentorId, mentor, last, unread: adminUnread(store, mentorId) };
    })
    .sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
  const total = rooms.reduce((sum, r) => sum + r.unread, 0);

  return (
    <div className="chat-menu" ref={ref}>
      <button
        type="button"
        className={`chat-icon-btn ${open ? "on" : ""}`}
        aria-label={total ? `멘토 채팅, 안 읽은 메시지 ${total}개` : "멘토 채팅"}
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
          <div className="chat-dropdown-head">멘토 채팅</div>
          {rooms.length === 0 ? (
            <div className="chat-dropdown-empty">
              아직 멘토와 나눈 대화가 없어요.
              <br />
              멘토 관리에서 채팅을 시작할 수 있어요.
            </div>
          ) : (
            <ul className="chat-room-list">
              {rooms.map((r) => (
                <li key={r.mentorId}>
                  <button
                    type="button"
                    className="chat-room chat-room-btn"
                    onClick={() => {
                      setOpen(false);
                      window.dispatchEvent(new CustomEvent(ADMIN_OPEN_CHAT, { detail: r.mentorId }));
                    }}
                  >
                    <Avatar seed={`${r.mentor?.id ?? ""}${r.mentor?.name ?? ""}`} size={40} />
                    <div className="chat-room-body">
                      <div className="chat-room-top">
                        <strong>{r.mentor?.name ?? "멘토"} 멘토</strong>
                        <span className="chat-room-time">{timeLabel(r.last.createdAt)}</span>
                      </div>
                      <div className="chat-room-bottom">
                        <span className={`chat-room-preview ${r.unread ? "bold" : ""}`}>
                          {r.last.from === "admin" ? "나: " : ""}
                          {r.last.text}
                        </span>
                        {r.unread > 0 && <span className="unread">{r.unread}</span>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
