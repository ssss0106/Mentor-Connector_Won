"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { METHODS } from "@/lib/data";
import { formatSession, hourLabel, upcomingSlots } from "@/lib/schedule";
import { createRequest, useStore } from "@/lib/store";

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, currentUser, myProfile, visibleMentors, requests } = useStore();
  // 경력 조회 확인이 끝난 멘토에게만 신청할 수 있다
  const mentor = visibleMentors.find((m) => m.id === id);

  const [date, setDate] = useState("");
  const [time, setTime] = useState(""); // "19:00"
  const [method, setMethod] = useState(METHODS[0]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ready && (!currentUser || currentUser.role !== "student")) router.replace("/signup");
  }, [ready, currentUser, router]);

  // 고민 입력 내용을 신청서에 미리 채워준다
  useEffect(() => {
    if (myProfile && !message) setMessage(myProfile.concern);
  }, [myProfile]);

  // 앞으로 2주 동안 멘토 시간표에 맞는 실제 시간
  const days = useMemo(() => (mentor ? upcomingSlots(mentor.slots ?? []) : []), [mentor?.id, mentor?.slots?.length]);

  // 이미 다른 신청이 잡힌 시간은 선택할 수 없다
  const booked = useMemo(
    () => new Set(requests.filter((r) => r.mentorId === id).map((r) => `${r.date} ${r.time}`)),
    [requests, id],
  );

  // 첫 번째로 예약 가능한 날짜를 기본 선택
  useEffect(() => {
    if (date || !days.length) return;
    const first = days.find((d) => d.hours.some((h) => !booked.has(`${d.date} ${hourLabel(h)}`)));
    if (first) setDate(first.date);
  }, [days, booked, date]);

  if (!ready || !currentUser || !mentor) return null;

  const selectedDay = days.find((d) => d.date === date);
  const valid = date && time && message.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    if (booked.has(`${date} ${time}`)) {
      alert("방금 다른 신청이 들어온 시간이에요. 다른 시간을 선택해 주세요.");
      setTime("");
      return;
    }
    createRequest({
      studentId: currentUser.id,
      studentName: currentUser.name,
      mentorId: mentor.id,
      date,
      time,
      method,
      message: message.trim(),
    });
    alert(`${mentor.name} 멘토에게 ${formatSession(date, time)} 멘토링을 신청했어요! 마이페이지에서 진행 상태를 확인할 수 있어요.`);
    router.push("/mypage");
  };

  return (
    <div className="container narrow page">
      <h1 className="page-title">멘토링 신청</h1>
      <p className="page-sub">
        {mentor.name} 멘토 · {mentor.university} {mentor.major}
      </p>

      <form className="form" onSubmit={submit}>
        <div className="field">
          <label className="label">
            날짜 선택 <span className="hint">앞으로 2주 동안 멘토가 가능한 날이에요</span>
          </label>
          {days.length === 0 ? (
            <div className="card empty" style={{ padding: 24 }}>
              아직 멘토가 가능한 시간을 등록하지 않았어요.
              <br />
              <Link href="/mentors" className="btn btn-sm btn-ghost" style={{ marginTop: 12 }}>
                다른 멘토 보기
              </Link>
            </div>
          ) : (
            <div className="date-list">
              {days.map((d) => {
                const free = d.hours.filter((h) => !booked.has(`${d.date} ${hourLabel(h)}`)).length;
                return (
                  <button
                    type="button"
                    key={d.date}
                    className={`date-chip ${date === d.date ? "on" : ""}`}
                    disabled={free === 0}
                    onClick={() => {
                      setDate(d.date);
                      setTime("");
                    }}
                  >
                    <strong>{d.label}</strong>
                    <small>{free ? `${free}개 가능` : "마감"}</small>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedDay && (
          <div className="field">
            <label className="label">
              시간 선택 <span className="hint">1시간 멘토링</span>
            </label>
            <div className="time-list">
              {selectedDay.hours.map((h) => {
                const t = hourLabel(h);
                const taken = booked.has(`${selectedDay.date} ${t}`);
                return (
                  <button
                    type="button"
                    key={t}
                    className={`time-chip ${time === t ? "on" : ""}`}
                    disabled={taken}
                    onClick={() => setTime(t)}
                  >
                    {t}~{hourLabel(h + 1)}
                    {taken && <small>예약됨</small>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="field">
          <label className="label">멘토링 방식</label>
          <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="msg">상담하고 싶은 내용</label>
          <textarea id="msg" className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="선배에게 묻고 싶은 내용을 자유롭게 적어주세요." />
        </div>

        <button className="btn btn-block" disabled={!valid}>
          {date && time ? `${formatSession(date, time)} 신청하기` : "날짜와 시간을 선택해 주세요"}
        </button>
      </form>
    </div>
  );
}
