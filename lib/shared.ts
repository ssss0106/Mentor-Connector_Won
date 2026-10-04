"use client";

// 시연방(공유 모드): 같은 방 코드를 입력한 브라우저끼리 서버(Supabase)를 통해 데이터를 공유한다.
// - 방 코드가 없으면 아무것도 하지 않는다 (기존처럼 이 브라우저에만 저장).
// - 내가 바꾼 내용은 먼저 화면에 반영하고(pending), 서버에 항목 단위 변경(op)으로 보낸다.
// - 2~3초마다 서버의 최신 상태를 받아 온다. 내 변경이 서버에 반영되는 중에는 받아 온 상태로 덮어쓰지 않는다.
// - 로그인한 사용자는 이 브라우저에만 저장해서, 브라우저마다 다른 사람으로 동시에 로그인할 수 있다.

import { CLIENT_CHUNK, applyOps, diffDocs, type Doc, type Op } from "./shared-ops";

export const CHANGE_EVENT = "mentor-connector:change";
const ROOM_KEY = "mentor-connector:room";
const POLL_MS = 2500;
const ROOM_PATTERN = /^[A-Za-z0-9_-]{3,40}$/;

export type SyncStatus = "off" | "connecting" | "online" | "error";

let room: string | null = null;
let serverDoc: Doc = {};
let version = 0;
let pending: Op[] = [];
let inFlight = false;
let status: SyncStatus = "off";
let lastError = "";
let viewCache: Doc | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let retryAt = 0;

const cacheKey = (r: string) => `mentor-connector:shared:${r}`;
const sessionKey = (r: string) => `mentor-connector:me:${r}`;
const emit = () => window.dispatchEvent(new Event(CHANGE_EVENT));

function setStatus(s: SyncStatus, error = "") {
  if (s === status && error === lastError) return;
  status = s;
  lastError = error;
  emit();
}

function persist() {
  if (!room) return;
  try {
    localStorage.setItem(cacheKey(room), JSON.stringify({ doc: serverDoc, version, pending }));
  } catch {}
}

export const isShared = () => room !== null;
export const getSyncInfo = () => ({ room, status, error: lastError });
export const isValidRoom = (r: string) => ROOM_PATTERN.test(r);

// 서버 상태에 아직 반영 중인 내 변경을 얹은, 화면에 보여 줄 현재 상태
export function sharedView(): Doc {
  if (!viewCache) viewCache = pending.length ? applyOps(structuredClone(serverDoc), pending) : serverDoc;
  return viewCache;
}

export function getSession(): string | null {
  if (!room) return null;
  try {
    return localStorage.getItem(sessionKey(room));
  } catch {
    return null;
  }
}

function setSession(id: string | null) {
  if (!room) return;
  try {
    if (id) localStorage.setItem(sessionKey(room), id);
    else localStorage.removeItem(sessionKey(room));
  } catch {}
}

// store.ts의 update가 호출한다: 바뀐 내용을 op로 만들어 대기열에 넣고 서버로 보낸다
export function sharedCommit(before: Doc, after: Doc) {
  if (before.currentUserId !== after.currentUserId) setSession((after.currentUserId as string | null) ?? null);
  const ops = diffDocs(before, after);
  if (ops.length) {
    pending.push(...ops);
    viewCache = null;
    persist();
    void flush();
  }
  emit();
}

export function resetRoom() {
  pending.push({ t: "reset" });
  viewCache = null;
  setSession(null);
  persist();
  void flush();
  emit();
}

class RejectedError extends Error {}

async function post(ops: Op[]) {
  const res = await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room, ops }) });
  if (res.ok) return res.json();
  const data = await res.json().catch(() => ({}));
  const message = data.error || `서버 오류 (${res.status})`;
  // 400은 보낸 내용 자체가 거절된 것이라 같은 내용을 다시 보내도 소용없다
  throw res.status === 400 ? new RejectedError(message) : new Error(message);
}

function accept(data: { data?: Doc; version: number }, count: number) {
  pending = pending.slice(count);
  serverDoc = data.data ?? {};
  version = data.version;
  viewCache = null;
  retryAt = 0;
  persist();
}

async function flush() {
  if (!room || inFlight || pending.length === 0) return;
  if (Date.now() < retryAt) return;
  inFlight = true;
  const batch = pending.slice(0, CLIENT_CHUNK);
  try {
    accept(await post(batch), batch.length);
    setStatus("online");
    emit();
  } catch (e) {
    if (e instanceof RejectedError) {
      // 한 번에 보낸 변경 중 거절되는 것만 골라서 버리고, 나머지는 하나씩 다시 보낸다
      let dropped = 0;
      for (const op of batch) {
        try {
          accept(await post([op]), 1);
        } catch (e2) {
          if (e2 instanceof RejectedError) {
            pending = pending.slice(1);
            dropped++;
            persist();
          } else {
            retryAt = Date.now() + 3000;
            setStatus("error", e2 instanceof Error ? e2.message : "연결 오류");
            inFlight = false;
            return;
          }
        }
      }
      viewCache = null;
      setStatus(dropped ? "online" : "error", dropped ? `${dropped}개 변경이 서버에서 거절되어 건너뛰었어요 (${e.message})` : e.message);
      emit();
    } else {
      retryAt = Date.now() + 3000;
      setStatus("error", e instanceof Error ? e.message : "연결 오류");
    }
  } finally {
    inFlight = false;
    if (pending.length && Date.now() >= retryAt) void flush();
  }
}

async function poll() {
  if (!room) return;
  if (pending.length) {
    void flush();
    return;
  }
  if (inFlight) return;
  try {
    const res = await fetch(`/api/db?room=${encodeURIComponent(room)}&since=${version}`, { cache: "no-store" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `서버 오류 (${res.status})`);
    }
    const data = await res.json();
    // 내 변경을 보내는 사이에 늦게 도착한 옛 응답은 무시한다
    if (!pending.length && !inFlight && !data.unchanged && data.version > version) {
      serverDoc = data.data ?? {};
      version = data.version;
      viewCache = null;
      persist();
      emit();
    }
    setStatus("online");
  } catch (e) {
    setStatus("error", e instanceof Error ? e.message : "연결 오류");
  }
}

function activate(r: string) {
  room = r;
  serverDoc = {};
  version = 0;
  pending = [];
  viewCache = null;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey(r)) ?? "null");
    if (cached) {
      serverDoc = cached.doc ?? {};
      version = cached.version ?? 0;
      pending = cached.pending ?? [];
    }
  } catch {}
  status = "connecting";
  lastError = "";
  if (!timer) timer = setInterval(() => void poll(), POLL_MS);
  void poll();
  emit();
}

// 화면이 준비된 뒤에도 주소에 ?room= 이 남아 있으면 지운다 (지우지 않으면 연결을 끊은 뒤 새로고침할 때 다시 연결된다)
export function stripRoomParam() {
  try {
    const url = new URL(location.href);
    if (!url.searchParams.has("room")) return;
    url.searchParams.delete("room");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  } catch {}
}

export function connectRoom(code: string): string | null {
  const r = code.trim();
  if (!isValidRoom(r)) return "방 코드는 영문·숫자·-·_ 3~40자로 입력해 주세요.";
  try {
    localStorage.setItem(ROOM_KEY, r);
  } catch {}
  activate(r);
  return null;
}

// 이 브라우저에 저장된 시연방 캐시(밀린 변경 포함)를 지우고 서버 상태부터 다시 받아 온다
export function resetSync() {
  if (!room) return;
  const r = room;
  try {
    localStorage.removeItem(cacheKey(r));
  } catch {}
  serverDoc = {};
  version = 0;
  pending = [];
  viewCache = null;
  retryAt = 0;
  setStatus("connecting");
  void poll();
  emit();
}

export function disconnectRoom() {
  if (room) {
    try {
      localStorage.removeItem(cacheKey(room));
    } catch {}
  }
  room = null;
  status = "off";
  lastError = "";
  serverDoc = {};
  pending = [];
  viewCache = null;
  try {
    localStorage.removeItem(ROOM_KEY);
  } catch {}
  emit();
}

function init() {
  try {
    // 주소 끝에 ?room=코드 를 붙여 열면 바로 연결한다
    const url = new URL(location.href);
    const param = url.searchParams.get("room");
    if (param && isValidRoom(param)) {
      localStorage.setItem(ROOM_KEY, param);
      url.searchParams.delete("room");
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    }
    const saved = localStorage.getItem(ROOM_KEY);
    if (saved && isValidRoom(saved)) activate(saved);
  } catch {}
  window.addEventListener("focus", () => void poll());
}

if (typeof window !== "undefined") init();
