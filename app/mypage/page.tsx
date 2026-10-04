"use client";

import SummaryView from "@/components/SummaryView";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import VerificationBadge from "@/components/VerificationBadge";
import { STATUS_LABEL, categoryLabel, formatPrice } from "@/lib/data";
import { formatSession } from "@/lib/schedule";
import Avatar from "@/components/Avatar";
import { activeSanction, agreeRecording, canChat, consentOf, sessionDayReached, canStudentModify, cancelRequest, roomActiveRequest, sessionStarted, maskPhone, mentorUnreadFromAdmin, resetAll, respondOffer, setRequestStatus, unreadCount, useStore } from "@/lib/store";
import type { Mentor, MentoringRequest, RequestStatus, VerificationStatus } from "@/lib/types";

const FLOW: RequestStatus[] = ["pending", "approved", "scheduled", "completed"];

function StatusFlow({ status }: { status: RequestStatus }) {
  if (status === "cancelled") return null;
  const idx = FLOW.indexOf(status);
  return (
    <div className="status-flow">
      {FLOW.map((s, i) => (
        <span key={s} className={i <= idx ? "done" : ""}>
          {STATUS_LABEL[s]}
          {i < FLOW.length - 1 && " → "}
        </span>
      ))}
    </div>
  );
}

// 멘토가 누를 수 있는 다음 단계 버튼
const NEXT_ACTION: Partial<Record<RequestStatus, { label: string; next: RequestStatus }>> = {
  pending: { label: "승인하기", next: "approved" },
  approved: { label: "일정 확정", next: "scheduled" },
  scheduled: { label: "멘토링 완료", next: "completed" },
};

// 화상 멘토링 입장: 내가 AI 녹음·요약에 동의해야 입장 버튼을 누를 수 있다
function RoomEntry({ req, asMentor }: { req: MentoringRequest; asMentor: boolean }) {
  const store = useStore();
  const mine = consentOf(store, req, asMentor ? "mentor" : "student");
  const theirs = consentOf(store, req, asMentor ? "student" : "mentor");
  // 화상 멘토링은 멘토링 날짜부터 들어갈 수 있다
  const dayReached = sessionDayReached(req);
  return (
    <div className="room-entry">
      <label className="check">
        <input type="checkbox" checked={!!mine} disabled={!!mine} onChange={(e) => e.target.checked && agreeRecording(req.id, asMentor ? "mentor" : "student")} />
        <span>
          <strong>[필수] AI 녹음·요약 동의</strong> · 멘토링이 시작되면 자동으로 녹음되고, 끝나면 AI가 요약을 만들어요. 음성 파일과 받아쓴 원문은 저장하지 않아요.
          비속어·괴롭힘·위험한 표현이 감지되면 그 발언의 일부가 운영자와 보호자에게 전달될 수 있어요.
        </span>
      </label>
      <div className="room-entry-row">
        <span className="muted small">{asMentor ? "학생" : "멘토"} 동의: {theirs ? "완료" : "아직 안 했어요"}</span>
        {mine && dayReached ? (
          <Link href={`/room/${req.id}`} className="btn btn-sm btn-video">🎥 화상 멘토링 입장</Link>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-video"
            disabled
            title={!mine ? "AI 녹음·요약에 동의해야 입장할 수 있어요" : "멘토링 날짜부터 입장할 수 있어요"}
          >
            🎥 화상 멘토링 입장
          </button>
        )}
      </div>
      {!dayReached && <div className="muted small room-entry-note">{formatSession(req.date, req.time)} 멘토링 당일부터 입장할 수 있어요.</div>}
    </div>
  );
}

function RequestItem({ req, mentor, asMentor, unread, reviewed, locked }: { req: MentoringRequest; mentor?: Mentor; asMentor: boolean; unread: number; reviewed: boolean; locked?: boolean }) {
  // 활동이 제한된 멘토는 신청을 처리할 수 없고, 확정 전에 일정이 지난 신청은 진행할 수 없다
  const expired = (req.status === "pending" || req.status === "approved") && sessionStarted(req);
  // 멘토링 완료는 멘토링 날짜가 된 뒤에만 할 수 있다
  const tooEarly = req.status === "scheduled" && !sessionDayReached(req);
  const action = locked || expired || tooEarly ? undefined : NEXT_ACTION[req.status];
  return (
    <div className="card req">
      <div className="req-top">
        <div>
          <strong>{asMentor ? `${req.studentName} 학생` : `${mentor?.name ?? "알 수 없음"} 멘토`}</strong>
          {!asMentor && mentor && <span className="muted"> · {mentor.university} {mentor.major}</span>}
          <div className="muted">
            {formatSession(req.date, req.time)} · {req.method}
            {!asMentor && req.price !== undefined && ` · ${formatPrice(req.price)}`}
          </div>
        </div>
        <StatusBadge status={req.status} />
      </div>
      {(req.followUpOf || req.offerId || req.changedAt) && (
        <div className="req-labels">
          {req.changedAt && req.status === "pending" && <span className="tag">✏️ {asMentor ? "학생이 일정·내용을 바꿨어요" : "변경한 신청"}</span>}
          {req.followUpOf && <span className="tag">🔁 이어서 하는 멘토링</span>}
          {req.offerId && <span className="tag">💌 {asMentor ? "내 제안을 수락한 신청" : "멘토 제안으로 신청"}</span>}
        </div>
      )}
      <p className="req-msg">{req.message}</p>
      <StatusFlow status={req.status} />
      {tooEarly && asMentor && !locked && <div className="muted small">멘토링 당일부터 완료 처리할 수 있어요.</div>}
      {expired && <div className="muted small">확정되기 전에 일정이 지났어요. {asMentor ? "학생이 새로 신청하면 진행할 수 있어요." : "새 일정으로 다시 신청해 주세요."}</div>}
      {req.status === "cancelled" && (
        <div className="muted small">{asMentor ? "학생이" : "내가"} {req.cancelledAt ? new Date(req.cancelledAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : ""}에 취소한 신청이에요.</div>
      )}
      {!asMentor && canStudentModify(req) && (
        <div className="req-actions">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              if (confirm(`${formatSession(req.date, req.time)} 멘토링 신청을 취소할까요?`)) cancelRequest(req.id);
            }}
          >
            신청 취소
          </button>
          {mentor && (
            <Link href={`/mentors/${mentor.id}/apply?change=${req.id}`} className="btn btn-sm btn-outline">
              ✏️ 일정·내용 변경
            </Link>
          )}
        </div>
      )}
      {req.summary && (
        <details className="summary-details">
          <summary>📝 AI 수업 요약 보기</summary>
          <SummaryView summary={req.summary} />
        </details>
      )}
      {!asMentor && req.status === "completed" && (
        <div className="req-actions">
          {mentor && (
            <Link href={`/mentors/${mentor.id}/apply?from=${req.id}`} className="btn btn-sm btn-outline">
              🔁 이 멘토와 이어서 멘토링
            </Link>
          )}
          {reviewed ? (
            <span className="review-done">✓ 후기를 남겼어요</span>
          ) : (
            <Link href={`/review/${req.id}`} className="btn btn-sm">
              ✍️ 후기 쓰기
            </Link>
          )}
        </div>
      )}
      {(canChat(req) || (asMentor && action)) && (
        <div className="req-actions">
          {canChat(req) && (
            <Link href={`/chat/${req.id}`} className="btn btn-sm btn-ghost chat-btn">
              💬 채팅{unread > 0 && <span className="unread">{unread}</span>}
            </Link>
          )}
          {asMentor && action && (
            <button className={`btn btn-sm ${req.status === "scheduled" ? "btn-ghost" : ""}`} onClick={() => setRequestStatus(req.id, action.next)}>
              {action.label}
            </button>
          )}
        </div>
      )}
      {req.status === "scheduled" && <RoomEntry req={req} asMentor={asMentor} />}
    </div>
  );
}

// 멘토 인증 항목 한 줄 (재학 인증 / 경력 조회)
function VerifyRow({ kind, title, status, reason, todo }: {
  kind: "enrollment" | "background";
  title: string;
  status: VerificationStatus;
  reason?: string;
  todo: string;
}) {
  const desc = {
    not_submitted: todo,
    pending: "운영자가 서류를 확인하고 있어요.",
    approved: "확인이 끝났어요.",
    rejected: `반려됐어요. 사유: ${reason || "사유 없음"}`,
  }[status];
  return (
    <div className="verify-row">
      <div>
        <strong>{title}</strong> <VerificationBadge status={status} kind={kind} />
        <div className="muted">{desc}</div>
      </div>
      {(status === "not_submitted" || status === "rejected") && (
        <Link href="/mentor/verify" className="btn btn-sm">
          {status === "rejected" ? "다시 제출" : "제출하기"}
        </Link>
      )}
    </div>
  );
}

type Tab = "all" | "upcoming" | "done";

export default function MyPage() {
  const router = useRouter();
  const store = useStore();
  const { ready, currentUser, myProfile, requests, allMentors, messages, lastRead, allReviews, inquiries, adminMessages, offers, guardianAlerts } = store;
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (ready && !currentUser) router.replace("/signup");
  }, [ready, currentUser, router]);

  if (!ready || !currentUser) return null;

  const isMentor = currentUser.role === "mentor";
  const myMentor = isMentor ? allMentors.find((m) => m.id === currentUser.mentorId) : undefined;
  const sanction = myMentor ? activeSanction(store, myMentor.id) : undefined;
  const hasAdminThread = !!myMentor && adminMessages.some((m) => m.mentorId === myMentor.id);
  const adminUnreadCount = myMentor ? mentorUnreadFromAdmin(store, myMentor.id, currentUser.id) : 0;
  const myOffers = isMentor ? [] : offers.filter((o) => o.studentId === currentUser.id && o.status === "pending").reverse();
  const sentOffers = myMentor ? offers.filter((o) => o.mentorId === myMentor.id) : [];
  const myAlerts = isMentor ? [] : guardianAlerts.filter((a) => a.studentId === currentUser.id).reverse();

  const mine = requests
    .filter((r) => (isMentor ? r.mentorId === currentUser.mentorId : r.studentId === currentUser.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const shown = mine.filter((r) =>
    tab === "all"
      ? r.status !== "completed" && r.status !== "cancelled"
      : tab === "upcoming"
        ? r.status === "scheduled"
        : r.status === "completed" || r.status === "cancelled",
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: isMentor ? "받은 신청" : "내 신청 현황" },
    { key: "upcoming", label: "예정된 멘토링" },
    { key: "done", label: "지난 멘토링" },
  ];

  return (
    <div className="container page">
      <h1 className="page-title">마이페이지</h1>
      <p className="page-sub">
        {isMentor ? "🎓 대학생 멘토" : "🎒 학생"} · {currentUser.name}님
      </p>

      {sanction && (
        <div className="card notice notice-warn sanction-banner">
          <strong>{sanction.type === "banned" ? "계정이 영구 정지됐어요." : `멘토 활동이 ${new Date(sanction.until ?? "").toLocaleDateString("ko-KR")}까지 정지됐어요.`}</strong>
          <span>사유: {sanction.reason}</span>
          <span className="muted">정지 기간에는 학생에게 프로필이 보이지 않고, 신청 처리와 채팅을 할 수 없어요. 궁금한 점은 운영팀에 문의해 주세요.</span>
        </div>
      )}

      {myMentor && (
        <div className="card inquiry-entry">
          <div>
            <strong>멘티 찾기</strong>
            <div className="muted">
              제안 받기에 동의한 멘티의 고민을 보고 먼저 멘토링을 제안할 수 있어요. 멘티의 이름과 연락처는 공개되지 않아요.
              {sentOffers.length > 0 && ` 보낸 제안 ${sentOffers.length}건 · 수락 ${sentOffers.filter((o) => o.status === "accepted").length}건`}
            </div>
          </div>
          <Link href="/mentor/students" className="btn btn-sm">멘티 찾기</Link>
        </div>
      )}

      {(sanction || hasAdminThread) && (
        <div className="card inquiry-entry">
          <div>
            <strong>운영팀 채팅</strong>
            {adminUnreadCount > 0 && <span className="badge inq-new">새 메시지 {adminUnreadCount}</span>}
            <div className="muted">운영팀이 멘토 활동과 관련해 보낸 메시지를 확인하고 답할 수 있어요.</div>
          </div>
          <Link href="/support" className="btn btn-sm">💬 채팅하기</Link>
        </div>
      )}

      {isMentor ? (
        <div className="card" style={{ marginBottom: 24 }}>
          {myMentor ? (
            <>
            <div className="req-top">
              <div>
                <strong>내 멘토 프로필</strong>
                <div className="muted">
                  {myMentor.university} · {myMentor.major} {myMentor.grade} — “{myMentor.intro}”
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/mentors/${myMentor.id}`} className="btn btn-sm btn-ghost">보기</Link>
                <Link href="/mentor/profile" className="btn btn-sm">프로필 관리</Link>
              </div>
            </div>
            <VerifyRow
              kind="enrollment"
              title="재학 인증"
              status={myMentor.enrollment.status}
              reason={myMentor.enrollment.rejectReason}
              todo="재학증명서와 성적증명서를 제출해야 학생에게 공개돼요."
            />
            <VerifyRow
              kind="background"
              title="경력 조회 확인"
              status={myMentor.verification.status}
              reason={myMentor.verification.rejectReason}
              todo="동의서와 조회 결과 파일을 제출해야 학생에게 공개돼요."
            />
            </>
          ) : (
            <div className="req-top">
              <span>아직 멘토 프로필이 없어요. 프로필을 등록해야 학생에게 추천돼요.</span>
              <Link href="/mentor/profile" className="btn btn-sm">프로필 등록</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="req-top">
            <div>
              <strong>내 고민</strong>
              <div className="muted">
                {myProfile ? `${myProfile.grade} · ${myProfile.region} · ${categoryLabel(myProfile.category)} — ${myProfile.concern}` : "아직 고민을 입력하지 않았어요."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Link href="/concern" className="btn btn-sm btn-ghost">
                {myProfile ? "수정" : "입력하기"}
              </Link>
              {myProfile && <Link href="/recommend" className="btn btn-sm">추천 멘토</Link>}
            </div>
          </div>
          <div className="guardian-info">
            <span>🛡️ 보호자 안전 알림</span>
            {myProfile?.guardianPhone ? (
              <span className="muted">
                {myProfile.guardianRelation} {maskPhone(myProfile.guardianPhone)} · 멘토링 중 안전 문제가 감지되면 바로 문자로 알려 드려요.
                {myAlerts.length > 0 && ` 지금까지 ${myAlerts.length}건 보냈어요.`}
              </span>
            ) : (
              <span className="muted">
                보호자 연락처가 없어요. <Link href="/concern">고민 수정</Link>에서 등록해 주세요.
              </span>
            )}
          </div>
          {myProfile && (
            <div className="guardian-info">
              <span>💌 멘토 제안 받기</span>
              <span className="muted">{myProfile.openToMentors ? "켜짐 · 멘토가 이름 없이 고민을 보고 먼저 제안할 수 있어요." : "꺼짐 · 고민 수정에서 켤 수 있어요."}</span>
            </div>
          )}
        </div>
      )}

      {myOffers.length > 0 && (
        <section className="offer-list">
          <h2 className="section-title">멘토에게 받은 제안 <span className="badge inq-new">새 제안 {myOffers.length}</span></h2>
          {myOffers.map((o) => {
            const m = allMentors.find((x) => x.id === o.mentorId);
            if (!m) return null;
            return (
              <div key={o.id} className="card offer-card">
                <div className="offer-head">
                  <Avatar seed={m.id + m.name} size={44} />
                  <div>
                    <strong>{m.name} 멘토</strong>
                    <div className="muted">{m.university} · {m.major} {m.grade}</div>
                  </div>
                </div>
                <p className="offer-msg">“{o.message}”</p>
                <div className="req-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => respondOffer(o.id, "declined")}>거절</button>
                  <Link href={`/mentors/${m.id}`} className="btn btn-sm btn-ghost">프로필 보기</Link>
                  <Link href={`/mentors/${m.id}/apply?offer=${o.id}`} className="btn btn-sm">시간 골라 신청하기</Link>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {(() => {
        const myInquiries = inquiries.filter((q) => q.userId === currentUser.id);
        const newAnswers = myInquiries.filter((q) => q.answer && !q.answerReadAt).length;
        const waiting = myInquiries.filter((q) => q.status === "open").length;
        return (
          <div className="card inquiry-entry">
            <div>
              <strong>문의하기</strong>
              {newAnswers > 0 && <span className="badge inq-new">새 답변 {newAnswers}</span>}
              <div className="muted">
                궁금한 점이나 멘토링 중 겪은 피해를 운영자에게 알려 주세요.
                {myInquiries.length > 0 && ` 내 문의 ${myInquiries.length}건 · 답변 대기 ${waiting}건`}
              </div>
            </div>
            <Link href="/inquiry" className="btn btn-sm">문의하기</Link>
          </div>
        );
      })()}

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card empty">
          {tab === "all" && !isMentor ? (
            <>
              아직 신청한 멘토링이 없어요.
              <br />
              <Link href={myProfile ? "/recommend" : "/concern"} className="btn btn-sm" style={{ marginTop: 16 }}>
                나에게 맞는 멘토 찾기
              </Link>
            </>
          ) : (
            "해당하는 멘토링이 없어요."
          )}
        </div>
      ) : (
        <div className="req-list">
          {shown.map((r) => (
            <RequestItem key={r.id} req={r} mentor={allMentors.find((m) => m.id === r.mentorId)} asMentor={isMentor} unread={roomActiveRequest({ requests }, r)?.id === r.id ? unreadCount({ requests, messages, lastRead }, r, currentUser.id) : 0} reviewed={allReviews.some((v) => v.requestId === r.id)} locked={isMentor && !!sanction} />
          ))}
        </div>
      )}

      <div style={{ textAlign: "right", marginTop: 48 }}>
        <button
          className="link-btn"
          style={{ fontSize: 13 }}
          onClick={() => {
            if (confirm("저장된 모든 데이터를 삭제할까요?")) {
              resetAll();
              router.push("/");
            }
          }}
        >
          데이터 초기화
        </button>
      </div>
    </div>
  );
}
