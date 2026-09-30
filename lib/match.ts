import type { Mentor, StudentProfile } from "./types";
import { CONCERN_TOPICS } from "./data";

// PRD 6장: 조건 기반 매칭 (MVP)
//   관심 분야 일치 +3 / 고민 유형 일치 +3 / 관심 전공 일치 +2 / 멘토 경험 일치 +2
//   가능한 시간이 겹치면 +1 (동점일 때 우선순위를 가르기 위한 보조 점수)
//   전공을 바꾼 경험 +1 (학생이 "전공 선택"을 고민할 때만: 전공이 안 맞을까 걱정하는 학생에게 도움)
//   같은 입시 전형을 거침 +2 (학생이 준비하는 전형을 고른 경우). 내신·학점은 점수에 쓰지 않는다.
//   같은 지역 출신 +2 (지역 청소년이 "같은 처지에서 자란 선배"를 만나도록 추가한 규칙)

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

  if (p.region !== "기타" && mentor.hometown === p.region) {
    score += 2;
    reasons.push(`같은 지역 출신 (${mentor.hometown})`);
  }

  if (p.topics.includes("전공 선택") && mentor.insight?.switched) {
    score += 1;
    reasons.push("전공을 바꾼 경험이 있어 전공 선택 고민에 도움");
  }

  if (p.admissionPath && mentor.admission?.path === p.admissionPath) {
    score += 2;
    reasons.push(`같은 입시 전형 경험 (${p.admissionPath})`);
  }

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
