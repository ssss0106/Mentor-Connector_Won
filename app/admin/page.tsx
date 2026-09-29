"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import VerificationBadge from "@/components/VerificationBadge";
import { SEED_MENTORS } from "@/lib/data";
import { reviewVerification, useStore } from "@/lib/store";
import type { Mentor } from "@/lib/types";

// 운영자 페이지 (시연용)
// 데이터가 브라우저 localStorage에 있으므로, 멘토가 가입한 브라우저와 같은 브라우저에서 열어야 보인다.
// 아래 코드는 화면 진입을 막는 시연용 장치일 뿐 실제 보안 수단이 아니다.
const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "admin";
const UNLOCK_KEY = "mentor-connector:admin";

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "-";

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ADMIN_CODE) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      onUnlock();
    } else setError(true);
  };
  return (
    <div className="container narrow page">
      <h1 className="page-title">운영자 페이지</h1>
      <form className="form card" onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="code">운영자 코드</label>
          <input id="code" type="password" className="input" value={code} onChange={(e) => { setCode(e.target.value); setError(false); }} />
          {error && <div className="field-error">코드가 맞지 않아요.</div>}
        </div>
        <button className="btn btn-block">들어가기</button>
      </form>
    </div>
  );
}

function ReviewCard({ mentor }: { mentor: Mentor }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const v = mentor.verification;

  return (
    <div className="card req">
      <div className="req-top">
        <div>
          <strong>{mentor.name}</strong>
          <span className="muted"> · {mentor.university} {mentor.major} {mentor.grade}</span>
        </div>
        <VerificationBadge status={v.status} />
      </div>

      <ul className="info-list admin-info">
        <li><span>동의서 서명</span><span>{v.consentName ?? "-"}</span></li>
        <li><span>동의 일시</span><span>{fmt(v.consentAt)}</span></li>
        <li><span>첨부 파일</span><span>{v.fileName ?? "-"}</span></li>
        <li><span>제출 일시</span><span>{fmt(v.submittedAt)}</span></li>
        {(v.status === "approved" || v.status === "rejected") && <li><span>처리 일시</span><span>{fmt(v.reviewedAt)}</span></li>}
        {v.status === "rejected" && <li><span>반려 사유</span><span>{v.rejectReason || "-"}</span></li>}
      </ul>

      {v.status === "pending" && (
        <>
          <div className="admin-checklist">
            서류에서 확인할 것: 이름이 프로필·서명과 같은지 · 발급일이 최근인지 · 두 항목 모두 조회 결과가 &lsquo;해당 없음&rsquo;인지
          </div>
          {rejecting ? (
            <div className="reject-box">
              <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="반려 사유 (예: 서류의 이름이 프로필과 달라요)" />
              <div className="req-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => setRejecting(false)}>취소</button>
                <button className="btn btn-sm btn-danger" disabled={!reason.trim()} onClick={() => reviewVerification(mentor.id, false, reason.trim())}>
                  반려하기
                </button>
              </div>
            </div>
          ) : (
            <div className="req-actions">
              <button className="btn btn-sm btn-ghost" onClick={() => setRejecting(true)}>반려</button>
              <button className="btn btn-sm" onClick={() => reviewVerification(mentor.id, true)}>확인 완료</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type Tab = "verify" | "mentors" | "requests";

export default function AdminPage() {
  const { ready, mentors, allMentors, requests } = useStore();
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>("verify");

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === "1");
  }, []);

  if (!ready) return null;
  if (!unlocked) return <AdminGate onUnlock={() => setUnlocked(true)} />;

  // 가입한 멘토만 서류 확인 대상 (시연용 가상 멘토는 이미 확인 완료)
  const order = { pending: 0, rejected: 1, not_submitted: 2, approved: 3 } as const;
  const reviewTargets = [...mentors]
    .filter((m) => m.verification.status !== "not_submitted")
    .sort((a, b) => order[a.verification.status] - order[b.verification.status]);
  const count = (s: Mentor["verification"]["status"]) => allMentors.filter((m) => m.verification.status === s).length;
  const isSeed = (m: Mentor) => SEED_MENTORS.some((s) => s.id === m.id);

  const tabs: { key: Tab; label: string }[] = [
    { key: "verify", label: `경력 조회 확인 (${count("pending")})` },
    { key: "mentors", label: `멘토 전체 (${allMentors.length})` },
    { key: "requests", label: `멘토링 신청 (${requests.length})` },
  ];

  return (
    <div className="container page">
      <h1 className="page-title">운영자 페이지</h1>
      <p className="page-sub">
        시연용 운영자 화면이에요. 이 브라우저에 저장된 데이터만 보여요.{" "}
        <button
          className="link-btn"
          onClick={() => {
            sessionStorage.removeItem(UNLOCK_KEY);
            setUnlocked(false);
          }}
        >
          나가기
        </button>
      </p>

      <div className="stats">
        <div className="card stat"><span>확인 대기</span><strong>{count("pending")}</strong></div>
        <div className="card stat"><span>경력 조회 완료</span><strong>{count("approved")}</strong></div>
        <div className="card stat"><span>반려</span><strong>{count("rejected")}</strong></div>
        <div className="card stat"><span>서류 미제출</span><strong>{count("not_submitted")}</strong></div>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "verify" &&
        (reviewTargets.length === 0 ? (
          <div className="card empty">
            확인할 서류가 없어요.
            <br />
            <span className="muted">멘토로 가입해 동의서와 파일을 제출하면 여기에 나타나요.</span>
          </div>
        ) : (
          <div className="req-list">
            {reviewTargets.map((m) => <ReviewCard key={m.id} mentor={m} />)}
          </div>
        ))}

      {tab === "mentors" && (
        <table className="compare admin-table">
          <thead>
            <tr><th>이름</th><th>대학 · 전공</th><th>구분</th><th>경력 조회</th></tr>
          </thead>
          <tbody>
            {allMentors.map((m) => (
              <tr key={m.id}>
                <td><Link href={`/mentors/${m.id}`}>{m.name}</Link></td>
                <td>{m.university} · {m.major}</td>
                <td>{isSeed(m) ? "시연용 가상 멘토" : "가입 멘토"}</td>
                <td><VerificationBadge status={m.verification.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "requests" &&
        (requests.length === 0 ? (
          <div className="card empty">아직 멘토링 신청이 없어요.</div>
        ) : (
          <table className="compare admin-table">
            <thead>
              <tr><th>신청 일시</th><th>학생</th><th>멘토</th><th>희망 일정</th><th>상태</th></tr>
            </thead>
            <tbody>
              {[...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => (
                <tr key={r.id}>
                  <td>{fmt(r.createdAt)}</td>
                  <td>{r.studentName}</td>
                  <td>{allMentors.find((m) => m.id === r.mentorId)?.name ?? "-"}</td>
                  <td>{r.date} · {r.time}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </div>
  );
}
