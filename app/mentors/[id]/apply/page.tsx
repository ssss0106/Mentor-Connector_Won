"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { METHODS, SESSION_PRICE, formatPrice } from "@/lib/data";
import { SESSION_MINUTES, endTime, formatSession, upcomingSlots } from "@/lib/schedule";
import { canStudentModify, changeRequest, createRequest, useStore } from "@/lib/store";

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, currentUser, myProfile, visibleMentors, requests, offers } = useStore();
  // 경력 조회 확인이 끝난 멘토에게만 신청할 수 있다
  const mentor = visibleMentors.find((m) => m.id === id);

  const [date, setDate] = useState("");
  const [time, setTime] = useState(""); // "19:00"
  const [method, setMethod] = useState(METHODS[0]);
  const [message, setMessage] = useState("");
  // ?from=신청id → 같은 멘토와 이어서 멘토링, ?offer=제안id → 멘토의 제안을 받아 신청, ?change=신청id → 신청 변경
  const [query, setQuery] = useState<{ from?: string; offer?: string; change?: string }>({});

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQuery({ from: sp.get("from") ?? undefined, offer: sp.get("offer") ?? undefined, change: sp.get("change") ?? undefined });
  }, []);

  const editing = requests.find((r) => r.id === query.change && r.studentId === currentUser?.id && r.mentorId === id);
  const editable = !!editing && canStudentModify(editing);

  // 바꾸려는 신청의 기존 내용을 채워 둔다
  useEffect(() => {
    if (!editing) return;
    setDate(editing.date);
    setTime(editing.time);
    setMethod(editing.method);
    setMessage(editing.message);
  }, [editing?.id]);

  const prev = requests.find((r) => r.id === query.from && r.studentId === currentUser?.id && r.mentorId === id && r.status === "completed");
  const offer = offers.find((o) => o.id === query.offer && o.studentId === currentUser?.id && o.mentorId === id && o.status === "pending");

  useEffect(() => {
    if (ready && (!currentUser || currentUser.role !== "student")) router.replace("/signup");
  }, [ready, currentUser, router]);

  // 고민 입력 내용(이어서 하는 멘토링이면 지난 멘토링 이야기)을 신청서에 미리 채워준다
  useEffect(() => {
    if (message || query.change) return;
    if (prev) setMessage(`지난 ${formatSession(prev.date, prev.time)} 멘토링에 이어서 이야기하고 싶어요.\n`);
    else if (myProfile) setMessage(myProfile.concern);
  }, [myProfile, prev?.id, query.change]);

  // 앞으로 2주 동안 멘토 시간표에 맞는 실제 시간
  const days = useMemo(() => (mentor ? upcomingSlots(mentor.slots ?? []) : []), [mentor?.id, mentor?.slots?.length]);

  // 이미 다른 신청이 잡힌 시간은 선택할 수 없다 (취소된 신청과 지금 바꾸는 신청은 제외)
  const booked = useMemo(
    () =>
      new Set(
        requests
          .filter((r) => r.mentorId === id && r.status !== "cancelled" && r.id !== query.change)
          .map((r) => `${r.date} ${r.time}`),
      ),
    [requests, id, query.change],
  );

  // 첫 번째로 예약 가능한 날짜를 기본 선택
  useEffect(() => {
    if (date || !days.length) return;
    const first = days.find((d) => d.times.some((t) => !booked.has(`${d.date} ${t}`)));
    if (first) setDate(first.date);
  }, [days, booked, date]);

  if (!ready || !currentUser) return null;
  if (!mentor) {
    return (
      <div className="container page empty">
        지금은 이 멘토에게 신청할 수 없어요. <Link href="/mentors">다른 멘토 보기</Link>
      </div>
    );
  }
  // 안전 알림을 보호자에게 보낼 수 있도록, 보호자 연락처를 등록해야 신청할 수 있다
  if (!myProfile?.guardianPhone) {
    return (
      <div className="container page empty">
        멘토링을 신청하려면 먼저 고민과 보호자 연락처를 입력해 주세요. <Link href="/concern">고민 입력하기</Link>
      </div>
    );
  }
  if (query.change && !editable) {
    return (
      <div className="container page empty">
        이미 시작했거나 끝난 멘토링이라 바꿀 수 없어요. <Link href="/mypage">마이페이지로</Link>
      </div>
    );
  }

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
    if (editing) {
      changeRequest(editing.id, { date, time, method, message: message.trim() });
      alert(`${formatSession(date, time)}(으)로 신청을 바꿨어요. 멘토가 다시 확인하면 확정돼요.`);
      router.push("/mypage");
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
      price: SESSION_PRICE,
      ...(prev ? { followUpOf: prev.id } : {}),
      ...(offer ? { offerId: offer.id } : {}),
    });
    alert(`${mentor.name} 멘토에게 ${formatSession(date, time)} 멘토링(30분, ${formatPrice(SESSION_PRICE)})을 신청했어요! 마이페이지에서 진행 상태를 확인할 수 있어요.`);
    router.push("/mypage");
  };

  return (
    <div className="container narrow page">
      <h1 className="page-title">{editing ? "신청 변경" : prev ? "이어서 멘토링 신청" : "멘토링 신청"}</h1>
      <p className="page-sub">
        {mentor.name} 멘토 · {mentor.university} {mentor.major}
      </p>

      {editing && (
        <div className="card apply-context">
          <strong>✏️ 지금 신청: {formatSession(editing.date, editing.time)} · {editing.method}</strong>
          <span className="muted">날짜·시간·방식·내용을 바꾸면 멘토가 다시 확인한 뒤 확정돼요.</span>
        </div>
      )}
      {prev && (
        <div className="card apply-context">
          <strong>🔁 {mentor.name} 멘토와 이어서 멘토링해요</strong>
          <span className="muted">지난 멘토링 · {formatSession(prev.date, prev.time)} · {prev.method}</span>
          {prev.summary && <span className="muted">지난 수업 요약이 멘토에게 함께 전달돼요.</span>}
        </div>
      )}
      {offer && (
        <div className="card apply-context">
          <strong>💌 {mentor.name} 멘토가 보낸 제안</strong>
          <p className="apply-offer-msg">“{offer.message}”</p>
          <span className="muted">시간을 골라 신청하면 제안을 수락한 것으로 전달돼요.</span>
        </div>
      )}

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
                const free = d.times.filter((t) => !booked.has(`${d.date} ${t}`)).length;
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
              시간 선택 <span className="hint">{SESSION_MINUTES}분 멘토링 1회</span>
            </label>
            <div className="time-list">
              {selectedDay.times.map((t) => {
                const taken = booked.has(`${selectedDay.date} ${t}`);
                return (
                  <button
                    type="button"
                    key={t}
                    className={`time-chip ${time === t ? "on" : ""}`}
                    disabled={taken}
                    onClick={() => setTime(t)}
                  >
                    {t}~{endTime(t)}
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

        <div className="price-box">
          <div>
            <strong>이용료 {formatPrice(SESSION_PRICE)}</strong>
            <span className="muted"> · {SESSION_MINUTES}분 1회 · 모든 멘토 동일</span>
          </div>
        </div>

        <button className="btn btn-block" disabled={!valid}>
          {!(date && time)
            ? "날짜와 시간을 선택해 주세요"
            : editing
              ? `${formatSession(date, time)}(으)로 변경하기`
              : `${formatSession(date, time)} · ${formatPrice(SESSION_PRICE)} 신청하기`}
        </button>
      </form>
    </div>
  );
}
