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

export interface Mentor {
  id: string;
  name: string;
  university: string;
  major: string;
  grade: string;
  interests: string[]; // 관심 분야
  topics: string[]; // 멘토링 가능 분야
  experience: string; // 본인의 경험
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
  summary?: LectureSummary;
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
