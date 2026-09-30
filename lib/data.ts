import { sampleSlots } from "./schedule";
import type { ConcernCategory, Mentor, RequestStatus, Verification, VerificationStatus } from "./types";

export const GRADES = ["중1", "중2", "중3", "고1", "고2", "고3"];
export const MENTOR_GRADES = ["1학년", "2학년", "3학년", "4학년", "졸업생"];

export const REGIONS = [
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "대전", "대구", "광주", "부산", "울산", "기타",
];

// 멘토의 출신 지역 (학생 지역 목록 + 수도권)
export const HOMETOWNS = ["수도권", ...REGIONS];

// 화면에 보여줄 출신 지역 표시. "기타"는 보여주지 않는다.
export const hometownLabel = (h?: string) => (h && h !== "기타" ? `${h} 출신` : "");

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

// 멘토링 비용: 모든 멘토 동일, 30분 1회 고정 (시연 화면이라 실제 결제는 하지 않는다)
export const SESSION_PRICE = 7000;
export const formatPrice = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const METHODS = ["온라인 화상", "온라인 채팅"];

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
    hometown: "충남",
    insight: {
      satisfaction: 4,
      unknownBefore: "상담만 배우는 줄 알았는데 발달심리·교육 이론과 통계·연구방법 수업이 많았어요.",
      hardPart: "이론 위주라 실습 기회를 스스로 찾아야 해서 첫 학기에 막막했어요.",
      fitFor: "아이들과 교육 프로그램에 관심 있고 이론도 꾸준히 읽을 수 있는 학생",
    },
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
    hometown: "강원",
    insight: {
      satisfaction: 4,
      unknownBefore: "상담 수업만 있는 게 아니라 통계와 실험 설계 수업 비중이 커요.",
      hardPart: "1학년 통계·실험 수업이 어려워서 스터디를 만들어 버텼어요.",
      fitFor: "사람의 마음이 궁금하고 숫자 다루는 것도 거부감 없는 학생",
    },
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
    hometown: "전남",
    insight: {
      satisfaction: 4,
      unknownBefore: "교육학과는 곧바로 교사가 되는 과정이 아니라 교육 이론·정책·상담을 폭넓게 배워요.",
      hardPart: "교직 이수와 전공 수업을 병행하느라 학점 관리가 벅찼어요.",
      fitFor: "교육 제도와 학습 방법을 깊게 파보고 싶은 학생",
    },
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
    hometown: "경북",
    insight: {
      satisfaction: 4,
      unknownBefore: "코딩만 하는 게 아니라 이산수학·선형대수 같은 수학과 알고리즘 이론 비중이 커요.",
      hardPart: "독학으로 익힌 코딩과 수업 수준 차이가 커서 기초를 다시 다졌어요.",
      fitFor: "문제를 끈기 있게 붙잡고 수학도 괜찮은 학생",
    },
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
    hometown: "수도권",
    insight: {
      satisfaction: 4,
      unknownBefore: "발표와 팀 프로젝트가 정말 많아요. 혼자 공부만 잘해서는 부족해요.",
      hardPart: "회계·통계 같은 숫자 과목이 어려워서 방학마다 따로 공부했어요.",
      fitFor: "사람들과 협업하며 여러 분야를 경험해보고 싶은 학생",
      switched: { reason: "처음에는 사회과학 계열로 입학했다가 2학년 때 경영학으로 전공을 옮겼어요. 맞는지 한 학기 동안 고민했고, 옮기기 전에 학과 선배들을 만나 이야기를 들었던 게 큰 도움이 됐어요." },
    },
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
    hometown: "강원",
    insight: {
      satisfaction: 4,
      unknownBefore: "이론 수업만이 아니라 3학년부터는 병원 실습이 중심이고 체력이 많이 필요해요.",
      hardPart: "첫 실습 때 긴장과 체력 문제로 힘들었지만 실습 동기들과 함께 이겨냈어요.",
      fitFor: "사람을 돌보는 일에 보람을 느끼고 책임감이 있는 학생",
    },
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
    hometown: "경남",
    insight: {
      satisfaction: 4,
      unknownBefore: "영어를 잘하는 것만으로는 부족하고, 통번역은 한국어 표현력이 훨씬 중요해요.",
      hardPart: "실시간 통역 수업에서 준비 없이 말하는 게 무서워서 매일 연습했어요.",
      fitFor: "언어에 흥미가 있고 매일 연습하는 게 즐거운 학생",
    },
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
    hometown: "대구",
    insight: {
      satisfaction: 3,
      unknownBefore: "이론 과목(열역학·재료역학)이 많아서 로봇을 만드는 시간은 기대보다 적어요.",
      hardPart: "수학·물리 기초가 부족해 1학년 때 성적이 크게 떨어졌고, 재수강하며 다시 쌓았어요.",
      fitFor: "만드는 걸 좋아하고 기초 이론도 참고 공부할 수 있는 학생",
    },
    availableTimes: ["평일 저녁", "주말 오전"],
    online: false,
    verification: SEED_VERIFIED,
  },
  {
    id: "m9",
    name: "김하준",
    university: "충북대학교",
    major: "약학과",
    grade: "3학년",
    interests: ["의약·보건", "자연과학"],
    topics: ["진로 탐색", "관심 직업", "과목별 공부 경험", "대학 선택"],
    experience:
      "충북의 작은 도시에서 학원 없이 인터넷 강의와 교과서로 화학·생명과학을 공부했어요. 약사가 하는 일이 병원·제약회사·연구까지 생각보다 넓다는 걸 대학에 와서 알게 됐어요. 보건의료 계열 진로가 막막한 친구들에게 현실적인 이야기를 해드릴게요.",
    intro: "약사라는 직업, 학교에서는 안 알려주는 이야기까지 들려드릴게요.",
    hometown: "충북",
    insight: {
      satisfaction: 4,
      unknownBefore: "약을 만드는 것만 하는 게 아니라 복약지도와 병원·제약·연구 등 진로가 다양해요.",
      hardPart: "화학·생화학 암기량이 많아서 학기 내내 시험 준비로 바빴어요.",
      fitFor: "화학·생명과학에 관심 있고 꾸준한 암기가 어렵지 않은 학생",
    },
    availableTimes: ["평일 저녁", "주말 오전"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m10",
    name: "이서연",
    university: "전남대학교",
    major: "수의예과",
    grade: "4학년",
    interests: ["자연과학", "의약·보건"],
    topics: ["관심 직업", "전공 선택", "과목별 공부 경험", "대학 입학 후 생활"],
    experience:
      "전남 시골 마을에서 자라 동물을 좋아했지만 수의사가 되는 길을 알려줄 사람이 없었어요. 생명과학 공부법과 수의대 공부·실습 생활, 졸업 후 진로(동물병원·연구·공공부문)를 있는 그대로 알려드려요.",
    intro: "동물을 좋아하는 친구라면, 수의대의 진짜 모습을 알려줄게요.",
    hometown: "전남",
    insight: {
      satisfaction: 5,
      unknownBefore: "동물병원 임상만이 아니라 공공방역·연구·산업동물 등 진로가 넓어요.",
      hardPart: "학습량이 매우 많고, 실습에서 감정적으로 힘든 순간도 있어요.",
      fitFor: "동물에 관심이 있고 책임감 있게 오래 공부할 수 있는 학생",
    },
    availableTimes: ["주말 오전", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m11",
    name: "정민재",
    university: "부산대학교",
    major: "정보컴퓨터공학부",
    grade: "2학년",
    interests: ["IT·컴퓨터", "공학"],
    topics: ["전공 선택", "전공생활", "동아리·대외활동", "공부 방법"],
    experience:
      "부산 일반고에 다닐 때 코딩 수업이 거의 없어서 유튜브와 무료 강의로 독학했어요. 학과 동아리와 해커톤에 참여하면서 수도권이 아니어도 개발 경험을 쌓을 수 있다는 걸 알게 됐어요.",
    intro: "지방에서도 개발자의 길은 열려 있어요. 제가 걸어온 방법을 알려드릴게요.",
    hometown: "부산",
    insight: {
      satisfaction: 5,
      unknownBefore: "혼자 하던 코딩과 달리 자료구조·알고리즘 같은 이론 수업이 큰 비중이에요.",
      hardPart: "동기들이 이미 잘하는 것처럼 보여서 자신감이 떨어졌던 적이 있어요.",
      fitFor: "만들면서 배우는 걸 좋아하고 처음엔 서툴러도 견딜 수 있는 학생",
      switched: { reason: "처음엔 기계 계열로 입학했지만 코딩이 더 재미있어서 1학년을 마치고 정보컴퓨터공학으로 옮겼어요. 부모님과 오래 이야기하고 학과 상담을 받은 뒤에 결정했어요." },
    },
    availableTimes: ["평일 저녁", "주말 저녁"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m12",
    name: "강나은",
    university: "제주대학교",
    major: "관광경영학과",
    grade: "3학년",
    interests: ["경영·경제", "사회·심리"],
    topics: ["진로 탐색", "대학 선택", "대학생활", "관심 직업"],
    experience:
      "제주에서 나고 자라 섬 밖 대학과 진로 정보를 얻기 어려웠어요. 제주에 남을지 육지로 나갈지 오래 고민했고, 지금은 지역 대학에서 관광·서비스 분야 인턴과 교환학생을 경험하고 있어요.",
    intro: "섬을 떠날지 남을지 고민된다면, 제 고민 과정을 나눠드릴게요.",
    hometown: "제주",
    insight: {
      satisfaction: 4,
      unknownBefore: "관광이 여행만 다루는 게 아니라 마케팅·회계·서비스 경영을 함께 배워요.",
      hardPart: "지역 대학이라 대외활동 정보가 적어서 스스로 찾아다녀야 했어요.",
      fitFor: "사람과 서비스에 관심 있고 지역 산업이 궁금한 학생",
    },
    availableTimes: ["평일 오후", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m13",
    name: "임도현",
    university: "전북대학교",
    major: "국어국문학과",
    grade: "4학년",
    interests: ["인문·어문", "교육"],
    topics: ["과목별 공부 경험", "공부 동기", "진로 탐색", "전공생활"],
    experience:
      "전북 일반고에서 국어 성적이 잘 오르지 않아 독서와 글쓰기 습관부터 다시 만들었어요. 국문과에서 배우는 것, 교사·출판·콘텐츠 등 문과 진로를 구체적으로 알려드려요.",
    intro: "문과가 취업이 걱정되는 친구, 국문과 선배와 이야기해봐요.",
    hometown: "전북",
    insight: {
      satisfaction: 4,
      unknownBefore: "문학 감상만이 아니라 언어학·국어사 같은 이론 과목도 많아요.",
      hardPart: "취업 걱정으로 흔들릴 때 복수전공과 인턴 경험으로 방향을 잡았어요.",
      fitFor: "읽고 쓰는 게 좋고 정답이 하나가 아닌 질문을 즐기는 학생",
      switched: { reason: "처음엔 교육 계열로 입학했다가 글 쓰는 게 더 잘 맞는다고 느껴 국어국문학으로 전공을 옮겼어요. 옮기고 나서 인정되는 학점과 졸업 요건을 꼭 확인해야 한다는 걸 배웠어요." },
    },
    availableTimes: ["평일 저녁", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m14",
    name: "서지우",
    university: "경북대학교",
    major: "건축학부",
    grade: "3학년",
    interests: ["공학", "예체능"],
    topics: ["전공 선택", "전공생활", "관심 직업", "대학 선택"],
    experience:
      "그림 그리기와 수학을 둘 다 좋아해서 건축을 알게 됐어요. 지방 고등학교에는 건축 정보가 거의 없어서 직접 조사했고, 지금은 설계 스튜디오 수업과 밤샘 과제까지 학과 생활을 솔직하게 들려드려요.",
    intro: "건축과가 궁금하다면, 스튜디오 생활까지 솔직하게 말해줄게요.",
    hometown: "경북",
    insight: {
      satisfaction: 3,
      unknownBefore: "설계 스튜디오 과제가 많아 밤샘이 일상이고, 수학·구조 과목도 꽤 있어요.",
      hardPart: "건축학 과정은 5년제라 과제와 체력 관리가 힘들어서 중간에 크게 지친 적이 있어요.",
      fitFor: "그리기와 만들기를 좋아하고 오래 붙잡고 작업할 수 있는 학생",
    },
    availableTimes: ["평일 저녁", "주말 오전"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m15",
    name: "조은비",
    university: "홍익대학교",
    major: "시각디자인과",
    grade: "2학년",
    interests: ["예체능"],
    topics: ["진로 탐색", "대학 선택", "동아리·대외활동", "대학 입학 후 생활"],
    experience:
      "대전에서 미술 입시를 준비했는데 지역에는 입시 정보와 좋은 학원이 부족해서 온라인으로 포트폴리오를 준비했어요. 예체능 입시 준비 과정과 디자인 전공 생활, 공모전 경험을 알려드려요.",
    intro: "예체능 입시, 정보가 없어 막막했던 제 경험을 나눠요.",
    hometown: "대전",
    insight: {
      satisfaction: 4,
      unknownBefore: "감각만으로 되는 게 아니라 작업의 이유를 설명하고 발표하는 연습이 많아요.",
      hardPart: "다른 친구들의 작업과 비교하다 슬럼프가 와서 규칙적인 작업 루틴을 만들었어요.",
      fitFor: "만든 걸 설명하고 피드백을 받아들이는 게 괜찮은 학생",
    },
    availableTimes: ["평일 저녁", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m16",
    name: "문태오",
    university: "울산대학교",
    major: "조선해양공학부",
    grade: "3학년",
    interests: ["공학", "자연과학"],
    topics: ["전공 선택", "관심 직업", "공부 동기", "전공생활"],
    experience:
      "울산에서 자라 조선소와 공장이 익숙했지만 이게 공학이라는 걸 대학에 와서야 알았어요. 이과 과목이 어렵다고 느낄 때 공부 동기를 잡은 경험과 지역 산업과 연결된 공학 진로를 알려드려요.",
    intro: "우리 지역 산업이 곧 내 진로가 될 수 있어요.",
    hometown: "울산",
    insight: {
      satisfaction: 4,
      unknownBefore: "배만 만드는 게 아니라 유체·구조·재료 이론을 폭넓게 배워요.",
      hardPart: "유체역학 수학이 어려워서 1학년 방학에 계산 위주로 다시 공부했어요.",
      fitFor: "큰 구조물과 산업 현장에 흥미가 있고 수학·물리를 견딜 수 있는 학생",
    },
    availableTimes: ["평일 저녁", "주말 오전"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m17",
    name: "배소율",
    university: "고려대학교",
    major: "법학과",
    grade: "4학년",
    interests: ["사회·심리", "인문·어문"],
    topics: ["진로 탐색", "관심 직업", "공부 방법", "대학 선택"],
    experience:
      "충북 청주의 일반고를 졸업했고 법조계에 아는 사람이 한 명도 없었어요. 법학과에서 배우는 내용과 법조인·공무원·기업 법무 등 진로, 긴 글을 읽고 정리하는 공부법을 알려드려요.",
    intro: "주변에 법 쪽으로 물어볼 사람이 없다면 저에게 물어보세요.",
    hometown: "충북",
    insight: {
      satisfaction: 3,
      unknownBefore: "판례와 법 조문을 읽는 양이 엄청나고, 드라마 속 법정 장면과는 많이 달라요.",
      hardPart: "읽어야 할 분량이 많아서 첫 학기에 공부 방법을 완전히 바꿔야 했어요.",
      fitFor: "긴 글을 꼼꼼히 읽고 논리적으로 정리하는 게 괜찮은 학생",
      switched: { reason: "법학과에 입학했지만 정치외교를 복수전공하면서 내가 정말 법이 맞는지 오래 고민했어요. 두 전공을 병행하니 시간표와 학점 관리가 힘들었고, 결국 법학을 주전공으로 확정했어요." },
    },
    availableTimes: ["평일 저녁", "주말 저녁"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m18",
    name: "오지훈",
    university: "강원대학교",
    major: "컴퓨터공학과",
    grade: "2학년",
    interests: ["IT·컴퓨터", "공학"],
    topics: ["전공 선택", "동아리·대외활동", "공부 동기", "대학생활"],
    experience:
      "강원도 소도시에는 코딩 학원이 없어서 온라인으로 혼자 배웠어요. 지역 대학 동아리와 프로젝트에서 팀 개발을 처음 경험했고, 지금은 지방대에서 개발자를 준비하는 현실적인 방법을 나눠요.",
    intro: "학원 없이도 코딩을 시작할 수 있어요. 첫걸음부터 알려드릴게요.",
    hometown: "강원",
    insight: {
      satisfaction: 4,
      unknownBefore: "코딩만이 아니라 수학, 팀 협업, 문서 정리가 큰 비중을 차지해요.",
      hardPart: "지역에는 스터디·해커톤 정보가 적어서 온라인 커뮤니티로 찾아야 했어요.",
      fitFor: "혼자서도 검색하고 시도해 보는 걸 즐기는 학생",
    },
    availableTimes: ["평일 오후", "주말 저녁"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m19",
    name: "한예린",
    university: "진주교육대학교",
    major: "초등교육과",
    grade: "3학년",
    interests: ["교육", "사회·심리"],
    topics: ["관심 직업", "진로 탐색", "대학 선택", "대학생활"],
    experience:
      "경남 작은 도시에서 자라 초등학교 선생님을 꿈꿨어요. 교대에 가는 과정, 교대의 수업과 교생실습 생활, 교사라는 직업의 장단점을 현실적으로 알려드려요.",
    intro: "선생님이 꿈이라면 교대 생활이 어떤지 알려드릴게요.",
    hometown: "경남",
    insight: {
      satisfaction: 4,
      unknownBefore: "교대는 대부분 교사가 되는 과정이라 전공 선택 폭이 좁고, 전 과목을 골고루 배워요.",
      hardPart: "교육실습에서 아이들 앞에 서는 게 처음엔 무서웠어요.",
      fitFor: "아이들과 있는 시간이 즐겁고 여러 과목을 골고루 좋아하는 학생",
    },
    availableTimes: ["평일 저녁", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m20",
    name: "송재원",
    university: "포항공과대학교",
    major: "수학과",
    grade: "졸업생",
    interests: ["자연과학", "IT·컴퓨터"],
    topics: ["과목별 공부 경험", "공부 동기", "전공 선택", "대학 입학 후 생활"],
    experience:
      "경북 시골 학교에서 수학이 재미있어서 혼자 문제를 파고들었어요. 수학과에서 배우는 것과 대학원 진학, 데이터·금융 분야로 이어지는 진로, 수학 공부 동기를 유지하는 방법을 알려드려요.",
    intro: "수학이 어렵다가도 좋아지는 순간, 저는 이렇게 만났어요.",
    hometown: "경북",
    insight: {
      satisfaction: 5,
      unknownBefore: "계산이 아니라 증명 중심이라 고등학교 수학과는 완전히 달라요.",
      hardPart: "1학년 해석학·대수학에서 처음으로 이해가 안 되는 경험을 했고 스터디로 극복했어요.",
      fitFor: "답이 나오는 이유를 끝까지 파고드는 걸 좋아하는 학생",
    },
    availableTimes: ["평일 저녁", "주말 오전"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m21",
    name: "윤채원",
    university: "충남대학교",
    major: "경제학과",
    grade: "3학년",
    interests: ["경영·경제", "사회·심리"],
    topics: ["진로 탐색", "관심 직업", "학습 습관", "동아리·대외활동"],
    experience:
      "대전에서 자랐고 경제 뉴스가 어려워서 흥미가 없었지만 학교 경제 동아리에서 시작해 관심이 생겼어요. 경제학과에서 배우는 것, 금융·공기업·대학원 진로, 꾸준히 공부하는 습관 만드는 법을 알려드려요.",
    intro: "경제가 어렵게만 느껴졌던 제가 경제학과에 온 이유를 들려드려요.",
    hometown: "대전",
    insight: {
      satisfaction: 4,
      unknownBefore: "경제 뉴스가 아니라 수학 모델과 통계를 쓰는 학문이에요.",
      hardPart: "미시·거시 수업의 수식이 낯설어서 첫 학기 성적이 떨어졌어요.",
      fitFor: "숫자와 논리로 세상을 설명하는 데 흥미 있는 학생",
      switched: { reason: "경영학과로 입학했다가 이론을 더 깊게 배우고 싶어 경제학으로 옮겼어요. 옮기면서 수학·통계 기초 과목을 따로 채워야 했지만 후회는 없어요." },
    },
    availableTimes: ["평일 저녁", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m22",
    name: "백승우",
    university: "조선대학교",
    major: "물리치료학과",
    grade: "3학년",
    interests: ["의약·보건"],
    topics: ["관심 직업", "전공 선택", "대학 선택", "전공생활"],
    experience:
      "광주에서 자랐고 운동선수를 하다 다친 경험으로 물리치료를 알게 됐어요. 의료계열이지만 의대·간호대와는 다른 물리치료사의 일, 학과 생활, 국가시험과 취업까지 알려드려요.",
    intro: "의료 쪽에 관심 있다면, 의대·간호 말고도 길이 많다는 걸 알려줄게요.",
    hometown: "광주",
    insight: {
      satisfaction: 4,
      unknownBefore: "운동을 가르치는 것만이 아니라 해부학·생리학 같은 의학 이론 과목이 많아요.",
      hardPart: "실습에서 환자를 직접 대하는 게 부담돼서 실습 전에 많이 연습했어요.",
      fitFor: "사람의 몸과 움직임에 관심이 있고 꾸준히 손으로 연습할 수 있는 학생",
    },
    availableTimes: ["평일 저녁", "주말 오전"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m23",
    name: "류다인",
    university: "서울대학교",
    major: "체육교육과",
    grade: "3학년",
    interests: ["예체능", "교육"],
    topics: ["진로 탐색", "학습 습관", "공부 동기", "대학 선택"],
    experience:
      "강원도에서 운동부 생활을 하며 공부와 운동을 병행하는 게 가장 큰 고민이었어요. 운동을 하면서도 학업을 이어가는 법, 체육교사와 스포츠 분야 진로를 알려드려요.",
    intro: "운동과 공부, 둘 다 놓치고 싶지 않은 친구에게 도움이 될게요.",
    hometown: "강원",
    insight: {
      satisfaction: 4,
      unknownBefore: "운동만 잘하는 게 아니라 교육학·운동 이론 수업과 교육실습 비중이 커요.",
      hardPart: "이론 공부 부담이 커서 스터디에 많이 의지했어요.",
      fitFor: "운동과 가르치는 일을 둘 다 좋아하는 학생",
    },
    availableTimes: ["주말 오전", "주말 오후"],
    online: true,
    verification: SEED_VERIFIED,
  },
  {
    id: "m24",
    name: "홍시우",
    university: "서울예술대학교",
    major: "실용음악과",
    grade: "2학년",
    interests: ["예체능"],
    topics: ["진로 탐색", "관심 직업", "대학 선택", "동아리·대외활동"],
    experience:
      "전북 전주에서 음악을 하고 싶었지만 주변에서 걱정하는 분들이 많았어요. 실용음악 입시 준비 과정, 대학에서의 실기와 이론 수업, 음악으로 할 수 있는 다양한 직업을 알려드려요.",
    intro: "음악이 하고 싶은데 부모님께 말하기 어렵다면 같이 이야기해요.",
    hometown: "전북",
    insight: {
      satisfaction: 4,
      unknownBefore: "연주만 하는 게 아니라 이론·청음·음악 산업 수업 비중도 커요.",
      hardPart: "실기 비교와 진로 불안이 커서 진로 상담과 동료들과의 대화가 큰 힘이 됐어요.",
      fitFor: "매일 연습하는 게 즐겁고 진로의 불확실함도 견딜 수 있는 학생",
    },
    availableTimes: ["평일 저녁", "주말 저녁"],
    online: true,
    verification: SEED_VERIFIED,
  },
];

// 시드 멘토의 주간 시간표는 대략적인 시간대에서 예시로 만든다
export const SEED_MENTORS: Mentor[] = RAW_MENTORS.map((m) => ({ ...m, slots: sampleSlots(m.availableTimes) }));
