"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { METHODS, TIMES } from "@/lib/data";
import { createRequest, useStore } from "@/lib/store";

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, currentUser, myProfile, visibleMentors } = useStore();
  // 경력 조회 확인이 끝난 멘토에게만 신청할 수 있다
  const mentor = visibleMentors.find((m) => m.id === id);

  const [date, setDate] = useState("");
  const [time, setTime] = useState(TIMES[0]);
  const [method, setMethod] = useState(METHODS[0]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ready && (!currentUser || currentUser.role !== "student")) router.replace("/signup");
  }, [ready, currentUser, router]);

  // 고민 입력 내용을 신청서에 미리 채워준다
  useEffect(() => {
    if (myProfile && !message) setMessage(myProfile.concern);
  }, [myProfile]);

  useEffect(() => {
    if (mentor?.availableTimes.length) setTime(mentor.availableTimes[0]);
  }, [mentor?.id]);

  if (!ready || !currentUser || !mentor) return null;

  const today = new Date().toISOString().slice(0, 10);
  const valid = date && message.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    createRequest({
      studentId: currentUser.id,
      studentName: currentUser.name,
      mentorId: mentor.id,
      date,
      time,
      method,
      message: message.trim(),
    });
    alert(`${mentor.name} 멘토에게 멘토링을 신청했어요! 마이페이지에서 진행 상태를 확인할 수 있어요.`);
    router.push("/mypage");
  };

  return (
    <div className="container narrow page">
      <h1 className="page-title">멘토링 신청</h1>
      <p className="page-sub">
        {mentor.name} 멘토 · {mentor.university} {mentor.major}
      </p>

      <form className="form" onSubmit={submit}>
        <div className="row">
          <div className="field">
            <label className="label" htmlFor="date">희망 날짜</label>
            <input id="date" type="date" className="input" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">희망 시간대</label>
            <select className="select" value={time} onChange={(e) => setTime(e.target.value)}>
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}{mentor.availableTimes.includes(t) ? " (멘토 가능)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

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
          신청하기
        </button>
      </form>
    </div>
  );
}
