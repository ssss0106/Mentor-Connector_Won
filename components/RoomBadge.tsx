"use client";

// 화면 왼쪽 아래의 "시연방" 표시. 같은 방 코드를 입력한 브라우저끼리 데이터를 공유한다 (공유 모드).
// 방 코드가 없으면 지금처럼 이 브라우저에만 저장된다.

import { useEffect, useState } from "react";
import { CHANGE_EVENT, connectRoom, disconnectRoom, getSyncInfo, stripRoomParam } from "@/lib/shared";

export default function RoomBadge() {
  const [info, setInfo] = useState<ReturnType<typeof getSyncInfo>>({ room: null, status: "off", error: "" });
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const refresh = () => setInfo(getSyncInfo());
    refresh();
    stripRoomParam();
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, []);

  const connect = (e: React.FormEvent) => {
    e.preventDefault();
    const err = connectRoom(code);
    setError(err ?? "");
    if (!err) {
      setCode("");
      setOpen(false);
    }
  };

  const connected = info.room !== null;
  const label = !connected
    ? "🔗 시연방 연결"
    : info.status === "error"
      ? `🟠 시연방 ${info.room} · 연결 문제`
      : info.status === "connecting"
        ? `🟡 시연방 ${info.room} · 연결 중`
        : `🟢 시연방 ${info.room}`;

  return (
    <div className="room-badge">
      {open && (
        <div className="room-panel">
          {connected ? (
            <>
              <strong>시연방 {info.room}</strong>
              <p>
                같은 방 코드를 입력한 브라우저끼리 신청·채팅·후기 등이 실시간으로 공유돼요. 시연용 가상 데이터만 쓰고, 코드는 팀 안에서만 알려 주세요.
              </p>
              {info.status === "error" && <p style={{ color: "#b45a00" }}>{info.error || "연결에 문제가 있어요."} 자동으로 다시 시도하는 중이에요.</p>}
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  disconnectRoom();
                  setOpen(false);
                }}
              >
                연결 끊기 (이 브라우저에만 저장)
              </button>
            </>
          ) : (
            <form onSubmit={connect} className="room-panel" style={{ border: "none", boxShadow: "none", padding: 0, margin: 0, width: "auto" }}>
              <strong>시연방 연결</strong>
              <p>친구와 같은 코드를 입력하면 서로의 신청·채팅이 보여요. (영문·숫자 3자 이상)</p>
              <div className="room-row">
                <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="예: demo" aria-label="시연방 코드" maxLength={40} />
                <button className="btn btn-sm" disabled={!code.trim()}>
                  연결
                </button>
              </div>
              {error && <p style={{ color: "#d92d20" }}>{error}</p>}
            </form>
          )}
        </div>
      )}
      <button className={`room-pill ${connected ? (info.status === "error" ? "err" : "on") : ""}`} onClick={() => setOpen(!open)}>
        {label}
      </button>
    </div>
  );
}
