import type { StudentProfile } from "./types";

// 멘토의 "멘티 찾기"에 보이는 기존 멘티 고민 (이름·연락처 없이 고민 정보만 공개)
const s = (id: string, p: Omit<StudentProfile, "userId" | "availableTimes" | "openToMentors"> & { availableTimes?: string[] }): StudentProfile => ({
  userId: `seed-student-${id}`,
  availableTimes: [],
  openToMentors: true,
  ...p,
});

export const SEED_STUDENTS: StudentProfile[] = [
  s("1", { grade: "고1", region: "강원", interests: ["사회·심리"], desiredMajor: "심리학과", category: "진로", topics: ["전공 선택", "관심 직업"], concern: "심리학과에 가고 싶은데 상담사 말고 어떤 진로가 있는지 궁금해요.", availableTimes: ["평일 저녁"] }),
  s("2", { grade: "중3", region: "전남", interests: ["교육"], desiredMajor: "", category: "학습", topics: ["공부 방법", "학습 습관"], concern: "동네에 학원이 없어서 혼자 공부하는데, 계획을 세워도 오래 못 가요.", admissionPath: "수시 · 농어촌학생 전형", availableTimes: ["주말 오후"] }),
  s("3", { grade: "고2", region: "경북", interests: ["IT·컴퓨터", "공학"], desiredMajor: "컴퓨터공학과", category: "진로", topics: ["대학 선택", "전공 선택"], concern: "컴퓨터공학과와 소프트웨어학과가 실제로 어떻게 다른지 알고 싶어요.", preferredCampus: "수도권", availableTimes: ["평일 저녁", "주말 오전"] }),
  s("4", { grade: "고2", region: "제주", interests: ["경영·경제"], desiredMajor: "경영학과", category: "대학생활", topics: ["대학생활", "동아리·대외활동"], concern: "육지 대학에 가면 혼자 생활해야 하는데 적응할 수 있을지 걱정돼요.", availableTimes: ["주말 오후"] }),
  s("5", { grade: "고3", region: "충남", interests: ["의약·보건"], desiredMajor: "간호학과", category: "학습", topics: ["과목별 공부 경험", "공부 동기"], concern: "생명과학 성적이 잘 안 올라서 간호학과 준비가 막막해요.", admissionPath: "수시 · 학생부교과", availableTimes: ["평일 오후"] }),
  s("6", { grade: "중2", region: "경남", interests: ["예체능", "교육"], desiredMajor: "", category: "진로", topics: ["진로 탐색"], concern: "하고 싶은 게 아직 없어서 진로 시간마다 고민이에요. 다른 선배들은 어떻게 찾았는지 궁금해요.", availableTimes: ["주말 오전"] }),
  s("7", { grade: "고1", region: "전북", interests: ["자연과학"], desiredMajor: "화학과", category: "진로", topics: ["관심 직업", "전공 선택"], concern: "화학이 좋은데 화학과를 나오면 무슨 일을 하는지 잘 모르겠어요.", preferredCampus: "지역", availableTimes: ["평일 저녁"] }),
  s("8", { grade: "고2", region: "충북", interests: ["인문·어문"], desiredMajor: "국어국문학과", category: "학습", topics: ["공부 방법"], concern: "국어 비문학이 너무 약해요. 문과 선배들은 어떻게 공부했는지 알고 싶어요.", admissionPath: "정시", availableTimes: ["주말 오후", "주말 저녁"] }),
];
