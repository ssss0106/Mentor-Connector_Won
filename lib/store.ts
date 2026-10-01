"use client";

// MVP용 간이 저장소: 모든 데이터를 브라우저 localStorage에 보관한다.
// 추후 Firebase/Supabase로 교체할 때 이 파일의 함수만 바꾸면 된다.

import { useEffect, useState } from "react";
import { SEED_MENTORS, SEED_REVIEWS } from "./data";
import type { AdminMessage, ChatMessage, Inquiry, MentorSanction, Mentor, MentoringRequest, RequestStatus, StudentProfile, User, Verification, LectureSummary, Review, SafetyReport } from "./types";

const KEY = "mentor-connector:v1";
const EVENT = "mentor-connector:change";

interface DB {
  users: User[];
  currentUserId: string | null;
  profiles: StudentProfile[];
  mentors: Mentor[]; // 가입한 멘토 (시드 멘토는 별도)
  requests: MentoringRequest[];
  messages: ChatMessage[];
  reviews: Review[];
  reports: SafetyReport[];
  lastRead: Record<string, string>; // "userId:requestId" → 마지막으로 읽은 시각
  inquiries: Inquiry[];
  sanctions: MentorSanction[];
  adminMessages: AdminMessage[];
  adminRead: Record<string, string>; // 멘토 id → 운영자가 그 멘토와의 채팅을 마지막으로 읽은 시각
}

const empty: DB = { users: [], currentUserId: null, profiles: [], mentors: [], requests: [], messages: [], reviews: [], reports: [], lastRead: {}, inquiries: [], sanctions: [], adminMessages: [], adminRead: {} };

function load(): DB {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const db: DB = { ...empty, ...JSON.parse(raw) };
    // 경력 조회 기능 이전에 저장된 멘토는 "서류 미제출" 상태로 본다
    db.mentors = db.mentors.map((m) => ({
      ...m,
      verification: m.verification ?? { status: "not_submitted" },
      enrollment: m.enrollment ?? { status: "not_submitted" },
    }));
    return db;
  } catch {
    return empty;
  }
}

function save(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(EVENT));
}

function update(fn: (db: DB) => void) {
  const db = load();
  fn(db);
  save(db);
}

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

// ---------- 조회 ----------

export function getAllMentors(db: DB = load()): Mentor[] {
  return [...SEED_MENTORS, ...db.mentors];
}

export function getMentor(id: string, db: DB = load()): Mentor | undefined {
  return getAllMentors(db).find((m) => m.id === id);
}

// 재학 인증과 경력 조회 확인이 모두 끝난 멘토만 학생에게 보여 주고 추천한다
export const isVerifiedMentor = (m: Mentor) => m.verification.status === "approved" && m.enrollment.status === "approved";

// 지금 효력이 있는 조치 (영구 정지, 또는 기간이 남은 활동 정지)
export function activeSanction(db: Pick<DB, "sanctions">, mentorId: string): MentorSanction | undefined {
  const now = new Date().toISOString();
  return [...db.sanctions]
    .reverse()
    .find((s) => s.mentorId === mentorId && !s.liftedAt && (s.type === "banned" || (s.until ?? "") > now));
}

// 활동 정지·영구 정지된 멘토는 목록·추천·신청에서 빠진다
export function getVisibleMentors(db: DB = load()): Mentor[] {
  return getAllMentors(db).filter((m) => isVerifiedMentor(m) && !activeSanction(db, m.id));
}

// ---------- 계정 ----------

export function signUp(role: User["role"], name: string): User {
  const user: User = { id: uid("u"), role, name };
  update((db) => {
    db.users.push(user);
    db.currentUserId = user.id;
  });
  return user;
}

// 시드 멘토 계정으로 로그인 (시연용). 해당 멘토 계정이 없으면 만든다.
export function loginAsSeedMentor(mentorId: string) {
  update((db) => {
    let user = db.users.find((u) => u.mentorId === mentorId);
    if (!user) {
      const mentor = SEED_MENTORS.find((m) => m.id === mentorId);
      user = { id: uid("u"), role: "mentor", name: mentor?.name ?? "멘토", mentorId };
      db.users.push(user);
    }
    db.currentUserId = user.id;
  });
}

export function login(userId: string) {
  update((db) => {
    db.currentUserId = userId;
  });
}

export function logout() {
  update((db) => {
    db.currentUserId = null;
  });
}

// ---------- 학생 고민 ----------

export function saveStudentProfile(profile: StudentProfile) {
  update((db) => {
    db.profiles = db.profiles.filter((p) => p.userId !== profile.userId);
    db.profiles.push(profile);
  });
}

// ---------- 멘토 프로필 ----------

export function saveMentorProfile(userId: string, mentor: Omit<Mentor, "id" | "verification" | "enrollment">, existingId?: string) {
  update((db) => {
    const id = existingId ?? uid("m");
    // 프로필을 수정해도 경력 조회 상태는 그대로 유지한다
    const prev = db.mentors.find((m) => m.id === id);
    const verification = prev?.verification ?? { status: "not_submitted" };
    const enrollment = prev?.enrollment ?? { status: "not_submitted" };
    db.mentors = db.mentors.filter((m) => m.id !== id);
    db.mentors.push({ ...mentor, id, verification, enrollment });
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.mentorId = id;
      user.name = mentor.name;
    }
  });
}

// ---------- 경력 조회 확인 ----------

function setVerification(mentorId: string, fn: (v: Verification) => Verification) {
  update((db) => {
    const m = db.mentors.find((x) => x.id === mentorId);
    if (m) m.verification = fn(m.verification);
  });
}

// 멘토: 동의서 서명 + 조회 결과 파일 제출 (시연 버전은 파일 이름만 기록)
export function submitVerification(mentorId: string, consentName: string, fileName: string) {
  const now = new Date().toISOString();
  setVerification(mentorId, () => ({ status: "pending", consentName, consentAt: now, fileName, submittedAt: now }));
}

// 운영자: 확인 완료 또는 반려
export function reviewVerification(mentorId: string, approve: boolean, rejectReason?: string) {
  setVerification(mentorId, (v) => ({
    ...v,
    status: approve ? "approved" : "rejected",
    reviewedAt: new Date().toISOString(),
    rejectReason: approve ? undefined : rejectReason,
  }));
}

// ---------- 재학 인증 ----------

// 멘토: 재학증명서·성적증명서 제출 (시연 버전은 파일 이름만 기록)
export function submitEnrollment(mentorId: string, enrollmentFileName: string, transcriptFileName: string) {
  update((db) => {
    const m = db.mentors.find((x) => x.id === mentorId);
    if (m) m.enrollment = { status: "pending", enrollmentFileName, transcriptFileName, submittedAt: new Date().toISOString() };
  });
}

// 운영자: 재학 인증 확인 완료 또는 반려
export function reviewEnrollment(mentorId: string, approve: boolean, rejectReason?: string) {
  update((db) => {
    const m = db.mentors.find((x) => x.id === mentorId);
    if (!m) return;
    m.enrollment = {
      ...m.enrollment,
      status: approve ? "approved" : "rejected",
      reviewedAt: new Date().toISOString(),
      rejectReason: approve ? undefined : rejectReason,
    };
  });
}

// ---------- 채팅 ----------

// 멘토가 승인한 뒤부터 채팅할 수 있다
export const canChat = (req: MentoringRequest) => req.status !== "pending";

export function sendMessage(requestId: string, sender: User, text: string) {
  const now = new Date().toISOString();
  update((db) => {
    db.messages.push({ id: uid("c"), requestId, senderId: sender.id, senderName: sender.name, text, createdAt: now });
    db.lastRead[`${sender.id}:${requestId}`] = now;
  });
}

export function markChatRead(requestId: string, userId: string) {
  const key = `${userId}:${requestId}`;
  const db = load();
  const last = db.messages.filter((m) => m.requestId === requestId).at(-1);
  if (!last || (db.lastRead[key] ?? "") >= last.createdAt) return;
  update((d) => {
    d.lastRead[key] = new Date().toISOString();
  });
}

export function unreadCount(db: Pick<DB, "messages" | "lastRead">, requestId: string, userId: string): number {
  const since = db.lastRead[`${userId}:${requestId}`] ?? "";
  return db.messages.filter((m) => m.requestId === requestId && m.senderId !== userId && m.createdAt > since).length;
}

// ---------- 멘토링 신청 ----------

export function createRequest(req: Omit<MentoringRequest, "id" | "status" | "createdAt">) {
  update((db) => {
    db.requests.push({ ...req, id: uid("r"), status: "pending", createdAt: new Date().toISOString() });
  });
}

export function setRequestStatus(id: string, status: RequestStatus) {
  update((db) => {
    const r = db.requests.find((x) => x.id === id);
    if (r) r.status = status;
  });
}

export function saveSummary(id: string, summary: LectureSummary) {
  update((db) => {
    const r = db.requests.find((x) => x.id === id);
    if (r) r.summary = summary;
  });
}

// ---------- 안전 알림 ----------

export function addReport(r: Omit<SafetyReport, "id" | "status" | "createdAt">) {
  update((db) => {
    db.reports.push({ ...r, id: uid("sf"), status: "new", createdAt: new Date().toISOString() });
  });
}

export function setReportStatus(id: string, status: "reviewed" | "dismissed") {
  update((db) => {
    const r = db.reports.find((x) => x.id === id);
    if (r) r.status = status;
  });
}

// ---------- 후기 ----------

// 완료된 멘토링 1건에 후기는 1개만 남길 수 있다
export function addReview(r: Omit<Review, "id" | "createdAt">) {
  update((db) => {
    if (db.reviews.some((x) => x.requestId === r.requestId)) return;
    db.reviews.push({ ...r, id: uid("rv"), createdAt: new Date().toISOString() });
  });
}

// ---------- 멘토 활동 관리 (운영자) ----------

export function suspendMentor(mentorId: string, days: number, reason: string) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  update((db) => {
    db.sanctions.push({ id: uid("sn"), mentorId, type: "suspended", days, until, reason, createdAt: now.toISOString() });
  });
}

export function banMentor(mentorId: string, reason: string) {
  update((db) => {
    db.sanctions.push({ id: uid("sn"), mentorId, type: "banned", reason, createdAt: new Date().toISOString() });
  });
}

export function liftSanction(mentorId: string) {
  update((db) => {
    const s = activeSanction(db, mentorId);
    if (s) db.sanctions.find((x) => x.id === s.id)!.liftedAt = new Date().toISOString();
  });
}

// ---------- 운영자 ↔ 멘토 채팅 ----------

export function sendAdminMessage(mentorId: string, from: "admin" | "mentor", text: string, mentorUserId?: string) {
  const now = new Date().toISOString();
  update((db) => {
    db.adminMessages.push({ id: uid("am"), mentorId, from, text, createdAt: now });
    if (from === "admin") db.adminRead[mentorId] = now;
    else if (mentorUserId) db.lastRead[`${mentorUserId}:admin`] = now;
  });
}

// reader: "admin" 이면 운영자, 아니면 멘토의 User id
export function markAdminChatRead(mentorId: string, reader: "admin" | string) {
  const db = load();
  const last = db.adminMessages.filter((m) => m.mentorId === mentorId).at(-1);
  if (!last) return;
  const key = reader === "admin" ? null : `${reader}:admin`;
  const seen = key ? db.lastRead[key] : db.adminRead[mentorId];
  if ((seen ?? "") >= last.createdAt) return;
  update((d) => {
    const now = new Date().toISOString();
    if (key) d.lastRead[key] = now;
    else d.adminRead[mentorId] = now;
  });
}

// 운영자 입장에서 안 읽은 멘토 메시지 수 / 멘토 입장에서 안 읽은 운영자 메시지 수
export function adminUnread(db: Pick<DB, "adminMessages" | "adminRead">, mentorId: string): number {
  const since = db.adminRead[mentorId] ?? "";
  return db.adminMessages.filter((m) => m.mentorId === mentorId && m.from === "mentor" && m.createdAt > since).length;
}

export function mentorUnreadFromAdmin(db: Pick<DB, "adminMessages" | "lastRead">, mentorId: string, userId: string): number {
  const since = db.lastRead[`${userId}:admin`] ?? "";
  return db.adminMessages.filter((m) => m.mentorId === mentorId && m.from === "admin" && m.createdAt > since).length;
}

// ---------- 문의·신고 ----------

export function createInquiry(i: Omit<Inquiry, "id" | "status" | "createdAt">) {
  update((db) => {
    db.inquiries.push({ ...i, id: uid("q"), status: "open", createdAt: new Date().toISOString() });
  });
}

// 운영자 답변 (신고는 처리 결과도 함께 남긴다). 다시 답하면 내용이 바뀌고 새 답변으로 표시된다.
export function answerInquiry(id: string, answer: string, disposition?: string) {
  update((db) => {
    const q = db.inquiries.find((x) => x.id === id);
    if (!q) return;
    q.status = "answered";
    q.answer = answer;
    q.disposition = disposition;
    q.answeredAt = new Date().toISOString();
    q.answerReadAt = undefined;
  });
}

// 문의한 사람이 답변을 확인했음을 기록한다
export function markInquiryAnswersRead(userId: string) {
  const db = load();
  if (!db.inquiries.some((q) => q.userId === userId && q.answer && !q.answerReadAt)) return;
  update((d) => {
    const now = new Date().toISOString();
    d.inquiries.forEach((q) => {
      if (q.userId === userId && q.answer && !q.answerReadAt) q.answerReadAt = now;
    });
  });
}

export function resetAll() {
  localStorage.removeItem(KEY);
  Object.keys(localStorage)
    .filter((k) => k.startsWith("mentor-connector:reasons:"))
    .forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new Event(EVENT));
}

// ---------- React hook ----------

export interface StoreSnapshot extends DB {
  ready: boolean;
  currentUser: User | null;
  myProfile: StudentProfile | null;
  allMentors: Mentor[];
  visibleMentors: Mentor[]; // 재학 인증 + 경력 조회 완료 멘토
  allReviews: Review[]; // 시연용 예시 후기 + 이 브라우저에서 남긴 후기
}

function snapshot(ready: boolean): StoreSnapshot {
  const db = ready ? load() : empty;
  const currentUser = db.users.find((u) => u.id === db.currentUserId) ?? null;
  return {
    ...db,
    ready,
    currentUser,
    myProfile: currentUser ? db.profiles.find((p) => p.userId === currentUser.id) ?? null : null,
    allMentors: getAllMentors(db),
    visibleMentors: getVisibleMentors(db),
    allReviews: [...SEED_REVIEWS, ...db.reviews],
  };
}

// localStorage는 클라이언트에서만 읽을 수 있으므로 마운트 후 ready=true가 된다.
export function useStore(): StoreSnapshot {
  const [state, setState] = useState<StoreSnapshot>(() => snapshot(false));
  useEffect(() => {
    const refresh = () => setState(snapshot(true));
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return state;
}
