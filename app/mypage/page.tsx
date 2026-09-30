"use client";

import SummaryView from "@/components/SummaryView";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import VerificationBadge from "@/components/VerificationBadge";
import { STATUS_LABEL } from "@/lib/data";
import { formatSession } from "@/lib/schedule";
import { canChat, resetAll, setRequestStatus, unreadCount, useStore } from "@/lib/store";
import type { Mentor, MentoringRequest, RequestStatus } from "@/lib/types";

const FLOW: RequestStatus[] = ["pending", "approved", "scheduled", "completed"];

function StatusFlow({ status }: { status: RequestStatus }) {
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

function RequestItem({ req, mentor, asMentor, unread }: { req: MentoringRequest; mentor?: Mentor; asMentor: boolean; unread: number }) {
  const action = NEXT_ACTION[req.status];
  return (
    <div className="card req">
      <div className="req-top">
        <div>
          <strong>{asMentor ? `${req.studentName} 학생` : `${mentor?.name ?? "알 수 없음"} 멘토`}</strong>
          {!asMentor && mentor && <span className="muted"> · {mentor.university} {mentor.major}</span>}
          <div className="muted">
            {formatSession(req.date, req.time)} · {req.method}
          </div>
        </div>
        <StatusBadge status={req.status} />
      </div>
      <p className="req-msg">{req.message}</p>
      <StatusFlow status={req.status} />
      {req.summary && (
        <details className="summary-details">
          <summary>📝 AI 수업 요약 보기</summary>
          <SummaryView summary={req.summary} />
        </details>
      )}
      {(canChat(req) || (asMentor && action)) && (
        <div className="req-actions">
          {canChat(req) && (
            <Link href={`/chat/${req.id}`} className="btn btn-sm btn-ghost chat-btn">
              💬 채팅{unread > 0 && <span className="unread">{unread}</span>}
            </Link>
          )}
          {req.status === "scheduled" && (
            <Link href={`/room/${req.id}`} className="btn btn-sm btn-video">
              🎥 화상 멘토링 입장
            </Link>
          )}
          {asMentor && action && (
            <button className={`btn btn-sm ${req.status === "scheduled" ? "btn-ghost" : ""}`} onClick={() => setRequestStatus(req.id, action.next)}>
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type Tab = "all" | "upcoming" | "done";

export default function MyPage() {
  const router = useRouter();
  const { ready, currentUser, myProfile, requests, allMentors, messages, lastRead } = useStore();
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (ready && !currentUser) router.replace("/signup");
  }, [ready, currentUser, router]);

  if (!ready || !currentUser) return null;

  const isMentor = currentUser.role === "mentor";
  const myMentor = isMentor ? allMentors.find((m) => m.id === currentUser.mentorId) : undefined;

  const mine = requests
    .filter((r) => (isMentor ? r.mentorId === currentUser.mentorId : r.studentId === currentUser.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const shown = mine.filter((r) =>
    tab === "all" ? r.status !== "completed" : tab === "upcoming" ? r.status === "scheduled" : r.status === "completed",
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
            <div className="verify-row">
              <div>
                <strong>경력 조회 확인</strong> <VerificationBadge status={myMentor.verification.status} />
                <div className="muted">
                  {{
                    not_submitted: "동의서와 조회 결과 파일을 제출해야 학생에게 공개돼요.",
                    pending: "운영자가 서류를 확인하고 있어요. 확인이 끝나면 학생에게 공개돼요.",
                    approved: "확인이 끝나 학생에게 추천되고 있어요.",
                    rejected: `반려됐어요. 사유: ${myMentor.verification.rejectReason || "사유 없음"}`,
                  }[myMentor.verification.status]}
                </div>
              </div>
              {(myMentor.verification.status === "not_submitted" || myMentor.verification.status === "rejected") && (
                <Link href="/mentor/verify" className="btn btn-sm">
                  {myMentor.verification.status === "rejected" ? "다시 제출" : "제출하기"}
                </Link>
              )}
            </div>
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
                {myProfile ? `${myProfile.grade} · ${myProfile.region} · ${myProfile.category} — ${myProfile.concern}` : "아직 고민을 입력하지 않았어요."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Link href="/concern" className="btn btn-sm btn-ghost">
                {myProfile ? "수정" : "입력하기"}
              </Link>
              {myProfile && <Link href="/recommend" className="btn btn-sm">추천 멘토</Link>}
            </div>
          </div>
        </div>
      )}

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
            <RequestItem key={r.id} req={r} mentor={allMentors.find((m) => m.id === r.mentorId)} asMentor={isMentor} unread={unreadCount({ messages, lastRead }, r.id, currentUser.id)} />
          ))}
        </div>
      )}

      <div style={{ textAlign: "right", marginTop: 48 }}>
        <button
          className="link-btn"
          style={{ fontSize: 13 }}
          onClick={() => {
            if (confirm("이 브라우저에 저장된 모든 데모 데이터를 삭제할까요?")) {
              resetAll();
              router.push("/");
            }
          }}
        >
          데모 데이터 초기화
        </button>
      </div>
    </div>
  );
}
