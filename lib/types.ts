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

// 멘토 재학 인증: 재학증명서 + 성적증명서 (시연 버전: 파일 이름만 기록)
export interface Enrollment {
  status: VerificationStatus;
  enrollmentFileName?: string; // 재학증명서
  transcriptFileName?: string; // 성적증명서
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
  verification: Verification; // 성범죄·아동학대 경력 조회
  enrollment: Enrollment; // 재학 인증
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

// 수업 녹음에서 AI가 감지한 부적절한 표현에 대한 운영자 알림 (음성·원문은 저장하지 않고 발언 일부만 남긴다)
export interface SafetyReport {
  id: string;
  requestId: string;
  mentorId: string;
  mentorName: string;
  studentName: string;
  source?: "class" | "chat"; // 수업 녹음에서 감지했는지, 채팅에서 감지했는지
  senderRole?: "student" | "mentor"; // 채팅일 때 보낸 사람
  severity: "warning" | "urgent";
  types: string[];
  excerpt: string;
  reason: string;
  status: "new" | "reviewed" | "dismissed";
  createdAt: string;
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

// 마이페이지 문의하기: 운영자에게 묻는 "문의"와 멘토링 피해를 알리는 "신고"
export type InquiryType = "question" | "report";

export interface Inquiry {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  type: InquiryType;
  category: string; // 문의 분류 또는 피해 유형
  title: string;
  content: string;
  requestId?: string; // 신고: 관련 멘토링
  targetName?: string; // 신고: 신고 대상 (멘토 또는 학생)
  requestedAction?: string; // 신고: 요청하는 처분
  status: "open" | "answered";
  answer?: string;
  disposition?: string; // 신고: 운영자 처리 결과
  answeredAt?: string;
  answerReadAt?: string; // 문의한 사람이 답변을 확인한 시각
  createdAt: string;
}

// 운영자가 멘토에게 내린 조치 (활동 정지는 기간이 끝나면 자동으로 풀린다)
export interface MentorSanction {
  id: string;
  mentorId: string;
  type: "suspended" | "banned";
  days?: number; // 활동 정지 기간(일)
  until?: string; // 활동 정지가 끝나는 시각
  reason: string;
  createdAt: string;
  liftedAt?: string; // 운영자가 직접 해제한 시각
}

// 운영자 ↔ 멘토 1:1 채팅
export interface AdminMessage {
  id: string;
  mentorId: string;
  from: "admin" | "mentor";
  text: string;
  createdAt: string;
}
