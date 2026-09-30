"use client";

// MVP용 간이 저장소: 모든 데이터를 브라우저 localStorage에 보관한다.
// 추후 Firebase/Supabase로 교체할 때 이 파일의 함수만 바꾸면 된다.

import { useEffect, useState } from "react";
import { SEED_MENTORS } from "./data";
import type { ChatMessage, Mentor, MentoringRequest, RequestStatus, StudentProfile, User, Verification } from "./types";

const KEY = "mentor-connector:v1";
const EVENT = "mentor-connector:change";

interface DB {
  users: User[];
  currentUserId: string | null;
  profiles: StudentProfile[];
  mentors: Mentor[]; // 가입한 멘토 (시드 멘토는 별도)
  requests: MentoringRequest[];
  messages: ChatMessage[];
  lastRead: Record<string, string>; // "userId:requestId" → 마지막으로 읽은 시각
}

const empty: DB = { users: [], currentUserId: null, profiles: [], mentors: [], requests: [], messages: [], lastRead: {} };

function load(): DB {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const db: DB = { ...empty, ...JSON.parse(raw) };
    // 경력 조회 기능 이전에 저장된 멘토는 "서류 미제출" 상태로 본다
    db.mentors = db.mentors.map((m) => ({ ...m, verification: m.verification ?? { status: "not_submitted" } }));
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

// 경력 조회 확인이 끝난 멘토만 학생에게 보여 주고 추천한다
export function getVisibleMentors(db: DB = load()): Mentor[] {
  return getAllMentors(db).filter((m) => m.verification.status === "approved");
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

export function saveMentorProfile(userId: string, mentor: Omit<Mentor, "id" | "verification">, existingId?: string) {
  update((db) => {
    const id = existingId ?? uid("m");
    // 프로필을 수정해도 경력 조회 상태는 그대로 유지한다
    const verification = db.mentors.find((m) => m.id === id)?.verification ?? { status: "not_submitted" };
    db.mentors = db.mentors.filter((m) => m.id !== id);
    db.mentors.push({ ...mentor, id, verification });
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

export function resetAll() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

// ---------- React hook ----------

export interface StoreSnapshot extends DB {
  ready: boolean;
  currentUser: User | null;
  myProfile: StudentProfile | null;
  allMentors: Mentor[];
  visibleMentors: Mentor[]; // 경력 조회 완료 멘토
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
