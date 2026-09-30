import Link from "next/link";
import { hometownLabel } from "@/lib/data";
import type { Mentor } from "@/lib/types";
import Avatar from "./Avatar";
import VerificationBadge from "./VerificationBadge";

// 학생의 고민과 멘토의 경험을 나란히 보여준다 (추천 화면에서만 사용)
interface Story {
  concern: string;
  ai?: string; // AI가 쓴 "왜 이 선배인지" 설명
  aiLoading?: boolean;
}

interface Props {
  mentor: Mentor;
  score?: number;
  reasons?: string[];
  story?: Story;
}

// 문장 끝에서 자르고, 그래도 길면 말줄임표를 붙인다
function snippet(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf("요."), cut.lastIndexOf("다."), cut.lastIndexOf(". "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

export default function MentorCard({ mentor, score, reasons, story }: Props) {
  return (
    <Link href={`/mentors/${mentor.id}`} className="card mentor-card">
      <div className="mentor-head">
        <Avatar seed={mentor.id + mentor.name} />
        <div>
          <div className="mentor-name">{mentor.name} 멘토</div>
          <div className="muted">
            {mentor.university} · {mentor.major} {mentor.grade}
          </div>
        </div>
        {score !== undefined && <div className="score">{score}점</div>}
      </div>
      {(mentor.verification.status === "approved" || hometownLabel(mentor.hometown)) && (
        <div className="badge-row">
          {mentor.verification.status === "approved" && <VerificationBadge status="approved" />}
          {hometownLabel(mentor.hometown) && <span className="tag-region">📍 {hometownLabel(mentor.hometown)}</span>}
        </div>
      )}
      <p className="mentor-intro">“{mentor.intro}”</p>
      {story && (
        <div className="match-story">
          <div className="story-row">
            <span className="story-label">내 고민</span>
            <span>{snippet(story.concern, 60)}</span>
          </div>
          <div className="story-row">
            <span className="story-label story-label-mentor">선배의 경험</span>
            <span>{snippet(mentor.experience, 90)}</span>
          </div>
          {story.aiLoading && <div className="story-ai story-ai-loading">🤖 왜 이 선배인지 정리하는 중이에요…</div>}
          {story.ai && <div className="story-ai">🤖 {story.ai}</div>}
        </div>
      )}
      <div className="tags">
        {mentor.topics.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </div>
      {reasons && reasons.length > 0 && (
        <ul className="reasons">
          {reasons.map((r) => (
            <li key={r}>✓ {r}</li>
          ))}
        </ul>
      )}
    </Link>
  );
}
