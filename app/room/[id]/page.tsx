"use client";

// 화상 멘토링 시연 화면. 실제 영상 연결은 하지 않고, 흐름만 보여준다.
// 내 카메라는 사용자가 버튼을 눌렀을 때만 켠다 (영상은 이 기기 밖으로 전송되지 않음).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { formatSession } from "@/lib/schedule";
import { setRequestStatus, useStore } from "@/lib/store";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, currentUser, requests, allMentors } = useStore();
  const req = requests.find((r) => r.id === id);
  const mentor = req ? allMentors.find((m) => m.id === req.mentorId) : undefined;

  const [joined, setJoined] = useState(false); // 상대방 입장 여부 (시연용)
  const [seconds, setSeconds] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState("");
  const [memo, setMemo] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 상대방이 3초 뒤 입장하는 것처럼 보여준다
  useEffect(() => {
    const t = setTimeout(() => setJoined(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!joined) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [joined]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
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

  const isMentor = currentUser?.role === "mentor";
  const allowed =
    req && currentUser && (isMentor ? req.mentorId === currentUser.mentorId : req.studentId === currentUser.id);

  if (!req || !mentor || !allowed) {
    return (
      <div className="container page empty">
        입장할 수 없는 멘토링이에요. <Link href="/mypage">마이페이지로</Link>
      </div>
    );
  }

  const me = isMentor ? { name: `${mentor.name} 멘토`, seed: mentor.id + mentor.name } : { name: req.studentName, seed: req.studentName };
  const other = isMentor ? { name: `${req.studentName} 학생`, seed: req.studentName } : { name: `${mentor.name} 멘토`, seed: mentor.id + mentor.name };

  const leave = () => {
    stopCamera();
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
          {joined ? `진행 중 ${formatTime(seconds)}` : "상대방을 기다리는 중…"}
        </div>
      </div>

      <div className="room-body">
        <div className="stage">
          <div className={`tile tile-main ${joined ? "speaking" : ""}`}>
            {joined ? (
              <>
                <Avatar seed={other.seed} size={140} />
                <span className="tile-name">{other.name}</span>
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
            <button className="ctrl leave" onClick={leave}>
              나가기
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
          <p className="demo-note">
            시연용 화상회의 화면이에요. 실제로 상대방과 연결되지 않으며, 카메라 영상은 이 기기 밖으로 전송되지 않아요.
          </p>
        </aside>
      </div>
    </div>
  );
}
