import type { Mentor, StudentProfile } from "./types";
import { CONCERN_TOPICS, categoryLabel } from "./data";

// PRD 6장: 조건 기반 매칭 (MVP)
//   관심 분야 일치 +3 / 고민 유형 일치 +3 / 관심 전공 일치 +2 / 멘토 경험 일치 +2
//   가능한 시간이 겹치면 +1 (동점일 때 우선순위를 가르기 위한 보조 점수)
//   전공을 바꾼 경험 +1 (학생이 "전공 선택"을 고민할 때만: 전공이 안 맞을까 걱정하는 학생에게 도움)
//   같은 입시 전형을 거침 +2 (학생이 준비하는 전형을 고른 경우). 내신·학점은 점수에 쓰지 않는다.
//   같은 지역 출신 +2 (지역 청소년이 "같은 처지에서 자란 선배"를 만나도록 추가한 규칙)
//   원하는 대학 위치(수도권/지역)와 멘토의 대학 위치가 같으면 +2 (지방 학생이 수도권 대학 정보를 직접 들을 수 있도록)
// 추천 순서: 같은 지역 출신 멘토를 점수 순으로 최대 3명까지 먼저 보여 주고, 나머지 자리는 지역과 관계없이 점수 순으로 채운다.

export interface ScoreItem {
  label: string;
  points: number;
}

export interface MatchResult {
  mentor: Mentor;
  score: number;
  reasons: string[];
  breakdown: ScoreItem[]; // 점수 항목별 이유 (점수에 마우스를 올리면 보여 준다)
  sameRegion: boolean;
  regionFirst?: boolean; // 같은 지역 출신이라 앞쪽에 먼저 배치된 멘토
}

// 같은 지역 출신 멘토를 앞에 먼저 보여 주는 최대 인원
export const REGION_FIRST_LIMIT = 3;

// "심리학과"·"심리학"·"심리" → "심리" 처럼 학과 이름을 비교하기 쉬운 꼴로 바꾼다
function normalizeMajor(s: string) {
  let t = s.replace(/\s/g, "").replace(/(학부|전공|계열)$/, "");
  if (t.endsWith("과")) t = t.slice(0, -1);
  if (t.length > 2 && t.endsWith("학")) t = t.slice(0, -1);
  return t;
}

// 그 자체로 하나의 학과인 전공: 이름이 포함된 다른 학과(화학 → 화학공학, 수학 → 수학교육, 의예 → 수의예)와는 다른 전공으로 본다
const BASE_SUBJECTS = new Set(["화학", "수학", "물리", "생물", "생명과", "지리", "역사", "체육", "미술", "음악", "의예", "약"]);

function majorMatches(desired: string, major: string): boolean {
  const d = normalizeMajor(desired);
  const m = normalizeMajor(major);
  if (!d || !m) return false;
  if (d === m) return true;
  if (BASE_SUBJECTS.has(d) || BASE_SUBJECTS.has(m)) return false;
  return m.includes(d) || d.includes(m);
}

export function scoreMentor(p: StudentProfile, mentor: Mentor): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const breakdown: ScoreItem[] = [];
  // 점수와 이유를 함께 기록한다
  const add = (points: number, label: string) => {
    score += points;
    reasons.push(label);
    breakdown.push({ label, points });
  };

  const sameRegion = p.region !== "기타" && mentor.hometown === p.region;
  if (sameRegion) {
    add(2, `같은 지역 출신 (${mentor.hometown})`);
  }

  if (p.topics.includes("전공 선택") && mentor.insight?.switched) {
    add(1, "전공을 바꾼 경험이 있어 전공 선택 고민에 도움");
  }

  if (p.preferredCampus && mentor.campus === p.preferredCampus) {
    add(2, `원하는 대학 위치와 같아요 (${p.preferredCampus} 대학 재학)`);
  }

  if (p.admissionPath && mentor.admission?.path === p.admissionPath) {
    add(2, `같은 입시 전형 경험 (${p.admissionPath})`);
  }

  const sharedInterests = p.interests.filter((i) => mentor.interests.includes(i));
  if (sharedInterests.length) {
    add(3, `관심 분야 일치 (${sharedInterests.join(", ")})`);
  }

  const categoryTopics = CONCERN_TOPICS[p.category];
  if (mentor.topics.some((t) => categoryTopics.includes(t))) {
    add(3, `${categoryLabel(p.category)} 고민 상담 가능`);
  }

  if (majorMatches(p.desiredMajor, mentor.major)) {
    add(2, `관심 전공 일치 (${mentor.major})`);
  }

  const sharedTopics = p.topics.filter((t) => mentor.topics.includes(t));
  if (sharedTopics.length) {
    add(2, `경험 분야 일치 (${sharedTopics.join(", ")})`);
  }

  const sharedTimes = p.availableTimes.filter((t) => mentor.availableTimes.includes(t));
  if (sharedTimes.length) {
    add(1, `가능 시간 겹침 (${sharedTimes.join(", ")})`);
  }

  return { mentor, score, reasons, breakdown, sameRegion };
}

export function recommendMentors(p: StudentProfile, mentors: Mentor[], limit = 5): MatchResult[] {
  const byScore = (a: MatchResult, b: MatchResult) => b.score - a.score;
  const scored = mentors.map((m) => scoreMentor(p, m)).filter((r) => r.score > 0);
  // 원하는 대학 위치를 골랐다면, 같은 지역 출신 우선 배치는 그 위치의 대학에 다니는 멘토에게만 적용한다
  const regionFirst = scored
    .filter((r) => r.sameRegion && (!p.preferredCampus || r.mentor.campus === p.preferredCampus))
    .sort(byScore)
    .slice(0, REGION_FIRST_LIMIT);
  const rest = scored.filter((r) => !regionFirst.includes(r)).sort(byScore);
  return [...regionFirst.map((r) => ({ ...r, regionFirst: true })), ...rest].slice(0, limit);
}
