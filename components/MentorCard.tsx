import Link from "next/link";
import type { Mentor } from "@/lib/types";
import Avatar from "./Avatar";

interface Props {
  mentor: Mentor;
  score?: number;
  reasons?: string[];
}

export default function MentorCard({ mentor, score, reasons }: Props) {
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
      <p className="mentor-intro">“{mentor.intro}”</p>
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
