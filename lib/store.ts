"use client";

// MVP용 간이 저장소: 모든 데이터를 브라우저 localStorage에 보관한다.
// 추후 Firebase/Supabase로 교체할 때 이 파일의 함수만 바꾸면 된다.

import { useEffect, useState } from "react";
import { SEED_MENTORS } from "./data";
import type { Mentor, MentoringRequest, RequestStatus, StudentProfile, User } from "./types";

const KEY = "mentor-connector:v1";
const EVENT = "mentor-connector:change";

interface DB {
  users: User[];
  currentUserId: string | null;
  profiles: StudentProfile[];
  mentors: Mentor[]; // 가입한 멘토 (시드 멘토는 별도)
  requests: MentoringRequest[];
}

const empty: DB = { users: [], currentUserId: null, profiles: [], mentors: [], requests: [] };

function load(): DB {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
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

export function saveMentorProfile(userId: string, mentor: Omit<Mentor, "id">, existingId?: string) {
  update((db) => {
    const id = existingId ?? uid("m");
    db.mentors = db.mentors.filter((m) => m.id !== id);
    db.mentors.push({ ...mentor, id });
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.mentorId = id;
      user.name = mentor.name;
    }
  });
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
