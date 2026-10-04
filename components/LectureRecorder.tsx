"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import SummaryView from "@/components/SummaryView";
import { addReport, saveSummary } from "@/lib/store";
import type { LectureSummary } from "@/lib/types";

const MAX_SECONDS = 90 * 60;

type Phase = "idle" | "recording" | "processing";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// 이 기기의 마이크로 들리는 소리를 녹음해 서버(/api/summarize)로 보내고, 돌아온 요약만 저장한다.
interface Props {
  requestId: string;
  summary?: LectureSummary;
  mentorId: string;
  mentorName: string;
  studentName: string;
  sessionLabel: string; // 운영자 알림에 쓰는 세션 설명 (학생 이름은 넣지 않는다)
  autoStart: boolean; // 입장 전에 녹음에 동의했고 멘토링이 시작되면 true → 자동으로 녹음 시작
}

export interface LectureRecorderHandle {
  // 녹음 중이면 멈추고 요약까지 마친 뒤 끝난다 (나가기 전에 호출)
  finish: () => Promise<void>;
}

const LectureRecorder = forwardRef<LectureRecorderHandle, Props>(function LectureRecorder(
  { requestId, summary, mentorId, mentorName, studentName, sessionLabel, autoStart },
  ref,
) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [micError, setMicError] = useState(false);
  const [notice, setNotice] = useState<{ severity: string; types: string[] } | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const autoStarted = useRef(false);
  const done = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (phase !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "recording" && seconds >= MAX_SECONDS) recRef.current?.stop();
  }, [phase, seconds]);

  // 화면을 벗어나도 녹음을 멈추고 마이크를 끈 뒤, 녹음된 내용은 요약해서 저장한다
  useEffect(() => {
    return () => {
      if (recRef.current?.state === "recording") recRef.current.stop();
    };
  }, []);

  // 멘토링이 시작되면 무조건 자동으로 녹음하고, 나가서 멘토링이 끝날 때까지 멈출 수 없다
  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    void start();
  }, [autoStart]);

  useImperativeHandle(ref, () => ({
    finish: () =>
      new Promise<void>((resolve) => {
        if (recRef.current?.state !== "recording") return resolve();
        done.current = resolve;
        recRef.current.stop();
      }),
  }));

  const upload = async (blob: Blob) => {
    try {
      await summarize(blob);
    } finally {
      done.current?.();
      done.current = null;
    }
  };

  const summarize = async (blob: Blob) => {
    if (blob.size < 2000) {
      setError("녹음된 내용이 거의 없어요. 다시 시도해 주세요.");
      setPhase("idle");
      return;
    }
    setPhase("processing");
    const form = new FormData();
    form.append("audio", blob, `lecture.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
    form.append("requestId", requestId);
    form.append("sessionLabel", sessionLabel);
    try {
      const res = await fetch("/api/summarize", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "요약에 실패했어요. 잠시 후 다시 시도해 주세요.");
      saveSummary(requestId, { ...data.summary, createdAt: new Date().toISOString() });
      const sf = data.safety;
      if (sf?.flagged) {
        const severity = sf.severity === "urgent" ? "urgent" : "warning";
        addReport({ source: "class", requestId, mentorId, mentorName, studentName, severity, types: sf.types, excerpt: sf.excerpt, reason: sf.reason });
        setNotice({ severity, types: sf.types });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "요약에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPhase("idle");
    }
  };

  const start = async () => {
    setError("");
    setMicError(false);
    setNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const mimeType = pickMime();
      const rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32000 });
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        upload(new Blob(chunks.current, { type: rec.mimeType }));
      };
      rec.start(1000);
      recRef.current = rec;
      setSeconds(0);
      setPhase("recording");
    } catch {
      setMicError(true);
      setError("마이크를 사용할 수 없어요. 브라우저의 마이크 권한을 확인해 주세요.");
    }
  };

  return (
    <div className="side-box">
      <h3>🤖 AI 수업 요약</h3>

      {summary && <SummaryView summary={summary} />}

      {phase === "idle" && (
        <>
          <p className="rec-help">
            {!autoStart
              ? "멘토링이 시작되면 자동으로 녹음이 시작돼요."
              : micError
                ? "녹음을 시작하지 못했어요. 마이크 권한을 허용한 뒤 다시 연결해 주세요."
                : recRef.current
                  ? "녹음이 끝났어요."
                  : "녹음을 준비하고 있어요…"}
          </p>
          {/* 마이크 권한 문제로 녹음이 시작되지 않았을 때만 다시 연결할 수 있다 */}
          {autoStart && micError && (
            <button className="btn btn-sm rec-btn" onClick={start}>
              🎤 녹음 다시 연결
            </button>
          )}
        </>
      )}

      {phase === "recording" && (
        <>
          <div className="rec-live">
            <span className="rec-dot" /> 녹음 중 {fmt(seconds)}
          </div>
          <p className="rec-auto">멘토링이 끝나고 나가기를 누르면 녹음이 끝나고 AI가 요약을 만들어요.</p>
        </>
      )}

      {phase === "processing" && (
        <div className="rec-live">
          <div className="spinner" style={{ margin: 0, width: 18, height: 18 }} /> AI가 요약하는 중이에요…
        </div>
      )}

      {notice && (
        <div className={`safety-notice ${notice.severity}`}>
          ⚠️ 수업 중 부적절할 수 있는 표현({notice.types.join(", ")})이 감지되어 운영자에게 알림이 전달됐어요. AI의 자동 판단이라 틀릴 수도 있어요.
          {notice.types.includes("자해·위기") && (
            <div className="safety-help">힘든 마음이 있다면 혼자 참지 말고 청소년전화 1388에 이야기해 볼 수 있어요.</div>
          )}
        </div>
      )}

      {error && <div className="cam-error">{error}</div>}
      <p className="demo-note">입장 전에 동의한 대로 녹음돼요. 음성 파일과 받아쓴 원문은 저장하지 않아요.</p>
    </div>
  );
});

export default LectureRecorder;
