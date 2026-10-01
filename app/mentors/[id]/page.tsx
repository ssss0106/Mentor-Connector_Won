"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import SlotGrid from "@/components/SlotGrid";
import VerificationBadge from "@/components/VerificationBadge";
import { SESSION_MINUTES, summarizeSlots } from "@/lib/schedule";
import { MIN_REVIEWS_FOR_AVERAGE, SESSION_PRICE, formatPrice } from "@/lib/data";
import { isVerifiedMentor, useStore } from "@/lib/store";

export default function MentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, allMentors, currentUser, allReviews } = useStore();
  const found = allMentors.find((m) => m.id === id);
  // 재학 인증·경력 조회 확인 전인 멘토는 본인만 볼 수 있다
  const isOwner = !!found && currentUser?.mentorId === found.id;
  const mentor = found && (isVerifiedMentor(found) || isOwner) ? found : undefined;

  if (!mentor) {
    if (!ready) return null;
    return (
      <div className="container page empty">
        멘토를 찾을 수 없어요. <Link href="/mentors">목록으로</Link>
      </div>
    );
  }

  const isStudent = currentUser?.role === "student";
  const reviews = allReviews.filter((r) => r.mentorId === mentor.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

  return (
    <div className="container page">
      <div className="detail">
        <div className="card">
          <div className="detail-profile">
            <Avatar seed={mentor.id + mentor.name} size={88} />
            <div>
              <h1 className="page-title" style={{ marginBottom: 4 }}>{mentor.name} 멘토</h1>
              <div className="muted">
                {mentor.university} · {mentor.major} {mentor.grade}
              </div>
              <div className="badge-row" style={{ marginTop: 8 }}>
                <VerificationBadge status={mentor.enrollment.status} kind="enrollment" />
                <VerificationBadge status={mentor.verification.status} />
              </div>
            </div>
          </div>

          <p style={{ fontSize: 18, fontWeight: 600 }}>“{mentor.intro}”</p>

          {mentor.insight && (
            <>
              <h2>전공·대학생활, 실제로는 이랬어요</h2>
              <div className="insight">
                <div className="insight-row">
                  <span className="insight-label">전공 만족도</span>
                  <span>
                    <span className="stars-sm">{"★".repeat(mentor.insight.satisfaction)}{"☆".repeat(5 - mentor.insight.satisfaction)}</span> {mentor.insight.satisfaction}/5
                  </span>
                </div>
                <div className="insight-row">
                  <span className="insight-label">💡 입학 전 몰랐던 점</span>
                  <span>{mentor.insight.unknownBefore}</span>
                </div>
                <div className="insight-row">
                  <span className="insight-label">😓 힘들었던 점</span>
                  <span>{mentor.insight.hardPart}</span>
                </div>
                {mentor.insight.fitFor && (
                  <div className="insight-row">
                    <span className="insight-label">👍 이런 학생에게 잘 맞아요</span>
                    <span>{mentor.insight.fitFor}</span>
                  </div>
                )}
                {mentor.insight.switched && (
                  <div className="insight-row insight-switch">
                    <span className="insight-label">🔄 전공을 바꾼 경험</span>
                    <span>{mentor.insight.switched.reason}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {mentor.admission && (
            <>
              <h2>
                입시·성적 정보 <span className="self-note">본인 입력</span>
              </h2>
              <div className="insight">
                <div className="insight-row">
                  <span className="insight-label">입시 전형</span>
                  <span>{mentor.admission.path}</span>
                </div>
                <div className="insight-row">
                  <span className="insight-label">고등학교 내신</span>
                  <span>평균 {mentor.admission.highSchoolGrade}등급</span>
                </div>
                {mentor.admission.collegeGpa && (
                  <div className="insight-row">
                    <span className="insight-label">대학 학점 (공개)</span>
                    <span>{mentor.admission.collegeGpa.value} / {mentor.admission.collegeGpa.scale.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <p className="muted small">멘토가 직접 입력한 정보예요. 서류로 확인된 내용은 아니고, 추천 순서에는 반영되지 않아요.</p>
            </>
          )}

          <h2>멘토링 가능 분야</h2>
          <div className="tags">
            {mentor.topics.map((t) => <span key={t} className="tag tag-primary">{t}</span>)}
          </div>

          <h2>관심 분야</h2>
          <div className="tags">
            {mentor.interests.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>

          <h2>선배의 경험</h2>
          <p>{mentor.experience}</p>

          <h2>멘토링 후기</h2>
          <div className="review-summary">
            {reviews.length >= MIN_REVIEWS_FOR_AVERAGE ? (
              <>
                <span className="stars-sm">★</span> <strong>{average.toFixed(1)}</strong> · 후기 {reviews.length}개
              </>
            ) : reviews.length > 0 ? (
              <>후기 {reviews.length}개 <span className="muted">(후기가 {MIN_REVIEWS_FOR_AVERAGE}개 이상 모이면 평균 별점을 보여줘요)</span></>
            ) : (
              <span className="muted">아직 후기가 없어요. 멘토링을 마친 학생이 후기를 남길 수 있어요.</span>
            )}
          </div>
          {reviews.map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-head">
                <span className="stars-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                <span>{r.studentLabel}</span>
                <span className="muted">{r.createdAt.slice(0, 10)}</span>
              </div>
              {r.helpful.length > 0 && (
                <div className="tags">
                  {r.helpful.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              )}
              {r.text && <p>{r.text}</p>}
            </div>
          ))}

          {mentor.slots && mentor.slots.length > 0 && (
            <>
              <h2>주간 멘토링 가능 시간</h2>
              <SlotGrid value={mentor.slots} />
            </>
          )}
        </div>

        <div className="card sticky">
          <ul className="info-list">
            <li><span>대학교</span><span>{mentor.university}</span></li>
            <li><span>전공</span><span>{mentor.major}</span></li>
            <li><span>학년</span><span>{mentor.grade}</span></li>
            {mentor.hometown && <li><span>출신 지역</span><span>{mentor.hometown}</span></li>}
            {mentor.campus && <li><span>대학 위치</span><span>{mentor.campus} 대학</span></li>}
            <li><span>가능 시간</span><span>{mentor.slots?.length ? summarizeSlots(mentor.slots) : mentor.availableTimes.join(", ") || "협의"}</span></li>
            <li><span>멘토링 비용</span><span>{SESSION_MINUTES}분 1회 {formatPrice(SESSION_PRICE)}</span></li>
            <li><span>온라인 멘토링</span><span>{mentor.online ? "가능" : "불가"}</span></li>
          </ul>
          {!isVerifiedMentor(mentor) ? (
            <p className="muted" style={{ margin: 0, textAlign: "center" }}>
              재학 인증과 경력 조회 확인이 끝나면 학생에게 공개돼요.
            </p>
          ) : isStudent ? (
            <Link href={`/mentors/${mentor.id}/apply`} className="btn btn-block">
              멘토링 신청하기
            </Link>
          ) : currentUser ? (
            <p className="muted" style={{ margin: 0, textAlign: "center" }}>학생 계정만 신청할 수 있어요.</p>
          ) : (
            <Link href="/signup" className="btn btn-block">
              가입하고 신청하기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
