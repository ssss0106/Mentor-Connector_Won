"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import VerificationBadge from "@/components/VerificationBadge";
import { SEED_MENTORS } from "@/lib/data";
import { ADMIN_OPEN_CHAT, ADMIN_UNLOCK_KEY } from "@/components/AdminChatMenu";
import { MentorManagePanel, SanctionBadge } from "@/components/AdminMentorManage";
import { PHONE_RE, activeSanction, isExcellentMentor, adminUnread, answerInquiry, guardianMessage, guardianOf, maskPhone, sendGuardianAlert, isVerifiedMentor, reviewEnrollment, reviewVerification, setReportStatus, useStore } from "@/lib/store";
import type { Inquiry, Mentor, SafetyReport, VerificationStatus } from "@/lib/types";

// 운영자 페이지 (시연용)
// 데이터가 브라우저 localStorage에 있으므로, 멘토가 가입한 브라우저와 같은 브라우저에서 열어야 보인다.
// 아래 코드는 화면 진입을 막는 시연용 장치일 뿐 실제 보안 수단이 아니다.
const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "admin";
const UNLOCK_KEY = ADMIN_UNLOCK_KEY;
// 헤더의 운영자 채팅 아이콘이 잠금 상태 변화를 알 수 있게 한다
const notifyHeader = () => window.dispatchEvent(new Event("mentor-connector:change"));

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "-";

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ADMIN_CODE) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      notifyHeader();
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

// 신고 처리 결과
const DISPOSITIONS = ["경고 조치", "멘토링 활동 정지", "계정 영구 정지", "조치 없음 (사실 확인 불가)", "기타 조치"];

function InquiryAdminCard({ q, requestLabel, onManage }: { q: Inquiry; requestLabel?: string; onManage?: () => void }) {
  const [editing, setEditing] = useState(q.status === "open");
  const [answer, setAnswer] = useState(q.answer ?? "");
  const [disposition, setDisposition] = useState(q.disposition ?? "");
  const isReport = q.type === "report";
  const valid = answer.trim() && (!isReport || disposition);

  return (
    <div className={`card req ${isReport && q.status === "open" ? "inq-urgent" : ""}`}>
      <div className="req-top">
        <div className="inquiry-tags">
          <span className={`badge ${isReport ? "inq-report" : "inq-question"}`}>{isReport ? "신고" : "문의"}</span>
          <span className="muted">{q.category}</span>
        </div>
        <span className={`badge ${q.status === "answered" ? "inq-done" : "inq-wait"}`}>{q.status === "answered" ? "답변 완료" : "답변 대기"}</span>
      </div>
      <strong>{q.title}</strong>
      <p className="inquiry-content">{q.content}</p>
      <ul className="info-list admin-info">
        <li><span>작성자</span><span>{q.userName} ({q.role === "mentor" ? "멘토" : "학생"})</span></li>
        <li><span>작성 일시</span><span>{fmt(q.createdAt)}</span></li>
        {requestLabel && <li><span>관련 멘토링</span><span>{requestLabel}</span></li>}
        {q.targetName && <li><span>신고 대상</span><span>{q.targetName}</span></li>}
        {q.requestedAction && <li><span>요청한 처분</span><span>{q.requestedAction}</span></li>}
      </ul>
      {onManage && (
        <div className="req-actions manage-link">
          <button className="btn btn-sm btn-outline" onClick={onManage}>이 멘토 활동 관리 →</button>
        </div>
      )}

      {editing ? (
        <div className="reject-box">
          {isReport && (
            <select className="select" value={disposition} onChange={(e) => setDisposition(e.target.value)} aria-label="처리 결과">
              <option value="">처리 결과를 선택해 주세요</option>
              {DISPOSITIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          )}
          <textarea className="textarea" value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder={isReport ? "확인한 내용과 조치를 신고한 사람에게 안내해 주세요." : "문의에 대한 답변을 적어 주세요."} />
          <div className="req-actions">
            {q.status === "answered" && <button className="btn btn-sm btn-ghost" onClick={() => setEditing(false)}>취소</button>}
            <button className="btn btn-sm" disabled={!valid} onClick={() => { answerInquiry(q.id, answer.trim(), isReport ? disposition : undefined); setEditing(false); }}>
              답변 등록
            </button>
          </div>
        </div>
      ) : (
        <div className="inquiry-answer">
          <div className="inquiry-answer-head">
            <strong>등록한 답변</strong>
            <span className="muted">{fmt(q.answeredAt)} · {q.answerReadAt ? "작성자 확인함" : "작성자 미확인"}</span>
          </div>
          {q.disposition && <div className="inquiry-disposition">처리 결과 · <strong>{q.disposition}</strong></div>}
          <p>{q.answer}</p>
          <div className="req-actions">
            <button className="btn btn-sm btn-ghost" onClick={() => setEditing(true)}>답변 수정</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 안전 알림이 보호자에게 전달됐는지 보여 주고, 안 갔으면 운영자가 직접 보낸다
function GuardianStatus({ report }: { report: SafetyReport }) {
  const store = useStore();
  const alerts = store.guardianAlerts.filter((a) => a.reportId === report.id);
  const target = guardianOf(store, report);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(target?.phone ?? "");
  const [message, setMessage] = useState(guardianMessage(report));
  const last = alerts.at(-1);
  const phoneOk = PHONE_RE.test(phone.trim());

  return (
    <div className={`guardian-status ${last ? "sent" : "missing"}`}>
      <div className="guardian-status-head">
        {last ? (
          <span>
            ✓ <strong>보호자 알림 발송됨</strong> · {last.relation ?? "보호자"} {maskPhone(last.phone)} · {fmt(last.createdAt)} ·{" "}
            {last.sentBy === "auto" ? "자동 발송" : "운영자 발송"}
            {alerts.length > 1 && ` (총 ${alerts.length}회)`}
          </span>
        ) : (
          <span>
            ⚠ <strong>보호자 알림 미발송</strong> · {!target ? "연결된 멘토링 정보가 없어요" : !target.phone ? "보호자 연락처가 등록되지 않았어요" : "발송 기록이 없어요"}
          </span>
        )}
        {!open && (
          <button
            className={`btn btn-sm ${last ? "btn-ghost" : ""}`}
            onClick={() => {
              // 처음 화면을 그릴 때는 (시연방 데이터가 늦게 오면) 번호가 비어 있을 수 있어서, 여는 순간 최신 번호로 채운다
              setPhone(last?.phone ?? target?.phone ?? "");
              setMessage(guardianMessage(report));
              setOpen(true);
            }}
          >
            {last ? "다시 보내기" : "보호자에게 직접 보내기"}
          </button>
        )}
      </div>
      {open && (
        <div className="reject-box">
          <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="보호자 휴대폰 번호 (010-1234-5678)" aria-label="보호자 휴대폰 번호" />
          {!phoneOk && <div className="field-error">{phone.trim() ? "휴대폰 번호 형식으로 입력해 주세요." : "보낼 보호자 휴대폰 번호를 입력해 주세요."}</div>}
          <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} aria-label="보낼 문자 내용" />
          <div className="req-actions">
            <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>취소</button>
            <button
              className="btn btn-sm"
              disabled={!phoneOk || !message.trim()}
              onClick={() => {
                sendGuardianAlert(report.id, phone.trim(), message.trim());
                setOpen(false);
              }}
            >
              문자 보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SafetyCard({ report, onManage }: { report: SafetyReport; onManage: () => void }) {
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
      <GuardianStatus report={report} />
      <div className="req-actions">
        <button className="btn btn-sm btn-outline" onClick={onManage}>멘토 활동 관리 →</button>
        {report.status === "new" && (
          <>
            <button className="btn btn-sm btn-ghost" onClick={() => setReportStatus(report.id, "dismissed")}>오탐으로 처리</button>
            <button className="btn btn-sm" onClick={() => setReportStatus(report.id, "reviewed")}>확인 완료</button>
          </>
        )}
      </div>
    </div>
  );
}

type Tab = "verify" | "safety" | "mentors" | "requests" | "inquiries";

export default function AdminPage() {
  const store = useStore();
  const { ready, mentors, allMentors, requests, reports, inquiries } = store;
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>("verify");
  const [managed, setManaged] = useState<string | null>(null);
  const [mentorQuery, setMentorQuery] = useState("");
  const [chatReq, setChatReq] = useState({ id: "", n: 0 });

  // 신고·안전 알림에서 "멘토 활동 관리"를 누르면 멘토 관리 탭으로 이동한다
  const manage = (mentorId?: string) => {
    if (!mentorId) return;
    setManaged(mentorId);
    setTab("mentors");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === "1");
  }, []);

  // 헤더의 채팅 목록에서 멘토를 누르면 그 멘토의 관리 창을 채팅이 열린 채로 띄운다
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setManaged(id);
      setTab("mentors");
      setChatReq((c) => ({ id, n: c.n + 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener(ADMIN_OPEN_CHAT, onOpen);
    return () => window.removeEventListener(ADMIN_OPEN_CHAT, onOpen);
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
    { key: "mentors", label: `멘토 관리 (${allMentors.length})` },
    { key: "requests", label: `멘토링 신청 (${requests.length})` },
    { key: "inquiries", label: `문의·신고 (${inquiries.filter((q) => q.status === "open").length})` },
  ];
  // 답변 대기 → 신고 우선 → 최신순
  const sortedInquiries = [...inquiries].sort(
    (a, b) =>
      Number(a.status === "answered") - Number(b.status === "answered") ||
      Number(a.type !== "report") - Number(b.type !== "report") ||
      b.createdAt.localeCompare(a.createdAt),
  );
  const mentorOfRequest = (id?: string) => requests.find((x) => x.id === id)?.mentorId;
  const sanctionedCount = allMentors.filter((m) => activeSanction(store, m.id)).length;
  const guardianMissing = reports.filter((r) => r.status !== "dismissed" && !store.guardianAlerts.some((a) => a.reportId === r.id)).length;
  // 신고·알림이 많은 멘토와 안 읽은 채팅이 있는 멘토를 위로
  const issueCount = (id: string) =>
    reports.filter((r) => r.mentorId === id && r.status === "new").length +
    inquiries.filter((q) => q.type === "report" && q.role === "student" && q.status === "open" && mentorOfRequest(q.requestId) === id).length;
  const mq = mentorQuery.trim();
  const managedList = allMentors
    .filter((m) => !mq || m.name.includes(mq) || m.university.includes(mq) || m.major.includes(mq))
    .sort((a, b) => issueCount(b.id) - issueCount(a.id) || adminUnread(store, b.id) - adminUnread(store, a.id));
  const requestLabel = (id?: string) => {
    const r = requests.find((x) => x.id === id);
    return r ? `${r.studentName} 학생 ↔ ${allMentors.find((m) => m.id === r.mentorId)?.name ?? "-"} 멘토 · ${r.date} ${r.time}` : undefined;
  };

  return (
    <div className="container page">
      <h1 className="page-title">운영자 페이지</h1>
      <p className="page-sub">
        멘토 인증, 안전 알림, 문의·신고, 멘토 활동을 관리하는 운영자 화면이에요.{" "}
        <button
          className="link-btn"
          onClick={() => {
            sessionStorage.removeItem(UNLOCK_KEY);
            notifyHeader();
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
        <div className="card stat"><span>활동 제한 멘토</span><strong>{sanctionedCount}</strong></div>
        <div className="card stat"><span>보호자 알림 미발송</span><strong>{guardianMissing}</strong></div>
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
            음성과 전체 원문은 저장하지 않고 문제가 된 발언의 일부만 남아요. 학생이 보호자 연락처를 등록했다면 감지 즉시 보호자에게 문자 알림이 가고, 발송되지 않은 알림은 여기서 직접 보낼 수 있어요. 서버에 ALERT_WEBHOOK_URL을 설정하면 Slack·Discord로도 알림이 가요.
          </p>
          {sortedReports.length === 0 ? (
            <div className="card empty">감지된 안전 알림이 없어요.</div>
          ) : (
            <div className="req-list">
              {sortedReports.map((r) => <SafetyCard key={r.id} report={r} onManage={() => manage(r.mentorId)} />)}
            </div>
          )}
        </>
      )}

      {tab === "mentors" && (
        <>
          {managed && (
            <MentorManagePanel key={`${managed}-${chatReq.n}`} mentorId={managed} openChat={chatReq.id === managed} onClose={() => setManaged(null)} />
          )}
          <input className="input manage-search" value={mentorQuery} onChange={(e) => setMentorQuery(e.target.value)}
            placeholder="이름·대학·전공으로 멘토 찾기" aria-label="멘토 검색" />
          <table className="compare admin-table">
            <thead>
              <tr><th>이름</th><th>대학 · 전공</th><th>구분</th><th>재학 인증</th><th>경력 조회</th><th>활동 상태</th><th>우수 멘토</th><th>관리</th></tr>
            </thead>
            <tbody>
              {managedList.map((m) => {
                const issues = issueCount(m.id);
                const unread = adminUnread(store, m.id);
                return (
                  <tr key={m.id} className={managed === m.id ? "row-on" : ""}>
                    <td><Link href={`/mentors/${m.id}`}>{m.name}</Link></td>
                    <td>{m.university} · {m.major}</td>
                    <td>{isSeed(m) ? "기존 멘토" : "가입 멘토"}</td>
                    <td><VerificationBadge status={m.enrollment.status} kind="enrollment" /></td>
                    <td><VerificationBadge status={m.verification.status} /></td>
                    <td><SanctionBadge s={activeSanction(store, m.id)} /></td>
                    <td>{isExcellentMentor(store, m.id) ? <span className="excellent-badge inline">🏅 우수</span> : <span className="muted">-</span>}</td>
                    <td className="manage-cell">
                      <button className="btn btn-sm btn-ghost" onClick={() => manage(m.id)}>관리</button>
                      {issues > 0 && <span className="manage-flag" title="처리 안 된 신고·알림">🚨 {issues}</span>}
                      {unread > 0 && <span className="manage-flag" title="안 읽은 메시지">💬 {unread}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
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
      {tab === "inquiries" &&
        (sortedInquiries.length === 0 ? (
          <div className="card empty">들어온 문의가 없어요.</div>
        ) : (
          <div className="req-list">
            {sortedInquiries.map((q) => (
              <InquiryAdminCard
                key={q.id}
                q={q}
                requestLabel={requestLabel(q.requestId)}
                onManage={q.type === "report" && q.role === "student" && mentorOfRequest(q.requestId) ? () => manage(mentorOfRequest(q.requestId)) : undefined}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
