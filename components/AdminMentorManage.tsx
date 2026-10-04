"use client";

// 운영자 페이지: 멘토 활동 관리 (활동 정지·영구 정지·정지 해제·운영자 채팅)

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import {
  activeSanction,
  banMentor,
  isExcellentMentor,
  mentorRecord,
  setExcellent,
  liftSanction,
  markAdminChatRead,
  sendAdminMessage,
  suspendMentor,
  useStore,
} from "@/lib/store";
import type { MentorSanction } from "@/lib/types";

export const SUSPEND_DAYS = [3, 7, 14, 30];

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "-";
const dateOnly = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("ko-KR") : "-");

export function sanctionLabel(s?: MentorSanction) {
  if (!s) return "활동 중";
  return s.type === "banned" ? "영구 정지" : `활동 정지 (${dateOnly(s.until)}까지)`;
}

export function SanctionBadge({ s }: { s?: MentorSanction }) {
  return <span className={`badge ${!s ? "verify-approved" : s.type === "banned" ? "sanction-ban" : "sanction-suspend"}`}>{sanctionLabel(s)}</span>;
}

function AdminChat({ mentorId, mentorName }: { mentorId: string; mentorName: string }) {
  const { adminMessages } = useStore();
  const [text, setText] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const thread = adminMessages.filter((m) => m.mentorId === mentorId);

  useEffect(() => {
    // 페이지는 그대로 두고 대화 목록 상자 안에서만 맨 아래로 내린다
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
    markAdminChatRead(mentorId, "admin");
  }, [thread.length, mentorId]);

  const send = () => {
    if (!text.trim()) return;
    sendAdminMessage(mentorId, "admin", text.trim());
    setText("");
  };

  return (
    <div className="admin-chat">
      <div className="admin-chat-log" ref={logRef}>
        {thread.length === 0 && <div className="muted admin-chat-empty">{mentorName} 멘토에게 첫 메시지를 보내 보세요.</div>}
        {thread.map((m) => (
          <div key={m.id} className={`chat-bubble-wrap ${m.from === "admin" ? "me" : "them"}`}>
            <div className="chat-bubble">{m.text}</div>
            <span className="chat-meta">{m.from === "admin" ? "운영자" : `${mentorName} 멘토`} · {fmt(m.createdAt)}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
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
          placeholder="멘토에게 보낼 메시지 (Enter 전송, Shift+Enter 줄바꿈)"
        />
        <button type="button" className="btn" disabled={!text.trim()} onClick={send}>보내기</button>
      </div>
    </div>
  );
}

// 우수 멘토 선정: 후기·멘토링·안전 기록을 보고 운영자가 선정하거나 해제한다
function ExcellentRow({ mentorId, sanctioned }: { mentorId: string; sanctioned: boolean }) {
  const store = useStore();
  const on = isExcellentMentor(store, mentorId);
  const rec = mentorRecord(store, mentorId);
  return (
    <div className={`excellent-row ${on ? "on" : ""}`}>
      <div>
        <strong>{on ? "🏅 우수 멘토로 선정됨" : "우수 멘토 선정"}</strong>
        <div className="muted small">
          완료한 멘토링 {rec.completed}회 · 후기 {rec.reviewCount}개{rec.reviewCount > 0 && ` (평균 ★${rec.average.toFixed(1)})`} · 안전 알림 {rec.alerts}건
        </div>
        <div className="muted small">우수 멘토는 &apos;멘토 둘러보기&apos;에서 가장 먼저 보이고 🏅 표시가 붙어요.</div>
      </div>
      <button
        className={`btn btn-sm ${on ? "btn-ghost" : ""}`}
        disabled={sanctioned && !on}
        title={sanctioned && !on ? "활동이 제한된 멘토는 선정할 수 없어요" : undefined}
        onClick={() => setExcellent(mentorId, !on)}
      >
        {on ? "선정 해제" : "우수 멘토로 선정"}
      </button>
    </div>
  );
}

export function MentorManagePanel({ mentorId, onClose, openChat = false }: { mentorId: string; onClose: () => void; openChat?: boolean }) {
  const store = useStore();
  const { allMentors, sanctions, reports, inquiries, requests } = store;
  const mentor = allMentors.find((m) => m.id === mentorId);
  const [days, setDays] = useState(SUSPEND_DAYS[1]);
  const [reason, setReason] = useState("");
  const [showChat, setShowChat] = useState(openChat);
  if (!mentor) return null;

  const current = activeSanction(store, mentorId);
  const history = sanctions.filter((s) => s.mentorId === mentorId).reverse();
  const alertCount = reports.filter((r) => r.mentorId === mentorId).length;
  const mentorRequestIds = new Set(requests.filter((r) => r.mentorId === mentorId).map((r) => r.id));
  const reportCount = inquiries.filter((q) => q.type === "report" && q.role === "student" && q.requestId && mentorRequestIds.has(q.requestId)).length;

  return (
    <div className="card manage-panel">
      <div className="req-top">
        <div className="manage-who">
          <Avatar seed={mentor.id + mentor.name} size={48} />
          <div>
            <strong>{mentor.name} 멘토</strong>
            <div className="muted">{mentor.university} · {mentor.major} {mentor.grade}</div>
          </div>
        </div>
        <div className="manage-head-right">
          <SanctionBadge s={current} />
          <button className="link-btn" onClick={onClose} aria-label="닫기">닫기 ✕</button>
        </div>
      </div>

      <div className="manage-stats">
        <span>안전 알림 <strong>{alertCount}</strong>건</span>
        <span>피해 신고 <strong>{reportCount}</strong>건</span>
        <Link href={`/mentors/${mentor.id}`}>프로필 보기 →</Link>
      </div>

      <ExcellentRow mentorId={mentor.id} sanctioned={!!current} />

      {current ? (
        <div className="notice notice-warn manage-current">
          <strong>{sanctionLabel(current)}</strong>
          <span>사유: {current.reason}</span>
          <span className="muted">{fmt(current.createdAt)} 처리</span>
          <div>
            <button className="btn btn-sm btn-ghost" onClick={() => { if (confirm("조치를 해제할까요?")) liftSanction(mentor.id); }}>
              조치 해제
            </button>
          </div>
        </div>
      ) : (
        <div className="manage-actions">
          <div className="field">
            <label className="label" htmlFor="sanction-reason">조치 사유</label>
            <input id="sanction-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="예: 멘토링 중 개인 연락처 요구 (신고 접수)" />
          </div>
          <div className="manage-buttons">
            <div className="manage-suspend">
              <select className="select" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="정지 기간">
                {SUSPEND_DAYS.map((d) => <option key={d} value={d}>{d}일</option>)}
              </select>
              <button className="btn btn-sm btn-warn" disabled={!reason.trim()} onClick={() => { suspendMentor(mentor.id, days, reason.trim()); setReason(""); }}>
                활동 정지
              </button>
            </div>
            <button className="btn btn-sm btn-danger" disabled={!reason.trim()}
              onClick={() => { if (confirm(`${mentor.name} 멘토 계정을 영구 정지할까요?`)) { banMentor(mentor.id, reason.trim()); setReason(""); } }}>
              계정 영구 정지
            </button>
          </div>
          <p className="muted manage-hint">활동 정지·영구 정지된 멘토는 멘토 목록과 추천에서 빠지고 새 신청을 받을 수 없어요.</p>
        </div>
      )}

      <div className="manage-chat-toggle">
        <button className="btn btn-sm" onClick={() => setShowChat((v) => !v)}>
          💬 {showChat ? "채팅 닫기" : "채팅하기"}
        </button>
      </div>
      {showChat && <AdminChat mentorId={mentor.id} mentorName={mentor.name} />}

      {history.length > 0 && (
        <div className="manage-history">
          <strong>조치 기록</strong>
          <ul>
            {history.map((s) => (
              <li key={s.id}>
                <span>{fmt(s.createdAt)}</span>
                <span>{s.type === "banned" ? "영구 정지" : `활동 정지 ${s.days}일`} · {s.reason}</span>
                {s.liftedAt && <span className="muted">해제됨</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
