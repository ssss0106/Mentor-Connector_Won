"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSession } from "@/lib/schedule";
import { createInquiry, markInquiryAnswersRead, useStore } from "@/lib/store";
import type { Inquiry, InquiryType } from "@/lib/types";

const QUESTION_CATEGORIES = ["이용 방법", "멘토링 신청·일정", "결제·환불", "멘토 인증", "계정", "기타"];
const REPORT_CATEGORIES = [
  "부적절한 언행·괴롭힘",
  "개인 연락처 요구·외부 만남 유도",
  "성희롱·성범죄 의심",
  "금전 요구·사기",
  "노쇼·무단 불참",
  "기타",
];
const REQUESTED_ACTIONS = ["사실 확인 후 경고", "멘토링 활동 정지", "계정 영구 정지", "운영자 판단에 맡김"];
const MIN_CONTENT = 10;

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

function InquiryItem({ q, requestLabel }: { q: Inquiry; requestLabel?: string }) {
  const isNew = !!q.answer && !q.answerReadAt;
  return (
    <article className="card inquiry-item">
      <div className="inquiry-top">
        <div className="inquiry-tags">
          <span className={`badge ${q.type === "report" ? "inq-report" : "inq-question"}`}>{q.type === "report" ? "신고" : "문의"}</span>
          <span className="muted">{q.category}</span>
          {isNew && <span className="badge inq-new">새 답변</span>}
        </div>
        <span className={`badge ${q.status === "answered" ? "inq-done" : "inq-wait"}`}>{q.status === "answered" ? "답변 완료" : "답변 대기"}</span>
      </div>
      <h3>{q.title}</h3>
      <p className="inquiry-content">{q.content}</p>
      {(q.targetName || requestLabel || q.requestedAction) && (
        <ul className="info-list inquiry-meta">
          {requestLabel && <li><span>관련 멘토링</span><span>{requestLabel}</span></li>}
          {q.targetName && <li><span>신고 대상</span><span>{q.targetName}</span></li>}
          {q.requestedAction && <li><span>요청한 처분</span><span>{q.requestedAction}</span></li>}
        </ul>
      )}
      <div className="muted inquiry-date">{dateLabel(q.createdAt)} 작성</div>
      {q.answer && (
        <div className="inquiry-answer">
          <div className="inquiry-answer-head">
            <strong>운영자 답변</strong>
            {q.answeredAt && <span className="muted">{dateLabel(q.answeredAt)}</span>}
          </div>
          {q.disposition && (
            <div className="inquiry-disposition">
              처리 결과 · <strong>{q.disposition}</strong>
            </div>
          )}
          <p>{q.answer}</p>
        </div>
      )}
    </article>
  );
}

export default function InquiryPage() {
  const router = useRouter();
  const { ready, currentUser, requests, allMentors, inquiries } = useStore();
  const [tab, setTab] = useState<"new" | "list">("new");
  const [type, setType] = useState<InquiryType>("question");
  const [category, setCategory] = useState("");
  const [requestId, setRequestId] = useState("");
  const [requestedAction, setRequestedAction] = useState(REQUESTED_ACTIONS[3]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (ready && !currentUser) router.replace("/signup");
  }, [ready, currentUser, router]);

  // 내 문의 내역을 열면 새 답변을 읽음으로 처리한다
  useEffect(() => {
    if (tab === "list" && currentUser) markInquiryAnswersRead(currentUser.id);
  }, [tab, currentUser, inquiries.length]);

  if (!ready || !currentUser) return null;

  const isMentor = currentUser.role === "mentor";
  const mine = inquiries.filter((q) => q.userId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const newAnswers = mine.filter((q) => q.answer && !q.answerReadAt).length;

  // 신고할 때 고를 수 있는 내 멘토링
  const myRequests = requests
    .filter((r) => (isMentor ? r.mentorId === currentUser.mentorId : r.studentId === currentUser.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const requestOption = (id?: string) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return undefined;
    const other = isMentor ? `${r.studentName} 학생` : `${allMentors.find((m) => m.id === r.mentorId)?.name ?? "멘토"} 멘토`;
    return { label: `${other} · ${formatSession(r.date, r.time)}`, other };
  };

  const categories = type === "report" ? REPORT_CATEGORIES : QUESTION_CATEGORIES;
  const valid = category && title.trim() && content.trim().length >= MIN_CONTENT;

  const switchType = (t: InquiryType) => {
    setType(t);
    setCategory("");
    setSent(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const related = type === "report" ? requestOption(requestId) : undefined;
    createInquiry({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      type,
      category,
      title: title.trim(),
      content: content.trim(),
      requestId: related ? requestId : undefined,
      targetName: related?.other,
      requestedAction: type === "report" ? requestedAction : undefined,
    });
    setCategory("");
    setRequestId("");
    setTitle("");
    setContent("");
    setSent(true);
    setTab("list");
  };

  return (
    <div className="container narrow page">
      <h1 className="page-title">문의하기</h1>
      <p className="page-sub">궁금한 점을 묻거나, 멘토링 중 겪은 피해를 운영자에게 알려 주세요. 답변은 내 문의 내역에서 확인할 수 있어요.</p>

      <div className="tabs">
        <button className={tab === "new" ? "on" : ""} onClick={() => setTab("new")}>새로 작성</button>
        <button className={tab === "list" ? "on" : ""} onClick={() => setTab("list")}>
          내 문의 내역 ({mine.length}){newAnswers > 0 && <span className="unread">{newAnswers}</span>}
        </button>
      </div>

      {tab === "new" ? (
        <form className="form" onSubmit={submit}>
          <div className="segment">
            <button type="button" className={type === "question" ? "on" : ""} onClick={() => switchType("question")}>
              문의
              <small>이용 방법·결제·계정 등</small>
            </button>
            <button type="button" className={type === "report" ? "on" : ""} onClick={() => switchType("report")}>
              피해 신고
              <small>부적절한 언행·연락처 요구 등</small>
            </button>
          </div>

          {type === "report" && (
            <div className="notice notice-warn report-notice">
              <strong>위급한 상황이거나 범죄 피해라면 112에 먼저 신고해 주세요.</strong>
              <span>청소년 상담이 필요하면 1388에서 24시간 도움을 받을 수 있어요.</span>
              <span className="muted">신고 내용은 운영자만 볼 수 있고, 신고 대상에게 알려지지 않아요.</span>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="cat">{type === "report" ? "피해 유형" : "문의 분류"}</label>
            <select id="cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">선택해 주세요</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {type === "report" && (
            <div className="row">
              <div className="field">
                <label className="label" htmlFor="req">관련 멘토링 <span className="hint">선택</span></label>
                <select id="req" className="select" value={requestId} onChange={(e) => setRequestId(e.target.value)}>
                  <option value="">선택 안 함</option>
                  {myRequests.map((r) => <option key={r.id} value={r.id}>{requestOption(r.id)?.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="act">요청하는 처분</label>
                <select id="act" className="select" value={requestedAction} onChange={(e) => setRequestedAction(e.target.value)}>
                  {REQUESTED_ACTIONS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="title">제목</label>
            <input id="title" className="input" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "report" ? "예: 멘토링 중 개인 연락처를 계속 물어봐요" : "예: 멘토링 일정을 바꾸고 싶어요"} />
          </div>

          <div className="field">
            <label className="label" htmlFor="content">
              내용 <span className="hint">{MIN_CONTENT}자 이상</span>
            </label>
            <textarea id="content" className="textarea" value={content} maxLength={2000} onChange={(e) => setContent(e.target.value)}
              placeholder={type === "report" ? "언제, 어떤 일이 있었는지 자세히 적어 주세요. 날짜와 대화 내용을 적어 주면 확인이 빨라져요." : "궁금한 점을 자유롭게 적어 주세요."} />
          </div>

          <button className="btn btn-block" disabled={!valid}>
            {type === "report" ? "신고 접수하기" : "문의 보내기"}
          </button>
        </form>
      ) : (
        <>
          {sent && <div className="notice inquiry-sent">접수됐어요. 운영자가 확인한 뒤 이곳에 답변을 남겨 드려요.</div>}
          {mine.length === 0 ? (
            <div className="card empty">아직 남긴 문의가 없어요.</div>
          ) : (
            <div className="req-list">
              {mine.map((q) => <InquiryItem key={q.id} q={q} requestLabel={requestOption(q.requestId)?.label} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
