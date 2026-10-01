"use client";

import { useEffect, useRef, useState } from "react";
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
}

export default function LectureRecorder({ requestId, summary, mentorId, mentorName, studentName, sessionLabel }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [agree, setAgree] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ severity: string; types: string[] } | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const unmounted = useRef(false);

  useEffect(() => {
    if (phase !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "recording" && seconds >= MAX_SECONDS) recRef.current?.stop();
  }, [phase, seconds]);

  // 화면을 벗어나면 녹음을 멈추고 마이크를 끈다 (이 경우 요약은 만들지 않는다)
  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      if (recRef.current?.state === "recording") recRef.current.stop();
    };
  }, []);

  const upload = async (blob: Blob) => {
    if (unmounted.current) return;
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
        addReport({ requestId, mentorId, mentorName, studentName, severity, types: sf.types, excerpt: sf.excerpt, reason: sf.reason });
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
            {summary ? "다시 녹음하면 새 요약으로 바뀌어요." : "수업 내용을 녹음하면 AI가 요약본을 만들어 줘요."}
          </p>
          <label className="check rec-consent">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              녹음과 AI 요약에 멘토·학생 모두 동의했어요. 음성은 요약을 만들 때만 OpenAI 서버로 보내지고, 음성 파일과 받아쓴 원문은 저장하지 않아요. 다만 비속어·괴롭힘·위험한 표현이 감지되면 그 발언의 일부와 사유가 운영자에게 전달될 수 있어요.
            </span>
          </label>
          <button className="btn btn-sm rec-btn" disabled={!agree} onClick={start}>
            ⏺ 녹음 시작
          </button>
        </>
      )}

      {phase === "recording" && (
        <>
          <div className="rec-live">
            <span className="rec-dot" /> 녹음 중 {fmt(seconds)}
          </div>
          <button className="btn btn-sm rec-btn" onClick={() => recRef.current?.stop()}>
            ⏹ 녹음 끝내고 요약하기
          </button>
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
      <p className="demo-note">시연 화면에서는 이 기기의 마이크로 들리는 소리만 녹음돼요.</p>
    </div>
  );
}
