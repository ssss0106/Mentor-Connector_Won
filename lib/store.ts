"use client";

// MVP용 간이 저장소: 모든 데이터를 브라우저 localStorage에 보관한다.
// 추후 Firebase/Supabase로 교체할 때 이 파일의 함수만 바꾸면 된다.

import { useEffect, useState } from "react";
import { SEED_MENTORS, SEED_REVIEWS } from "./data";
import * as shared from "./shared";
import { dateKey } from "./schedule";
import type { Doc } from "./shared-ops";
import { SEED_STUDENTS } from "./seed-students";
import type { AdminMessage, ChatMessage, GuardianAlert, Inquiry, MentorOffer, MentorSanction, Mentor, MentoringRequest, RequestStatus, StudentProfile, User, Verification, LectureSummary, Review, SafetyReport } from "./types";

const KEY = "mentor-connector:v1";
const EVENT = shared.CHANGE_EVENT;

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
  guardianAlerts: GuardianAlert[];
  offers: MentorOffer[];
  // 시연방에서 두 사람이 동시에 바꿔도 서로 덮어쓰지 않도록, 항목마다 따로 저장한다
  recordingConsents: Record<string, string>; // "신청id:student|mentor" → 녹음 동의 시각
  reactions: Record<string, string>; // "메시지id:사용자id" → 감정 이모지
  excellent: Record<string, boolean>; // 멘토 id → 우수 멘토 선정 여부 (기본 선정 멘토를 해제할 때 false)
  chatUnlocks: Record<string, string>; // 채팅방(roomKey) → 운영자가 채팅 제한을 푼 시각 (이후 안전 알림만 다시 센다)
  rtc: Record<string, string>; // 화상 멘토링 연결 정보 ("신청id:hello|offer|answer|cam:역할" → 값). 영상 자체는 저장하지 않는다
}

const empty: DB = { users: [], currentUserId: null, profiles: [], mentors: [], requests: [], messages: [], reviews: [], reports: [], lastRead: {}, inquiries: [], sanctions: [], adminMessages: [], adminRead: {}, guardianAlerts: [], offers: [], recordingConsents: {}, reactions: {}, excellent: {}, chatUnlocks: {}, rtc: {} };

// 경력 조회 기능 이전에 저장된 멘토는 "서류 미제출" 상태로 본다
function normalize(db: DB): DB {
  db.mentors = db.mentors.map((m) => ({
    ...m,
    verification: m.verification ?? { status: "not_submitted" },
    enrollment: m.enrollment ?? { status: "not_submitted" },
  }));
  return db;
}

function load(): DB {
  if (typeof window === "undefined") return empty;
  // 시연방(공유 모드)이면 서버와 공유하는 데이터를 보여 주고, 로그인한 사용자만 이 브라우저에 따로 둔다
  if (shared.isShared()) {
    return normalize({ ...empty, ...(shared.sharedView() as Partial<DB>), currentUserId: shared.getSession() });
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return normalize({ ...empty, ...JSON.parse(raw) });
  } catch {
    return empty;
  }
}

function save(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(EVENT));
}

function update(fn: (db: DB) => void) {
  if (shared.isShared()) {
    const before = load();
    const after = structuredClone(before);
    fn(after);
    shared.sharedCommit(before as unknown as Doc, after as unknown as Doc);
    return;
  }
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

// ---------- 우수 멘토 ----------

// 기본으로 선정해 둔 우수 멘토 (운영자가 멘토 관리에서 선정하거나 해제할 수 있다)
export const SEED_EXCELLENT = ["m2", "m1", "m3", "m26", "m12"];

// 활동이 제한된 멘토는 우수 멘토로 보여 주지 않는다
export function isExcellentMentor(db: Pick<DB, "excellent" | "sanctions">, mentorId: string): boolean {
  if (activeSanction(db, mentorId)) return false;
  return db.excellent[mentorId] ?? SEED_EXCELLENT.includes(mentorId);
}

export function setExcellent(mentorId: string, value: boolean) {
  update((db) => {
    db.excellent[mentorId] = value;
  });
}

// 운영자가 우수 멘토를 고를 때 참고하는 기록
export function mentorRecord(db: Pick<DB, "requests" | "reviews" | "reports">, mentorId: string) {
  const reviews = [...SEED_REVIEWS, ...db.reviews].filter((r) => r.mentorId === mentorId);
  return {
    completed: db.requests.filter((r) => r.mentorId === mentorId && r.status === "completed").length,
    reviewCount: reviews.length,
    average: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
    alerts: db.reports.filter((r) => r.mentorId === mentorId && r.status !== "dismissed").length,
  };
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
    // 학교나 전공을 바꾸면 재학 인증을 다시 받아야 한다 (서류로 확인한 학교와 달라지므로)
    const schoolChanged = !!prev && (prev.university !== mentor.university || prev.major !== mentor.major);
    const enrollment: Mentor["enrollment"] = prev && !schoolChanged ? prev.enrollment : { status: "not_submitted" };
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
export const canChat = (req: MentoringRequest) => req.status !== "pending" && req.status !== "cancelled";

// 읽은 시각: 기기마다 시계가 조금씩 달라도(상대 기기 시계가 빠르면) 마지막 메시지까지 읽은 것으로 남도록,
// 지금 시각과 마지막 메시지 시각 중 늦은 쪽을 쓴다
// (기기마다 시계가 다르면 메시지가 시간 순서대로 쌓이지 않으므로, 목록의 마지막이 아니라 가장 늦은 시각을 쓴다)
const latest = (...times: (string | undefined)[]) => times.reduce<string>((max, t) => (t && t > max ? t : max), "");
const readStamp = (lastAt: string) => latest(new Date().toISOString(), lastAt);
const latestMessageAt = (msgs: { createdAt: string }[]) => latest(...msgs.map((m) => m.createdAt));

// 같은 학생과 멘토 사이의 대화는 멘토링을 여러 번 해도 하나의 채팅방에 모인다.
// 메시지는 보낼 때 진행 중인 신청 id를 함께 저장하고(안전 알림용), 화면에서는 두 사람의 모든 신청을 묶어서 보여 준다.
type Pair = Pick<MentoringRequest, "studentId" | "mentorId">;
export const roomKey = (r: Pair) => `${r.studentId}~${r.mentorId}`;

export function roomRequests(db: Pick<DB, "requests">, r: Pair): MentoringRequest[] {
  return db.requests
    .filter((x) => x.studentId === r.studentId && x.mentorId === r.mentorId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function roomMessages(db: Pick<DB, "requests" | "messages">, r: Pair): ChatMessage[] {
  const ids = new Set(roomRequests(db, r).map((x) => x.id));
  return db.messages.filter((m) => ids.has(m.requestId));
}

// 채팅을 이어 갈 신청: 가장 최근에 승인된(취소되지 않은) 신청
export function roomActiveRequest(db: Pick<DB, "requests">, r: Pair): MentoringRequest | undefined {
  return roomRequests(db, r).filter(canChat).at(-1);
}

// 마지막으로 읽은 시각 (예전에 신청별로 저장한 기록도 함께 본다)
function readSince(db: Pick<DB, "requests" | "lastRead">, userId: string, r: Pair): string {
  const keys = [`${userId}:room:${roomKey(r)}`, ...roomRequests(db, r).map((x) => `${userId}:${x.id}`)];
  return keys.reduce((max, k) => ((db.lastRead[k] ?? "") > max ? db.lastRead[k] : max), "");
}

export function sendMessage(pair: Pair, sender: User, text: string): MentoringRequest | undefined {
  const now = new Date().toISOString();
  let target: MentoringRequest | undefined;
  update((db) => {
    if (isQuietHours() || chatAlertLocked(db, pair)) return;
    target = roomActiveRequest(db, pair);
    if (!target) return;
    // 보내는 사람은 방의 메시지를 모두 본 것으로 둔다. 읽은 시각은 절대 뒤로 돌아가지 않게 한다
    // (상대 기기 시계가 빨라 미래 시각으로 찍힌 메시지가 있으면, 내 시계 기준 "지금"으로 덮어쓰는 순간 그 메시지가 다시 안 읽음이 됐다)
    const before = latestMessageAt(roomMessages(db, pair));
    db.messages.push({ id: uid("c"), requestId: target.id, senderId: sender.id, senderName: sender.name, text, createdAt: now });
    db.lastRead[`${sender.id}:room:${roomKey(pair)}`] = latest(readSince(db, sender.id, pair), now, before);
  });
  return target;
}

export function markChatRead(pair: Pair, userId: string) {
  const db = load();
  const lastAt = latestMessageAt(roomMessages(db, pair));
  if (!lastAt || readSince(db, userId, pair) >= lastAt) return;
  update((d) => {
    d.lastRead[`${userId}:room:${roomKey(pair)}`] = latest(readSince(d, userId, pair), readStamp(lastAt));
  });
}

export function unreadCount(db: Pick<DB, "messages" | "lastRead" | "requests">, pair: Pair, userId: string): number {
  const since = readSince(db, userId, pair);
  return roomMessages(db, pair).filter((m) => m.senderId !== userId && m.createdAt > since).length;
}

// 상대방이 이 채팅방을 마지막으로 읽은 시각 (카카오톡의 "1"처럼 읽음 여부를 보여 줄 때 쓴다)
export function otherReadAt(db: Pick<DB, "messages" | "lastRead" | "requests" | "users">, pair: Pair, me: User): string {
  const others = me.role === "mentor" ? [pair.studentId] : db.users.filter((u) => u.mentorId === pair.mentorId).map((u) => u.id);
  return others.reduce((max, id) => {
    const t = readSince(db, id, pair);
    return t > max ? t : max;
  }, "");
}

// 메시지에 감정 남기기: 같은 감정을 다시 누르면 취소하고, 다른 감정을 누르면 바꾼다
export const REACTIONS = ["😍", "😆", "👍", "😮", "😢", "😡", "👌"];

// 메시지에 남긴 감정 (사용자 id → 이모지). 예전에 메시지 안에 저장한 감정도 함께 본다.
export function reactionsOf(db: Pick<DB, "reactions">, m: ChatMessage): Record<string, string> {
  const out: Record<string, string> = { ...m.reactions };
  const prefix = `${m.id}:`;
  for (const [k, v] of Object.entries(db.reactions)) if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  for (const k of Object.keys(out)) if (!out[k]) delete out[k];
  return out;
}

export function reactMessage(messageId: string, userId: string, emoji: string) {
  update((db) => {
    const m = db.messages.find((x) => x.id === messageId);
    if (!m) return;
    const key = `${messageId}:${userId}`;
    const current = reactionsOf(db, m)[userId];
    // 지운 감정은 빈 값으로 남겨 예전 방식으로 저장된 감정까지 가린다
    db.reactions[key] = current === emoji ? "" : emoji;
  });
}

// ---------- 멘토링 신청 ----------

export function createRequest(req: Omit<MentoringRequest, "id" | "status" | "createdAt">) {
  update((db) => {
    db.requests.push({ ...req, id: uid("r"), status: "pending", createdAt: new Date().toISOString() });
    // 멘토의 제안으로 신청하면 제안은 수락한 것으로 본다
    const offer = req.offerId ? db.offers.find((o) => o.id === req.offerId && o.status === "pending") : undefined;
    if (offer) {
      offer.status = "accepted";
      offer.respondedAt = new Date().toISOString();
    }
  });
}

// 멘토링 시작 시각이 지났는지 (지난 멘토링은 취소·변경할 수 없다)
export function sessionStarted(req: Pick<MentoringRequest, "date" | "time">, now = new Date()) {
  const start = new Date(`${req.date}T${req.time}:00`);
  return !isNaN(start.getTime()) && start.getTime() <= now.getTime();
}

// 학생은 멘토링이 시작되기 전까지 신청을 취소하거나 바꿀 수 있다
export const canStudentModify = (req: MentoringRequest) =>
  (req.status === "pending" || req.status === "approved" || req.status === "scheduled") && !sessionStarted(req);

export function cancelRequest(id: string) {
  update((db) => {
    const r = db.requests.find((x) => x.id === id);
    if (!r || !canStudentModify(r)) return;
    r.status = "cancelled";
    r.cancelledAt = new Date().toISOString();
  });
}

// 일정이나 내용을 바꾸면 멘토가 다시 확인해야 하므로 "신청 대기"로 돌아간다
export function changeRequest(id: string, change: Pick<MentoringRequest, "date" | "time" | "method" | "message">) {
  update((db) => {
    const r = db.requests.find((x) => x.id === id);
    if (!r || !canStudentModify(r)) return;
    Object.assign(r, change);
    r.status = "pending";
    r.changedAt = new Date().toISOString();
    r.recordingConsent = undefined;
    // 일정이 바뀌면 녹음 동의도 새로 받는다
    db.recordingConsents[`${id}:student`] = "";
    db.recordingConsents[`${id}:mentor`] = "";
  });
}

// 화상 멘토링 입장 전 AI 녹음·요약 동의
export function agreeRecording(id: string, role: "student" | "mentor") {
  update((db) => {
    db.recordingConsents[`${id}:${role}`] = new Date().toISOString();
  });
}

export function consentOf(db: Pick<DB, "recordingConsents">, req: MentoringRequest, role: "student" | "mentor"): string | undefined {
  const key = `${req.id}:${role}`;
  if (key in db.recordingConsents) return db.recordingConsents[key] || undefined;
  return req.recordingConsent?.[role];
}

// 시간 제한 스위치: 기능 테스트 중에는 false로 두어 시간 제한을 모두 끈다.
// true로 바꾸면 ① 채팅 운영 시간(오후 10시~오전 8시 채팅 불가) ② 화상 멘토링 입장·완료 처리는 멘토링 당일부터, 두 제한이 다시 켜진다.
export const TIME_LIMITS_ENABLED = true;

// 멘토링 당일이 되었는지 (화상 입장과 완료 처리는 멘토링 날짜부터 할 수 있다)
export function sessionDayReached(req: Pick<MentoringRequest, "date">, now = new Date()) {
  if (!TIME_LIMITS_ENABLED) return true;
  return dateKey(now) >= req.date;
}

export function setRequestStatus(id: string, status: RequestStatus) {
  update((db) => {
    const r = db.requests.find((x) => x.id === id);
    if (r) r.status = status;
  });
}

// 멘토와 학생이 각자 기기에서 녹음하면 요약이 두 번 만들어진다.
// 멘토 기기의 요약을 기본으로 쓰고, 학생 기기의 요약은 아직 요약이 없을 때만 저장한다.
export function saveSummary(id: string, summary: LectureSummary, by: "student" | "mentor" = "mentor") {
  update((db) => {
    const r = db.requests.find((x) => x.id === id);
    if (!r) return;
    if (by === "student" && r.summary) return;
    r.summary = summary;
  });
}

// ---------- 안전 알림 ----------

export function addReport(r: Omit<SafetyReport, "id" | "status" | "createdAt">) {
  update((db) => {
    const report: SafetyReport = { ...r, id: uid("sf"), status: "new", createdAt: new Date().toISOString() };
    db.reports.push(report);
    // 보호자 연락처가 있으면 바로 보호자에게 알리고, 멘토·학생 채팅방에도 운영팀 안내를 자동으로 남긴다
    const target = guardianOf(db, report);
    if (target?.phone) {
      db.guardianAlerts.push({
        id: uid("ga"),
        reportId: report.id,
        studentId: target.studentId,
        phone: target.phone,
        relation: target.relation,
        message: guardianMessage(report),
        sentBy: "auto",
        createdAt: report.createdAt,
      });
      postSystemMessage(db, report.requestId, "guardian", guardianNotice(report));
    }
    // 채팅에서 안전 알림이 3번 생기면 그 순간부터 두 사람 모두 채팅할 수 없다
    const req = db.requests.find((x) => x.id === report.requestId);
    if (report.source === "chat" && req && chatAlertCount(db, req) === CHAT_ALERT_LIMIT) {
      postSystemMessage(
        db,
        report.requestId,
        "lock",
        `🔒 [Menco 운영팀 자동 안내] 이 채팅방에서 안전 알림이 ${CHAT_ALERT_LIMIT}번 감지되어 지금부터 채팅이 제한돼요. 운영팀이 내용을 확인한 뒤 안내해 드릴게요.`,
      );
    }
  });
}

// ---------- 운영팀 자동 안내 · 채팅 제한 ----------

export const CHAT_ALERT_LIMIT = 3;
const SYSTEM_SENDER = "system";

// 멘토·학생 채팅방에 운영팀 이름으로 안내 메시지를 남긴다 (운영자가 직접 쓰지 않고 자동으로 보낸다)
function postSystemMessage(db: DB, requestId: string, kind: NonNullable<ChatMessage["system"]>, text: string) {
  const now = new Date().toISOString();
  db.messages.push({ id: uid("c"), requestId, senderId: SYSTEM_SENDER, senderName: "Menco 운영팀", text, createdAt: now, system: kind });
}

function guardianNotice(report: Pick<SafetyReport, "source" | "types">) {
  const where = report.source === "class" ? "화상 멘토링" : "채팅";
  const crisis = report.types.includes("자해·위기")
    ? " 힘든 마음이 있다면 혼자 참지 말고 청소년전화 1388이나 자살예방 상담전화 109에 이야기해 주세요."
    : " 서로 존중하는 말로 대화해 주세요.";
  return `🛡️ [Menco 운영팀 자동 안내] 방금 ${where}에서 안전 점검 알림(${report.types.join(", ") || "부적절한 표현"})이 감지되어 학생의 보호자에게 안내 문자를 보냈어요.${crisis}`;
}

// 이 채팅방(같은 학생·멘토)에서 생긴 채팅 안전 알림 수. 오탐으로 처리한 알림과 운영자가 제한을 풀기 전의 알림은 세지 않는다.
export function chatAlertCount(db: Pick<DB, "requests" | "reports" | "chatUnlocks">, pair: Pair): number {
  const ids = new Set(roomRequests(db, pair).map((x) => x.id));
  const since = db.chatUnlocks[roomKey(pair)] ?? "";
  return db.reports.filter((r) => r.source === "chat" && r.status !== "dismissed" && ids.has(r.requestId) && r.createdAt > since).length;
}

export const chatAlertLocked = (db: Pick<DB, "requests" | "reports" | "chatUnlocks">, pair: Pair) => chatAlertCount(db, pair) >= CHAT_ALERT_LIMIT;

// 운영자가 확인한 뒤 채팅 제한을 푼다 (그 뒤의 안전 알림부터 다시 센다)
export function unlockChat(requestId: string) {
  update((db) => {
    const req = db.requests.find((x) => x.id === requestId);
    if (!req) return;
    db.chatUnlocks[roomKey(req)] = new Date().toISOString();
    postSystemMessage(db, requestId, "unlock", "🔓 [Menco 운영팀 안내] 운영팀이 확인을 마치고 채팅 제한을 풀었어요. 다시 대화할 수 있어요.");
  });
}

// 멘토·학생 채팅 운영 시간: 오전 8시 ~ 오후 10시
export const QUIET_NOTICE = "현재는 멘토링 운영 시간이 아닙니다. 내일 아침 8시부터 채팅이 가능합니다.";
export function isQuietHours(now = new Date()) {
  if (!TIME_LIMITS_ENABLED) return false;
  const h = now.getHours();
  return h >= 22 || h < 8;
}

// ---------- 보호자 알림 ----------

// 안전 알림이 난 멘토링의 학생과 보호자 연락처
export function guardianOf(db: Pick<DB, "requests" | "profiles">, report: Pick<SafetyReport, "requestId">) {
  const req = db.requests.find((x) => x.id === report.requestId);
  if (!req) return undefined;
  const profile = db.profiles.find((p) => p.userId === req.studentId);
  return { studentId: req.studentId, phone: profile?.guardianPhone, relation: profile?.guardianRelation };
}

export function guardianMessage(report: Pick<SafetyReport, "studentName" | "mentorName" | "source" | "types" | "severity">) {
  const where = report.source === "class" ? "화상 멘토링" : "멘토링 채팅";
  const urgent = report.severity === "urgent" ? " 긴급하게 확인이 필요해요." : "";
  return `[Menco] ${report.studentName} 학생의 ${where}에서 안전 점검 알림(${report.types.join(", ") || "부적절한 표현"})이 발생했어요.${urgent} 운영팀이 내용을 확인하고 있으며, 필요하면 따로 연락드릴게요. 문의: Menco 운영팀`;
}

export function sendGuardianAlert(reportId: string, phone: string, message: string, relation?: string) {
  update((db) => {
    const report = db.reports.find((x) => x.id === reportId);
    if (!report) return;
    const target = guardianOf(db, report);
    db.guardianAlerts.push({
      id: uid("ga"),
      reportId,
      studentId: target?.studentId ?? "",
      phone,
      relation: relation ?? target?.relation,
      message,
      sentBy: "admin",
      createdAt: new Date().toISOString(),
    });
    postSystemMessage(db, report.requestId, "guardian", guardianNotice(report));
  });
}

export const maskPhone = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length >= 10 ? `${d.slice(0, 3)}-****-${d.slice(-4)}` : phone;
};

export const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;

// ---------- 멘토 → 멘티 제안 ----------

// 멘토에게 보여 줄 수 있는 멘티 (제안 받기에 동의한 학생, 실명 제외)
export function getOpenStudents(db: Pick<DB, "profiles">): StudentProfile[] {
  return [...SEED_STUDENTS, ...db.profiles.filter((p) => p.openToMentors)];
}

// 이름 대신 쓰는 짧은 멘티 번호
export function menteeCode(userId: string) {
  let h = 2166136261;
  for (const c of userId) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507) >>> 0;
  return `멘티 #${(h % 9000) + 1000}`;
}

export function sendOffer(mentorId: string, studentId: string, message: string) {
  update((db) => {
    if (db.offers.some((o) => o.mentorId === mentorId && o.studentId === studentId && o.status === "pending")) return;
    db.offers.push({ id: uid("of"), mentorId, studentId, message, status: "pending", createdAt: new Date().toISOString() });
  });
}

export function respondOffer(id: string, status: "accepted" | "declined") {
  update((db) => {
    const o = db.offers.find((x) => x.id === id);
    if (o && o.status === "pending") {
      o.status = status;
      o.respondedAt = new Date().toISOString();
    }
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
    const before = latestMessageAt(db.adminMessages.filter((m) => m.mentorId === mentorId));
    db.adminMessages.push({ id: uid("am"), mentorId, from, text, createdAt: now });
    // 읽은 시각은 뒤로 돌아가지 않게 한다 (채팅방과 같은 이유)
    if (from === "admin") db.adminRead[mentorId] = latest(db.adminRead[mentorId], now, before);
    else if (mentorUserId) db.lastRead[`${mentorUserId}:admin`] = latest(db.lastRead[`${mentorUserId}:admin`], now, before);
  });
}

// reader: "admin" 이면 운영자, 아니면 멘토의 User id
export function markAdminChatRead(mentorId: string, reader: "admin" | string) {
  const db = load();
  const lastAt = latestMessageAt(db.adminMessages.filter((m) => m.mentorId === mentorId));
  if (!lastAt) return;
  const key = reader === "admin" ? null : `${reader}:admin`;
  const seen = key ? db.lastRead[key] : db.adminRead[mentorId];
  if ((seen ?? "") >= lastAt) return;
  update((d) => {
    const stamp = readStamp(lastAt);
    if (key) d.lastRead[key] = latest(d.lastRead[key], stamp);
    else d.adminRead[mentorId] = latest(d.adminRead[mentorId], stamp);
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
  // 시연방(공유 모드)에서는 이 방의 데이터만 지우고, 이 브라우저에 따로 저장된 기존 데이터는 건드리지 않는다
  if (shared.isShared()) shared.resetRoom();
  else localStorage.removeItem(KEY);
  Object.keys(localStorage)
    .filter((k) => k.startsWith("mentor-connector:reasons:"))
    .forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new Event(EVENT));
}

// ---------- 화상 멘토링 연결 정보 ----------

// 두 사람의 브라우저가 서로 영상을 직접 주고받을 수 있도록 연결 정보(접속 신호)만 공유한다.
// 시연방(Supabase)에서는 다른 컴퓨터끼리, 시연방이 아니면 같은 브라우저의 다른 탭끼리 연결된다.
export function setRtc(key: string, value: string) {
  update((db) => {
    if ((db.rtc[key] ?? "") === value) return;
    db.rtc[key] = value;
  });
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
