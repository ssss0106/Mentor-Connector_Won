"use client";

// 화상 멘토링 화면. 멘토와 학생의 브라우저가 WebRTC로 영상·음성을 직접 주고받는다 (components/useVideoCall).
// 내 카메라는 사용자가 버튼을 눌렀을 때만 켠다. 영상과 음성은 서버에 저장하지 않는다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import LectureRecorder, { type LectureRecorderHandle } from "@/components/LectureRecorder";
import { useVideoCall } from "@/components/useVideoCall";
import { SESSION_MINUTES, formatSession } from "@/lib/schedule";
import { agreeRecording, consentOf, sessionDayReached, setRequestStatus, useStore } from "@/lib/store";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const { ready, currentUser, requests, allMentors } = store;
  const req = requests.find((r) => r.id === id);
  const mentor = req ? allMentors.find((m) => m.id === req.mentorId) : undefined;

  const [joined, setJoined] = useState(false); // 상대방 입장 여부 (시연용)
  const [seconds, setSeconds] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState("");
  const [memo, setMemo] = useState("");
  const [leaving, setLeaving] = useState(false);
  const recorderRef = useRef<LectureRecorderHandle>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const isMentor = currentUser?.role === "mentor";
  const consented = !!req && !!consentOf(store, req, isMentor ? "mentor" : "student");
  const inRoom =
    consented && !!currentUser && !!req && req.status === "scheduled" && (isMentor ? req.mentorId === currentUser.mentorId : req.studentId === currentUser.id);
  const call = useVideoCall({ requestId: req?.id ?? "", role: isMentor ? "mentor" : "student", active: inRoom });
  const { setLocalTrack } = call;

  // 입장하면 마이크를 연결에 싣는다 (음소거는 트랙만 끈다)
  useEffect(() => {
    if (!inRoom) return;
    let stopped = false;
    navigator.mediaDevices
      ?.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        micRef.current = s;
        setLocalTrack("audio", s.getAudioTracks()[0] ?? null);
      })
      .catch(() => {});
    return () => {
      stopped = true;
      micRef.current?.getTracks().forEach((t) => t.stop());
      micRef.current = null;
    };
  }, [inRoom, setLocalTrack]);

  useEffect(() => {
    micRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  // 상대방 영상·음성 연결
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = call.remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = call.remoteStream;
  }, [call.remoteStream, call.remoteCamOn, call.connected]);

  // 상대방이 실제로 들어오면 바로 시작한다
  useEffect(() => {
    if (call.otherPresent) setJoined(true);
  }, [call.otherPresent]);

  // 녹음에 동의하고 입장하면, 상대방이 3초 뒤 입장하는 것처럼 보여준다
  useEffect(() => {
    if (!consented) return;
    const t = setTimeout(() => setJoined(true), 3000);
    return () => clearTimeout(t);
  }, [consented]);

  useEffect(() => {
    if (!joined) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [joined]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalTrack("video", null);
  };

  useEffect(() => stopCamera, []);

  const toggleCamera = async () => {
    if (camOn) {
      stopCamera();
      setCamOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setLocalTrack("video", stream.getVideoTracks()[0] ?? null);
      setCamOn(true);
      setCamError("");
    } catch {
      setCamError("카메라를 사용할 수 없어요. 브라우저의 카메라 권한을 확인해 주세요.");
    }
  };

  // video 요소가 화면에 나타난 뒤 스트림을 연결한다
  useEffect(() => {
    if (camOn && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [camOn]);

  if (!ready) return null;

  const allowed =
    req && currentUser && (isMentor ? req.mentorId === currentUser.mentorId : req.studentId === currentUser.id);

  // 멘토링 날짜가 되기 전에는 들어갈 수 없다
  if (!req || !mentor || !allowed || req.status !== "scheduled" || !sessionDayReached(req)) {
    return (
      <div className="container page empty">
        입장할 수 없는 멘토링이에요. <Link href="/mypage">마이페이지로</Link>
      </div>
    );
  }

  const me = isMentor ? { name: `${mentor.name} 멘토`, seed: mentor.id + mentor.name } : { name: req.studentName, seed: req.studentName };
  const other = isMentor ? { name: `${req.studentName} 학생`, seed: req.studentName } : { name: `${mentor.name} 멘토`, seed: mentor.id + mentor.name };

  // 주소로 바로 들어와도 녹음 동의 없이는 입장할 수 없다
  if (!consented) {
    return (
      <div className="container narrow page">
        <div className="card room-consent">
          <h1 className="page-title">화상 멘토링 입장</h1>
          <p className="muted">{mentor.name} 멘토 × {req.studentName} 학생 · {formatSession(req.date, req.time)}</p>
          <p>
            멘토링이 시작되면 자동으로 녹음되고, 끝나면 AI가 요약을 만들어요. 음성 파일과 받아쓴 원문은 저장하지 않아요.
            비속어·괴롭힘·위험한 표현이 감지되면 그 발언의 일부가 운영자와 보호자에게 전달될 수 있어요.
          </p>
          <div className="req-actions">
            <Link href="/mypage" className="btn btn-sm btn-ghost">마이페이지로</Link>
            <button className="btn btn-sm btn-video" onClick={() => agreeRecording(req.id, isMentor ? "mentor" : "student")}>
              동의하고 입장하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    stopCamera();
    // 녹음 중이면 멈추고 요약을 저장한 뒤 나간다
    await recorderRef.current?.finish();
    if (isMentor && req.status !== "completed" && confirm("멘토링을 완료 처리할까요?")) {
      setRequestStatus(req.id, "completed");
    }
    router.push("/mypage");
  };

  return (
    <div className="room">
      <div className="room-top">
        <div>
          <strong>{mentor.name} 멘토 × {req.studentName} 학생</strong>
          <span className="room-meta">{formatSession(req.date, req.time)}</span>
        </div>
        <div className="room-status">
          <span className={`dot ${joined ? "live" : ""}`} />
          {joined ? `진행 중 ${formatTime(seconds)} / ${SESSION_MINUTES}:00` : "상대방을 기다리는 중…"}
        </div>
      </div>

      <div className="room-body">
        <div className="stage">
          <div className={`tile tile-main ${joined ? "speaking" : ""}`}>
            {/* 상대방 음성은 카메라와 상관없이 항상 들린다 */}
            <audio ref={remoteAudioRef} autoPlay />
            {call.connected && call.remoteCamOn ? (
              <>
                <video ref={remoteVideoRef} autoPlay playsInline muted className="remote-video" />
                <span className="tile-name">{other.name}</span>
              </>
            ) : joined ? (
              <>
                <Avatar seed={other.seed} size={140} />
                <span className="tile-name">{other.name}</span>
                <span className="call-status">
                  {!call.otherPresent
                    ? `${other.name}님이 아직 입장하지 않았어요`
                    : !call.connected
                      ? "영상 연결 중…"
                      : "상대방 카메라가 꺼져 있어요"}
                </span>
              </>
            ) : (
              <div className="waiting">
                <div className="spinner" />
                {other.name}님이 곧 입장해요
              </div>
            )}
          </div>

          <div className="tile tile-self">
            {camOn ? (
              <video ref={videoRef} autoPlay playsInline muted className="self-video" />
            ) : (
              <Avatar seed={me.seed} size={72} />
            )}
            <span className="tile-name">나{!micOn && " · 🔇"}</span>
          </div>

          <div className="controls">
            <button className={`ctrl ${micOn ? "" : "off"}`} onClick={() => setMicOn(!micOn)}>
              {micOn ? "🎤 마이크" : "🔇 음소거"}
            </button>
            <button className={`ctrl ${camOn ? "" : "off"}`} onClick={toggleCamera}>
              {camOn ? "📷 카메라 끄기" : "📷 카메라 켜기"}
            </button>
            <button className="ctrl leave" onClick={leave} disabled={leaving}>
              {leaving ? "요약 저장 중…" : "나가기"}
            </button>
          </div>
          {camError && <div className="cam-error">{camError}</div>}
        </div>

        <aside className="room-side">
          <div className="side-box">
            <h3>오늘의 상담 내용</h3>
            <p>{req.message}</p>
          </div>
          <div className="side-box">
            <h3>{isMentor ? "멘토링 메모" : "기억하고 싶은 내용"}</h3>
            <textarea
              className="textarea"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={isMentor ? "학생에게 추천한 내용, 다음 목표 등을 적어두세요." : "선배의 조언, 다음에 해볼 것들을 적어두세요."}
            />
          </div>
          <LectureRecorder
            ref={recorderRef}
            autoStart={joined}
            role={isMentor ? "mentor" : "student"}
            requestId={req.id}
            summary={req.summary}
            mentorId={mentor.id}
            mentorName={mentor.name}
            studentName={req.studentName}
            sessionLabel={`${mentor.name} 멘토 · ${formatSession(req.date, req.time)}`}
          />
        </aside>
      </div>
    </div>
  );
}
