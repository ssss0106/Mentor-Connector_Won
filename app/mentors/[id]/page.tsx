"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import SlotGrid from "@/components/SlotGrid";
import { summarizeSlots } from "@/lib/schedule";
import { useStore } from "@/lib/store";

export default function MentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, allMentors, currentUser } = useStore();
  const mentor = allMentors.find((m) => m.id === id);

  if (!mentor) {
    if (!ready) return null;
    return (
      <div className="container page empty">
        멘토를 찾을 수 없어요. <Link href="/mentors">목록으로</Link>
      </div>
    );
  }

  const isStudent = currentUser?.role === "student";

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
            </div>
          </div>

          <p style={{ fontSize: 18, fontWeight: 600 }}>“{mentor.intro}”</p>

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
            <li><span>가능 시간</span><span>{mentor.slots?.length ? summarizeSlots(mentor.slots) : mentor.availableTimes.join(", ") || "협의"}</span></li>
            <li><span>온라인 멘토링</span><span>{mentor.online ? "가능" : "불가"}</span></li>
          </ul>
          {isStudent ? (
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
