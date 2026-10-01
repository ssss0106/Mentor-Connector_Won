"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import VerificationBadge from "@/components/VerificationBadge";
import { SEED_MENTORS } from "@/lib/data";
import { isVerifiedMentor, reviewEnrollment, reviewVerification, setReportStatus, useStore } from "@/lib/store";
import type { Mentor, SafetyReport, VerificationStatus } from "@/lib/types";

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

// 서류 한 종류(재학 인증 또는 경력 조회)의 확인 영역
function DocReview({
  title,
  kind,
  status,
  rows,
  checklist,
  rejectReason,
  onReview,
}: {
  title: string;
  kind: "enrollment" | "background";
  status: VerificationStatus;
  rows: [string, string][];
  checklist: string;
  rejectReason?: string;
  onReview: (approve: boolean, reason?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="doc-review">
      <div className="req-top">
        <strong>{title}</strong>
        <VerificationBadge status={status} kind={kind} />
      </div>
      {status === "not_submitted" ? (
        <div className="muted">아직 제출하지 않았어요.</div>
      ) : (
        <ul className="info-list admin-info">
          {rows.map(([k, v]) => (
            <li key={k}><span>{k}</span><span>{v}</span></li>
          ))}
          {status === "rejected" && <li><span>반려 사유</span><span>{rejectReason || "-"}</span></li>}
        </ul>
      )}

      {status === "pending" && (
        <>
          <div className="admin-checklist">서류에서 확인할 것: {checklist}</div>
          {rejecting ? (
            <div className="reject-box">
              <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="반려 사유 (예: 서류의 이름이 프로필과 달라요)" />
              <div className="req-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => setRejecting(false)}>취소</button>
                <button className="btn btn-sm btn-danger" disabled={!reason.trim()} onClick={() => onReview(false, reason.trim())}>
                  반려하기
                </button>
              </div>
            </div>
          ) : (
            <div className="req-actions">
              <button className="btn btn-sm btn-ghost" onClick={() => setRejecting(true)}>반려</button>
              <button className="btn btn-sm" onClick={() => onReview(true)}>확인 완료</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewCard({ mentor }: { mentor: Mentor }) {
  const e = mentor.enrollment;
  const v = mentor.verification;
  return (
    <div className="card req">
      <div className="req-top">
        <div>
          <strong>{mentor.name}</strong>
          <span className="muted"> · {mentor.university} {mentor.major} {mentor.grade}</span>
        </div>
        {isVerifiedMentor(mentor) && <span className="badge verify-approved">✓ 학생에게 공개 중</span>}
      </div>
      <DocReview
        title="재학 인증"
        kind="enrollment"
        status={e.status}
        rows={[
          ["재학증명서", e.enrollmentFileName ?? "-"],
          ["성적증명서", e.transcriptFileName ?? "-"],
          ["제출 일시", fmt(e.submittedAt)],
          ...((e.status === "approved" || e.status === "rejected") ? [["처리 일시", fmt(e.reviewedAt)] as [string, string]] : []),
        ]}
        checklist={`학교·전공이 프로필(${mentor.university} ${mentor.major})과 같은지 · 이름이 같은지 · 발급일이 3개월 이내인지`}
        rejectReason={e.rejectReason}
        onReview={(ok, reason) => reviewEnrollment(mentor.id, ok, reason)}
      />
      <DocReview
        title="경력 조회"
        kind="background"
        status={v.status}
        rows={[
          ["동의서 서명", v.consentName ?? "-"],
          ["동의 일시", fmt(v.consentAt)],
          ["첨부 파일", v.fileName ?? "-"],
          ["제출 일시", fmt(v.submittedAt)],
          ...((v.status === "approved" || v.status === "rejected") ? [["처리 일시", fmt(v.reviewedAt)] as [string, string]] : []),
        ]}
        checklist="이름이 프로필·서명과 같은지 · 발급일이 최근인지 · 두 항목 모두 조회 결과가 ‘해당 없음’인지"
        rejectReason={v.rejectReason}
        onReview={(ok, reason) => reviewVerification(mentor.id, ok, reason)}
      />
    </div>
  );
}

function SafetyCard({ report }: { report: SafetyReport }) {
  const urgent = report.severity === "urgent";
  return (
    <div className={`card req safety-card ${urgent ? "urgent" : ""} ${report.status !== "new" ? "done" : ""}`}>
      <div className="req-top">
        <div>
          <span className={`sev ${urgent ? "sev-urgent" : "sev-warning"}`}>{urgent ? "긴급" : "주의"}</span>{" "}
          <span className="sev sev-source">{report.source === "chat" ? "💬 채팅" : "🎙️ 수업 녹음"}</span>{" "}
          <strong>{report.mentorName} 멘토 × {report.studentName} 학생</strong>
          <div className="muted">
            {fmt(report.createdAt)} · 신청번호 {report.requestId}
            {report.source === "chat" && report.senderRole && ` · ${report.senderRole === "mentor" ? "멘토가" : "학생이"} 보낸 메시지`}
          </div>
        </div>
        {report.status !== "new" && <span className="badge">{report.status === "reviewed" ? "확인 완료" : "오탐 처리"}</span>}
      </div>
      <div className="tags" style={{ marginTop: 8 }}>
        {report.types.map((t) => <span key={t} className="tag">{t}</span>)}
      </div>
      <p className="safety-quote">“{report.excerpt || "발언 내용 없음"}”</p>
      <p className="muted" style={{ margin: 0 }}>{report.reason}</p>
      {report.status === "new" && (
        <div className="req-actions">
          <button className="btn btn-sm btn-ghost" onClick={() => setReportStatus(report.id, "dismissed")}>오탐으로 처리</button>
          <button className="btn btn-sm" onClick={() => setReportStatus(report.id, "reviewed")}>확인 완료</button>
        </div>
      )}
    </div>
  );
}

type Tab = "verify" | "safety" | "mentors" | "requests";

export default function AdminPage() {
  const { ready, mentors, allMentors, requests, reports } = useStore();
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>("verify");

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === "1");
  }, []);

  if (!ready) return null;
  if (!unlocked) return <AdminGate onUnlock={() => setUnlocked(true)} />;

  // 가입한 멘토만 서류 확인 대상 (시연용 가상 멘토는 이미 인증 완료)
  const statuses = (m: Mentor) => [m.enrollment.status, m.verification.status];
  const rank = (m: Mentor) => {
    const st = statuses(m);
    return st.includes("pending") ? 0 : st.includes("rejected") ? 1 : isVerifiedMentor(m) ? 3 : 2;
  };
  const reviewTargets = mentors
    .filter((m) => statuses(m).some((st) => st !== "not_submitted"))
    .sort((a, b) => rank(a) - rank(b));
  const pendingCount = allMentors.filter((m) => statuses(m).includes("pending")).length;
  const doneCount = allMentors.filter(isVerifiedMentor).length;
  const rejectedCount = allMentors.filter((m) => statuses(m).includes("rejected")).length;
  const missingCount = allMentors.filter((m) => statuses(m).includes("not_submitted")).length;
  const isSeed = (m: Mentor) => SEED_MENTORS.some((s) => s.id === m.id);

  const newReports = reports.filter((r) => r.status === "new").length;
  const sortedReports = [...reports].sort(
    (a, b) =>
      Number(a.status !== "new") - Number(b.status !== "new") ||
      Number(b.severity === "urgent") - Number(a.severity === "urgent") ||
      b.createdAt.localeCompare(a.createdAt),
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "verify", label: `인증 서류 확인 (${pendingCount})` },
    { key: "safety", label: `안전 알림 (${newReports})` },
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
        <div className="card stat"><span>확인 대기 멘토</span><strong>{pendingCount}</strong></div>
        <div className="card stat"><span>인증 완료 멘토</span><strong>{doneCount}</strong></div>
        <div className="card stat"><span>반려 있음</span><strong>{rejectedCount}</strong></div>
        <div className="card stat"><span>서류 미제출 있음</span><strong>{missingCount}</strong></div>
        <div className="card stat"><span>새 안전 알림</span><strong>{newReports}</strong></div>
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
            <span className="muted">멘토로 가입해 재학 서류나 경력 조회 서류를 제출하면 여기에 나타나요.</span>
          </div>
        ) : (
          <div className="req-list">
            {reviewTargets.map((m) => <ReviewCard key={m.id} mentor={m} />)}
          </div>
        ))}

      {tab === "safety" && (
        <>
          <p className="muted small" style={{ marginTop: 0 }}>
            수업 녹음과 채팅에서 AI가 비속어·괴롭힘·위험 표현, 외부 연락 유도 등을 감지하면 여기에 나타나요. AI의 자동 판단이라 오탐이 있을 수 있으니 사람이 확인해 주세요.
            음성과 전체 원문은 저장하지 않고 문제가 된 발언의 일부만 남아요. 시연 버전에서는 이 브라우저에서 녹음한 알림만 보이고, 서버에 ALERT_WEBHOOK_URL을 설정하면 Slack·Discord로도 알림이 가요.
          </p>
          {sortedReports.length === 0 ? (
            <div className="card empty">감지된 안전 알림이 없어요.</div>
          ) : (
            <div className="req-list">
              {sortedReports.map((r) => <SafetyCard key={r.id} report={r} />)}
            </div>
          )}
        </>
      )}

      {tab === "mentors" && (
        <table className="compare admin-table">
          <thead>
            <tr><th>이름</th><th>대학 · 전공</th><th>구분</th><th>재학 인증</th><th>경력 조회</th></tr>
          </thead>
          <tbody>
            {allMentors.map((m) => (
              <tr key={m.id}>
                <td><Link href={`/mentors/${m.id}`}>{m.name}</Link></td>
                <td>{m.university} · {m.major}</td>
                <td>{isSeed(m) ? "시연용 가상 멘토" : "가입 멘토"}</td>
                <td><VerificationBadge status={m.enrollment.status} kind="enrollment" /></td>
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
