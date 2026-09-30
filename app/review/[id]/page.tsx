"use client";

// 완료된 멘토링에 대해 학생이 후기를 남기는 화면. 후기는 멘토링 1건에 1개, 학생 이름 없이 지역·학년으로만 표시된다.

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ChipSelect from "@/components/ChipSelect";
import { REVIEW_TAGS } from "@/lib/data";
import { formatSession } from "@/lib/schedule";
import { addReview, useStore } from "@/lib/store";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, currentUser, myProfile, requests, allMentors, allReviews } = useStore();
  const [rating, setRating] = useState(0);
  const [helpful, setHelpful] = useState<string[]>([]);
  const [text, setText] = useState("");

  if (!ready) return null;

  const req = requests.find((r) => r.id === id);
  const mentor = req ? allMentors.find((m) => m.id === req.mentorId) : undefined;
  const mine = !!req && !!currentUser && currentUser.role === "student" && req.studentId === currentUser.id;

  if (!req || !mentor || !mine || req.status !== "completed") {
    return (
      <div className="container page empty">
        후기를 남길 수 없는 멘토링이에요. 멘토링이 끝난 뒤 신청한 학생만 후기를 쓸 수 있어요. <Link href="/mypage">마이페이지로</Link>
      </div>
    );
  }
  if (allReviews.some((r) => r.requestId === req.id)) {
    return (
      <div className="container page empty">
        이미 후기를 남겼어요. <Link href="/mypage">마이페이지로</Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    addReview({
      requestId: req.id,
      mentorId: mentor.id,
      studentId: currentUser!.id,
      studentLabel: myProfile ? `${myProfile.region} ${myProfile.grade} 학생` : "학생",
      rating,
      helpful,
      text: text.trim(),
    });
    alert("후기를 남겼어요. 고마워요!");
    router.push("/mypage");
  };

  return (
    <div className="container narrow page">
      <h1 className="page-title">멘토링 후기</h1>
      <p className="page-sub">
        {mentor.name} 멘토 · {formatSession(req.date, req.time)}
      </p>

      <form className="form" onSubmit={submit}>
        <div className="field">
          <label className="label">만족도</label>
          <div className="star-picker" role="radiogroup" aria-label="별점">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                className={`star-btn ${n <= rating ? "on" : ""}`}
                onClick={() => setRating(n)}
                aria-label={`${n}점`}
                aria-pressed={n === rating}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">
            도움이 된 점 <span className="hint">선택 · 여러 개 골라도 돼요</span>
          </label>
          <ChipSelect options={REVIEW_TAGS} value={helpful} onChange={setHelpful} />
        </div>

        <div className="field">
          <label className="label" htmlFor="text">
            한 줄 후기 <span className="hint">선택 · 이름·학교·연락처는 적지 마세요</span>
          </label>
          <textarea id="text" className="textarea" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="멘토링이 어땠는지 편하게 적어주세요." />
        </div>

        <p className="muted small">
          후기는 “{myProfile ? `${myProfile.region} ${myProfile.grade} 학생` : "학생"}”으로 표시되고 이름은 공개되지 않아요.
        </p>

        <button className="btn btn-block" disabled={!rating}>
          후기 남기기
        </button>
      </form>
    </div>
  );
}
