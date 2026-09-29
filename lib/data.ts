import { sampleSlots } from "./schedule";
import type { ConcernCategory, Mentor, RequestStatus, Verification, VerificationStatus } from "./types";

export const GRADES = ["중1", "중2", "중3", "고1", "고2", "고3"];
export const MENTOR_GRADES = ["1학년", "2학년", "3학년", "4학년", "졸업생"];

export const REGIONS = [
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "대전", "대구", "광주", "부산", "울산", "기타",
];

export const INTERESTS = [
  "인문·어문", "사회·심리", "교육", "경영·경제", "IT·컴퓨터", "공학", "자연과학", "의약·보건", "예체능",
];

export const CONCERN_TOPICS: Record<ConcernCategory, string[]> = {
  학습: ["공부 방법", "학습 습관", "공부 동기", "과목별 공부 경험"],
  진로: ["진로 탐색", "관심 직업", "전공 선택", "대학 선택"],
  대학생활: ["대학생활", "전공생활", "동아리·대외활동", "대학 입학 후 생활"],
};

export const ALL_TOPICS = Object.values(CONCERN_TOPICS).flat();

export const TIMES = ["평일 오후", "평일 저녁", "주말 오전", "주말 오후", "주말 저녁"];

export const METHODS = ["온라인 화상", "온라인 채팅", "전화"];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "신청 대기",
  approved: "멘토 승인",
  scheduled: "멘토링 예정",
  completed: "완료",
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  not_submitted: "서류 미제출",
  pending: "확인 대기",
  approved: "경력 조회 완료",
  rejected: "반려",
};

// 시연용 가상 멘토는 경력 조회가 끝난 상태로 둔다
const SEED_VERIFIED: Verification = { status: "approved", reviewedAt: "2026-09-28T09:00:00.000Z" };

// 시연용 가상 멘토 데이터 (실제 인물이 아님)
const RAW_MENTORS: Mentor[] = [
  {
    id: "m1",
    name: "김지은",
    university: "성균관대학교",
    major: "아동청소년학과",
    grade: "3학년",
    interests: ["교육", "사회·심리"],
    topics: ["전공 선택", "대학생활", "공부 방법", "진로 탐색"],
    experience:
      "중학생 때 진로를 정하지 못해 오래 고민했어요. 고2 때 청소년 상담 봉사를 하면서 아동청소년학이라는 전공을 알게 됐고, 지금은 청소년 교육 프로그램을 기획하는 일을 꿈꾸고 있어요.",
    intro: "중학생 때 진로를 결정하기 어려웠던 경험을 바탕으로 편하게 이야기해드릴게요.",
    availableTimes: ["평일 저녁", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m2",
    name: "박서준",
    university: "연세대학교",
    major: "심리학과",
    grade: "4학년",
    interests: ["사회·심리", "자연과학"],
    topics: ["전공 선택", "전공생활", "관심 직업", "대학 선택"],
    experience:
      "강원도 일반고 출신이에요. 심리학과에 대한 정보가 거의 없어서 혼자 찾아봤던 경험이 있어요. 임상·상담·인지 등 심리학 세부 분야와 대학원 진로까지 알려드릴 수 있어요.",
    intro: "심리학과가 실제로 뭘 배우는지, 솔직하게 알려드릴게요.",
    availableTimes: ["평일 저녁", "주말 오전"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m3",
    name: "이하늘",
    university: "서울대학교",
    major: "교육학과",
    grade: "2학년",
    interests: ["교육", "인문·어문"],
    topics: ["공부 방법", "학습 습관", "공부 동기", "대학 입학 후 생활"],
    experience:
      "고1 때 성적이 크게 떨어진 뒤 공부 습관을 처음부터 다시 만들었어요. 플래너 쓰는 법, 오답노트 정리법 등 제가 직접 효과 본 방법을 공유해요.",
    intro: "공부가 막막할 때, 작은 습관부터 같이 만들어봐요.",
    availableTimes: ["평일 오후", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m4",
    name: "최민호",
    university: "KAIST",
    major: "전산학부",
    grade: "3학년",
    interests: ["IT·컴퓨터", "공학"],
    topics: ["관심 직업", "전공 선택", "동아리·대외활동", "과목별 공부 경험"],
    experience:
      "고등학교 때 독학으로 코딩을 시작해 정보올림피아드에 나갔어요. 개발자라는 직업과 컴퓨터공학 전공 공부가 실제로 어떤지 이야기해 드릴 수 있어요.",
    intro: "개발자가 되고 싶다면, 지금 할 수 있는 것부터 알려줄게요.",
    availableTimes: ["평일 저녁", "주말 저녁"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m5",
    name: "정유나",
    university: "고려대학교",
    major: "경영학과",
    grade: "4학년",
    interests: ["경영·경제", "사회·심리"],
    topics: ["대학생활", "동아리·대외활동", "진로 탐색", "대학 선택"],
    experience:
      "창업 동아리와 공모전 활동을 많이 했어요. 문과 진로가 막연하게 느껴지는 친구들에게 경영학과에서 할 수 있는 다양한 길을 소개해요.",
    intro: "대학생활을 알차게 보내는 법, 선배가 다 알려줄게요.",
    availableTimes: ["주말 오전", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m6",
    name: "한도윤",
    university: "강원대학교",
    major: "간호학과",
    grade: "3학년",
    interests: ["의약·보건", "자연과학"],
    topics: ["관심 직업", "전공생활", "과목별 공부 경험", "대학 입학 후 생활"],
    experience:
      "강원도에서 나고 자라 지역 대학 간호학과에 진학했어요. 실습 생활, 국가고시 준비, 보건의료 계열 진로를 현실적으로 알려드려요.",
    intro: "보건의료 계열 진로, 지역 대학 진학 이야기 궁금하면 물어보세요.",
    availableTimes: ["평일 오후", "평일 저녁"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m7",
    name: "윤서아",
    university: "한국외국어대학교",
    major: "영어통번역학과",
    grade: "2학년",
    interests: ["인문·어문", "교육"],
    topics: ["과목별 공부 경험", "공부 방법", "전공 선택", "대학생활"],
    experience:
      "학원 없이 영어 성적을 올린 경험이 있어요. 영어 공부법과 어문 계열 전공, 교환학생 준비 과정까지 이야기해 드려요.",
    intro: "영어 공부가 어렵다면, 제가 썼던 방법을 그대로 알려줄게요.",
    availableTimes: ["주말 오후", "주말 저녁"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m8",
    name: "오태양",
    university: "한양대학교",
    major: "기계공학부",
    grade: "4학년",
    interests: ["공학", "자연과학"],
    topics: ["전공 선택", "공부 동기", "관심 직업", "전공생활"],
    experience:
      "수학을 싫어했지만 로봇이 좋아서 공대에 왔어요. 이과 과목 공부 동기를 잃었을 때 다시 잡은 경험과 공대 생활을 들려드려요.",
    intro: "공대가 궁금한 친구, 편하게 질문하세요!",
    availableTimes: ["평일 저녁", "주말 오전"],
    online: false,
    verification: SEED_VERIFIED,
  },
];

// 시드 멘토의 주간 시간표는 대략적인 시간대에서 예시로 만든다
export const SEED_MENTORS: Mentor[] = RAW_MENTORS.map((m) => ({ ...m, slots: sampleSlots(m.availableTimes) }));
