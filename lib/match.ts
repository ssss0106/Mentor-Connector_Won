import type { Mentor, StudentProfile } from "./types";
import { CONCERN_TOPICS } from "./data";

// PRD 6장: 조건 기반 매칭 (MVP)
//   관심 분야 일치 +3 / 고민 유형 일치 +3 / 관심 전공 일치 +2 / 멘토 경험 일치 +2
//   가능한 시간이 겹치면 +1 (동점일 때 우선순위를 가르기 위한 보조 점수)

export interface MatchResult {
  mentor: Mentor;
  score: number;
  reasons: string[];
}

function majorMatches(desired: string, major: string): boolean {
  const d = desired.replace(/\s|학과|학부|전공|과$/g, "");
  const m = major.replace(/\s|학과|학부|전공/g, "");
  if (!d || !m) return false;
  return m.includes(d) || d.includes(m);
}

export function scoreMentor(p: StudentProfile, mentor: Mentor): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  const sharedInterests = p.interests.filter((i) => mentor.interests.includes(i));
  if (sharedInterests.length) {
    score += 3;
    reasons.push(`관심 분야 일치 (${sharedInterests.join(", ")})`);
  }

  const categoryTopics = CONCERN_TOPICS[p.category];
  if (mentor.topics.some((t) => categoryTopics.includes(t))) {
    score += 3;
    reasons.push(`${p.category} 고민 상담 가능`);
  }

  if (majorMatches(p.desiredMajor, mentor.major)) {
    score += 2;
    reasons.push(`관심 전공 일치 (${mentor.major})`);
  }

  const sharedTopics = p.topics.filter((t) => mentor.topics.includes(t));
  if (sharedTopics.length) {
    score += 2;
    reasons.push(`경험 분야 일치 (${sharedTopics.join(", ")})`);
  }

  const sharedTimes = p.availableTimes.filter((t) => mentor.availableTimes.includes(t));
  if (sharedTimes.length) {
    score += 1;
    reasons.push(`가능 시간 겹침 (${sharedTimes.join(", ")})`);
  }

  return { mentor, score, reasons };
}

export function recommendMentors(p: StudentProfile, mentors: Mentor[], limit = 5): MatchResult[] {
  return mentors
    .map((m) => scoreMentor(p, m))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
