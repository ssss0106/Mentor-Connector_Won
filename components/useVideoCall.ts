"use client";

// 화상 멘토링: 멘토와 학생의 브라우저가 WebRTC로 영상·음성을 직접 주고받는다.
// 연결에 필요한 정보(offer/answer)만 저장소(시연방이면 Supabase)를 통해 주고받고, 영상과 음성은 저장하지 않는다.
// - 멘토가 먼저 연결을 제안(offer)하고, 학생이 답(answer)한다.
// - 누가 먼저 들어오든, 다시 들어오든 새로 연결한다 (입장할 때마다 새 hello 값을 남긴다).

import { useCallback, useEffect, useRef, useState } from "react";
import { setRtc, uid, useStore } from "@/lib/store";

const ICE_SERVERS: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

type Role = "mentor" | "student";
type Signal = { id: string; to?: string; sdp: string };

const parse = (raw?: string): Signal | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Signal;
  } catch {
    return null;
  }
};

// 연결 후보를 모두 모은 뒤의 설명을 쓴다 (저장소가 2~3초 간격으로 동기화되어 후보를 하나씩 보내기 어렵다)
function waitForIce(pc: RTCPeerConnection, ms = 3000) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    const check = () => pc.iceGatheringState === "complete" && done();
    pc.addEventListener("icegatheringstatechange", check);
    setTimeout(done, ms);
  });
}

export function useVideoCall({ requestId, role, active }: { requestId: string; role: Role; active: boolean }) {
  const { rtc } = useStore();
  const other: Role = role === "mentor" ? "student" : "mentor";
  const key = (k: string) => `${requestId}:${k}`;

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connection, setConnection] = useState<RTCPeerConnectionState | "idle">("idle");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const tracks = useRef<{ audio: MediaStreamTrack | null; video: MediaStreamTrack | null }>({ audio: null, video: null });
  const helloRef = useRef(uid("hi"));
  const offerIdRef = useRef(""); // 멘토: 지금 보낸 제안 id
  const handledRef = useRef(""); // 학생: 이미 답한 제안 id

  const otherHello = rtc[key(`hello:${other}`)] ?? "";
  const offerRaw = rtc[key("offer")] ?? "";
  const answerRaw = rtc[key("answer")] ?? "";
  const remoteCamOn = rtc[key(`cam:${other}`)] === "1";
  const otherPresent = !!otherHello;

  const applyTracks = (pc: RTCPeerConnection) => {
    for (const t of pc.getTransceivers()) {
      const kind = t.receiver.track?.kind as "audio" | "video" | undefined;
      if (!kind) continue;
      t.direction = "sendrecv";
      void t.sender.replaceTrack(tracks.current[kind]);
    }
  };

  const newPeer = () => {
    pcRef.current?.close();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const stream = new MediaStream();
    setRemoteStream(stream);
    pc.ontrack = (e) => {
      if (!stream.getTracks().includes(e.track)) stream.addTrack(e.track);
      setRemoteStream(new MediaStream(stream.getTracks()));
    };
    pc.onconnectionstatechange = () => setConnection(pc.connectionState);
    pcRef.current = pc;
    setConnection("new");
    return pc;
  };

  // 입장·퇴장 알리기
  useEffect(() => {
    if (!active) return;
    const hello = uid("hi");
    helloRef.current = hello;
    setRtc(key(`hello:${role}`), hello);
    const leave = () => setRtc(key(`hello:${role}`), "");
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
      setRtc(key(`cam:${role}`), "");
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [active, requestId, role]);

  // 멘토: 학생이 들어오면(다시 들어와도) 새 연결을 제안한다
  useEffect(() => {
    if (!active || role !== "mentor") return;
    if (!otherHello) {
      pcRef.current?.close();
      pcRef.current = null;
      setRemoteStream(null);
      setConnection("idle");
      return;
    }
    let cancelled = false;
    (async () => {
      const pc = newPeer();
      pc.addTransceiver("audio", { direction: "sendrecv" });
      pc.addTransceiver("video", { direction: "sendrecv" });
      applyTracks(pc);
      await pc.setLocalDescription(await pc.createOffer());
      await waitForIce(pc);
      if (cancelled || pcRef.current !== pc) return;
      const id = uid("of");
      offerIdRef.current = id;
      setRtc(key("offer"), JSON.stringify({ id, to: otherHello, sdp: pc.localDescription?.sdp ?? "" }));
    })();
    return () => {
      cancelled = true;
    };
  }, [active, role, otherHello]);

  // 멘토: 학생의 답을 받으면 연결을 마친다
  useEffect(() => {
    if (!active || role !== "mentor") return;
    const answer = parse(answerRaw);
    const pc = pcRef.current;
    if (!answer || !pc || answer.id !== offerIdRef.current || pc.signalingState !== "have-local-offer") return;
    void pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
  }, [active, role, answerRaw]);

  // 학생: 나에게 온 새 제안에 답한다
  useEffect(() => {
    if (!active || role !== "student") return;
    const offer = parse(offerRaw);
    if (!offer || offer.to !== helloRef.current || offer.id === handledRef.current) return;
    handledRef.current = offer.id;
    let cancelled = false;
    (async () => {
      const pc = newPeer();
      await pc.setRemoteDescription({ type: "offer", sdp: offer.sdp });
      applyTracks(pc);
      await pc.setLocalDescription(await pc.createAnswer());
      await waitForIce(pc);
      if (cancelled || pcRef.current !== pc) return;
      setRtc(key("answer"), JSON.stringify({ id: offer.id, sdp: pc.localDescription?.sdp ?? "" }));
    })();
    return () => {
      cancelled = true;
    };
  }, [active, role, offerRaw]);

  // 내 마이크·카메라를 연결에 싣는다 (카메라를 켜고 끌 때마다 다시 연결하지 않고 트랙만 바꾼다)
  const setLocalTrack = useCallback(
    (kind: "audio" | "video", track: MediaStreamTrack | null) => {
      tracks.current[kind] = track;
      const pc = pcRef.current;
      if (pc) {
        const t = pc.getTransceivers().find((x) => x.receiver.track?.kind === kind);
        void t?.sender.replaceTrack(track);
      }
      if (kind === "video") setRtc(key(`cam:${role}`), track ? "1" : "");
    },
    [requestId, role],
  );

  return { remoteStream, connection, connected: connection === "connected", otherPresent, remoteCamOn, setLocalTrack };
}
