export type Role = "student" | "mentor";

export type ConcernCategory = "학습" | "진로" | "대학생활";

export type RequestStatus = "pending" | "approved" | "scheduled" | "completed";

export interface User {
  id: string;
  role: Role;
  name: string;
  // 멘토 계정이면 연결된 멘토 프로필 id
  mentorId?: string;
}

export interface StudentProfile {
  userId: string;
  grade: string;
  region: string;
  interests: string[]; // 관심 분야
  desiredMajor: string; // 관심 전공 (자유 입력)
  category: ConcernCategory; // 주요 고민 카테고리
  topics: string[]; // 원하는 멘토링 분야 (세부 고민)
  concern: string; // 고민 내용
  admissionPath?: string; // 준비하는 입시 전형 (선택)
  availableTimes: string[];
}

// 멘토 경력 조회 확인 상태: 미제출 → 확인 대기 → 확인 완료 / 반려
export type VerificationStatus = "not_submitted" | "pending" | "approved" | "rejected";

export interface Verification {
  status: VerificationStatus;
  consentName?: string; // 동의서 서명(이름)
  consentAt?: string; // 동의 일시
  fileName?: string; // 첨부한 조회 결과 파일 이름 (시연 버전: 파일 내용은 저장하지 않음)
  submittedAt?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

// 멘토가 겪은 전공·대학생활의 실제 모습 (진학 전 학생에게 가장 필요한 정보)
export interface MajorInsight {
  satisfaction: number; // 현재 전공 만족도 1~5
  unknownBefore: string; // 입학 전에는 몰랐던 점
  hardPart: string; // 적응하면서 힘들었던 점
  fitFor?: string; // 이런 학생에게 잘 맞아요
  switched?: { reason: string }; // 전공을 바꾼 경험 (학과 옮김·복수전공·전공 재선택 포함)
}

// 멘토가 직접 입력하는 입시·성적 정보 (서류로 확인된 정보가 아니며 추천 순서에는 쓰지 않는다)
export interface AdmissionInfo {
  path: string; // 입시 전형
  highSchoolGrade: number; // 고등학교 내신 등급 평균 (소수점 가능, 1~9)
  collegeGpa?: { value: number; scale: number }; // 대학 학점 (선택 공개)
}

export interface Mentor {
  id: string;
  name: string;
  university: string;
  major: string;
  grade: string;
  interests: string[]; // 관심 분야
  topics: string[]; // 멘토링 가능 분야
  experience: string; // 본인의 경험
  insight?: MajorInsight; // 전공·대학생활 실제 경험 (구조화)
  admission?: AdmissionInfo; // 입시·성적 정보 (본인 입력)
  intro: string; // 한 줄 소개
  hometown?: string; // 출신 지역 (같은 지역 학생과의 매칭에 사용)
  availableTimes: string[]; // 대략적인 시간대 (매칭 점수용, slots에서 계산)
  slots?: string[]; // 주간 가능 시간표 ("요일-시", lib/schedule.ts 참고)
  online: boolean;
  verification: Verification;
}

// AI가 수업 녹음을 듣고 만든 요약 (음성과 원문은 저장하지 않는다)
export interface LectureSummary {
  overview: string;
  keyPoints: string[];
  actionItems: string[];
  nextQuestions: string[];
  createdAt: string;
}

export interface MentoringRequest {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  date: string;
  time: string;
  message: string;
  method: string;
  status: RequestStatus;
  createdAt: string;
  price?: number; // 신청 당시의 이용료(원)
  summary?: LectureSummary;
}

// 완료된 멘토링 1건마다 학생이 후기를 1개 남길 수 있다
export interface Review {
  id: string;
  requestId: string;
  mentorId: string;
  studentId: string;
  studentLabel: string; // 익명 표시 ("강원 고1 학생")
  rating: number; // 1~5
  helpful: string[]; // 도움이 된 점
  text: string;
  createdAt: string;
  sample?: boolean; // 시연용 예시 후기
}

// 멘토링 신청 1건마다 멘토·학생 1:1 채팅방이 하나 생긴다
export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string; // 보낸 사람의 User id
  senderName: string;
  text: string;
  createdAt: string;
}
