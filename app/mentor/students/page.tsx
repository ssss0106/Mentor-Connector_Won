"use client";

// 멘토가 멘티의 고민을 보고 먼저 멘토링을 제안하는 페이지
// 멘티의 이름·연락처·보호자 정보는 보여 주지 않고 학년·지역·관심 분야·고민만 공개한다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CONCERN_TOPICS, REGIONS, categoryLabel } from "@/lib/data";
import { activeSanction, getOpenStudents, isVerifiedMentor, menteeCode, sendOffer, useStore } from "@/lib/store";
import type { ConcernCategory, StudentProfile } from "@/lib/types";

const MAX_OFFER = 300;

// 고민 내용에 섞인 연락처는 가려서 보여 준다
const hidePersonal = (text: string) =>
  text
    .replace(/01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/g, "○○○")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "○○○");

function StudentCard({ p, mentorId, canOffer }: { p: StudentProfile; mentorId: string; canOffer: boolean }) {
  const { offers, requests } = useStore();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const sent = offers.filter((o) => o.mentorId === mentorId && o.studentId === p.userId).at(-1);
  const metBefore = requests.some((r) => r.mentorId === mentorId && r.studentId === p.userId);
  const status = sent?.status === "pending" ? "제안 보냄 · 답을 기다리는 중" : sent?.status === "accepted" ? "제안을 수락했어요" : sent?.status === "declined" ? "제안을 거절했어요" : "";

  return (
    <div className="card mentee-card">
      <div className="req-top">
        <div>
          <strong>{menteeCode(p.userId)}</strong>
          <div className="muted">{p.grade} · {p.region} · {categoryLabel(p.category)} 고민</div>
        </div>
        {metBefore && <span className="badge verify-approved">멘토링한 멘티</span>}
      </div>
      <div className="tags">
        {p.interests.map((i) => <span key={i} className="tag">{i}</span>)}
        {p.topics.map((t) => <span key={t} className="tag tag-soft">{t}</span>)}
      </div>
      <p className="mentee-concern">“{hidePersonal(p.concern)}”</p>
      <ul className="mentee-meta muted">
        {p.desiredMajor && <li>관심 전공 · {p.desiredMajor}</li>}
        {p.admissionPath && <li>준비 전형 · {p.admissionPath}</li>}
        {p.preferredCampus && <li>희망 대학 위치 · {p.preferredCampus}</li>}
        {p.availableTimes.length > 0 && <li>가능 시간 · {p.availableTimes.join(", ")}</li>}
      </ul>

      {status ? (
        <div className="offer-status">💌 {status}</div>
      ) : !canOffer ? null : open ? (
        <div className="reject-box">
          <textarea
            className="textarea"
            value={message}
            maxLength={MAX_OFFER}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="어떤 경험을 나눌 수 있는지 적어 주세요. 연락처나 외부 메신저 아이디는 적을 수 없어요."
          />
          {/01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}|카톡|카카오톡|오픈채팅|인스타|텔레그램/.test(message) && (
            <div className="field-error">연락처나 외부 메신저 이야기는 제안에 적을 수 없어요.</div>
          )}
          <div className="req-actions">
            <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>취소</button>
            <button
              className="btn btn-sm"
              disabled={message.trim().length < 10 || /01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}|카톡|카카오톡|오픈채팅|인스타|텔레그램/.test(message)}
              onClick={() => sendOffer(mentorId, p.userId, message.trim())}
            >
              제안 보내기
            </button>
          </div>
        </div>
      ) : (
        <div className="req-actions">
          <button className="btn btn-sm" onClick={() => setOpen(true)}>💌 멘토링 제안하기</button>
        </div>
      )}
    </div>
  );
}

export default function MenteeFindPage() {
  const router = useRouter();
  const store = useStore();
  const { ready, currentUser, allMentors } = store;
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState<ConcernCategory | "">("");

  useEffect(() => {
    if (ready && (!currentUser || currentUser.role !== "mentor")) router.replace("/signup?role=mentor");
  }, [ready, currentUser, router]);

  const mentor = currentUser?.mentorId ? allMentors.find((m) => m.id === currentUser.mentorId) : undefined;
  if (!ready || !currentUser) return null;
  if (!mentor) {
    return (
      <div className="container page empty">
        멘토 프로필을 먼저 등록해 주세요. <Link href="/mentor/profile">프로필 등록</Link>
      </div>
    );
  }

  const sanctioned = !!activeSanction(store, mentor.id);
  const verified = isVerifiedMentor(mentor);
  const canOffer = verified && !sanctioned;
  const students = getOpenStudents(store)
    .filter((p) => (!region || p.region === region) && (!category || p.category === category))
    .reverse();

  return (
    <div className="container page">
      <h1 className="page-title">멘티 찾기</h1>
      <p className="page-sub">
        멘토의 제안 받기에 동의한 멘티예요. 이름·연락처는 공개되지 않고, 멘티가 제안을 수락해 신청하면 멘토링이 시작돼요.
      </p>

      {!canOffer && (
        <div className="card notice notice-warn">
          {sanctioned
            ? "활동이 제한된 동안에는 멘티에게 제안할 수 없어요."
            : "재학 인증과 경력 조회 확인을 마치면 멘티에게 제안할 수 있어요."}
        </div>
      )}

      <div className="mentee-filters">
        <select className="select" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="지역">
          <option value="">전체 지역</option>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value as ConcernCategory | "")} aria-label="고민 유형">
          <option value="">전체 고민</option>
          {(Object.keys(CONCERN_TOPICS) as ConcernCategory[]).map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
        </select>
        <span className="muted">{students.length}명</span>
      </div>

      {students.length === 0 ? (
        <div className="card empty">조건에 맞는 멘티가 없어요.</div>
      ) : (
        <div className="mentee-grid">
          {students.map((p) => <StudentCard key={p.userId} p={p} mentorId={mentor.id} canOffer={canOffer} />)}
        </div>
      )}
    </div>
  );
}
