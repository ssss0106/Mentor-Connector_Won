import Link from "next/link";
import { hometownLabel } from "@/lib/data";
import type { ScoreItem } from "@/lib/match";
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
  breakdown?: ScoreItem[]; // 점수 항목별 이유 (점수에 마우스를 올리면 보여 준다)
  sameRegion?: boolean;
  story?: Story;
  excellent?: boolean; // 운영자가 선정한 우수 멘토
}

// 문장 끝에서 자르고, 그래도 길면 말줄임표를 붙인다
function snippet(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf("요."), cut.lastIndexOf("다."), cut.lastIndexOf(". "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

export default function MentorCard({ mentor, score, reasons, breakdown, sameRegion, story, excellent }: Props) {
  return (
    <Link href={`/mentors/${mentor.id}`} className={`card mentor-card ${excellent ? "is-excellent" : ""}`}>
      {excellent && <span className="excellent-badge">🏅 우수 멘토</span>}
      <div className="mentor-head">
        <Avatar seed={mentor.id + mentor.name} />
        <div>
          <div className="mentor-name">{mentor.name} 멘토</div>
          <div className="muted">
            {mentor.university} · {mentor.major} {mentor.grade}
          </div>
        </div>
        {score !== undefined && (
          // 카드 전체가 링크라서, 점수를 눌렀을 때는 이동하지 않고 이유만 보여 준다 (휴대폰에서는 탭으로 열림)
          <span
            className="score-wrap"
            tabIndex={0}
            aria-describedby={breakdown ? `score-tip-${mentor.id}` : undefined}
            onClick={(e) => e.preventDefault()}
          >
            <span className="score">{score}점</span>
            {breakdown && breakdown.length > 0 && (
              <span role="tooltip" id={`score-tip-${mentor.id}`} className="score-tip">
                <strong className="score-tip-title">이렇게 점수를 매겼어요</strong>
                {breakdown.map((b) => (
                  <span key={b.label} className="score-tip-row">
                    <span>{b.label}</span>
                    <span className="score-tip-pt">+{b.points}</span>
                  </span>
                ))}
                <span className="score-tip-row score-tip-total">
                  <span>합계</span>
                  <span className="score-tip-pt">{score}점</span>
                </span>
                {sameRegion && <span className="score-tip-note">📍 같은 지역 출신이라 먼저 추천했어요</span>}
              </span>
            )}
          </span>
        )}
      </div>
      {(mentor.verification.status === "approved" || mentor.enrollment.status === "approved" || hometownLabel(mentor.hometown) || mentor.insight?.switched || mentor.admission) && (
        <div className="badge-row">
          {mentor.enrollment.status === "approved" && <VerificationBadge status="approved" kind="enrollment" />}
          {mentor.verification.status === "approved" && <VerificationBadge status="approved" />}
          {hometownLabel(mentor.hometown) && <span className="tag-region">📍 {hometownLabel(mentor.hometown)}</span>}
          {mentor.insight?.switched && <span className="tag-switch">🔄 전공을 바꾼 경험</span>}
          {mentor.admission && <span className="tag-admit">🎓 {mentor.admission.path}</span>}
        </div>
      )}
      <p className="mentor-intro">“{mentor.intro}”</p>
      {mentor.insight && (
        <p className="card-insight">
          <strong>💡 입학 전 몰랐던 점</strong> {snippet(mentor.insight.unknownBefore, 60)}
        </p>
      )}
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
