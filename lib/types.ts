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
  availableTimes: string[];
  online: boolean;
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
}
