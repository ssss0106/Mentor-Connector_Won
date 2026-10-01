"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MentorCard from "@/components/MentorCard";
import { categoryLabel } from "@/lib/data";
import { useAiReasons } from "@/lib/ai-reasons";
import { recommendMentors } from "@/lib/match";
import { useStore } from "@/lib/store";

export default function RecommendPage() {
  const router = useRouter();
  const { ready, currentUser, myProfile, visibleMentors } = useStore();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser || currentUser.role !== "student") router.replace("/signup");
    else if (!myProfile) router.replace("/concern");
  }, [ready, currentUser, myProfile, router]);

  const results = useMemo(
    () => (myProfile ? recommendMentors(myProfile, visibleMentors) : []),
    [myProfile, visibleMentors],
  );
  const ai = useAiReasons(myProfile, results.map((r) => r.mentor));

  if (!ready || !myProfile) return null;

  return (
    <div className="container page">
      <h1 className="page-title">당신에게 맞는 멘토를 찾았어요 🎉</h1>
      <p className="page-sub">
        {myProfile.grade} · {myProfile.interests.join(", ")}
        {myProfile.desiredMajor && ` · ${myProfile.desiredMajor}`} · {categoryLabel(myProfile.category)} 고민
        {" "}
        <Link href="/concern" style={{ color: "var(--primary)", fontWeight: 600, marginLeft: 8 }}>
          고민 수정
        </Link>
      </p>

      {results.length === 0 ? (
        <div className="card empty">
          조건에 맞는 멘토를 찾지 못했어요.
          <br />
          <Link href="/mentors" className="btn btn-ghost" style={{ marginTop: 16 }}>
            전체 멘토 둘러보기
          </Link>
        </div>
      ) : (
        <div className="grid">
          {results.map((r) => (
            <MentorCard
              key={r.mentor.id}
              mentor={r.mentor}
              score={r.score}
              reasons={r.reasons}
              breakdown={r.breakdown}
              sameRegion={r.regionFirst}
              story={{ concern: myProfile.concern, ai: ai.reasons[r.mentor.id], aiLoading: ai.status === "loading" }}
            />
          ))}
        </div>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        🤖 “왜 이 선배인지” 설명은 AI가 내 고민과 멘토 소개를 읽고 써요. 이때 고민 내용은 OpenAI 서버로 전송되고, 이름과 연락처는 보내지 않아요.
      </p>
      <p className="muted" style={{ marginTop: 8 }}>
        추천 순서: 같은 지역 출신 멘토를 최대 3명까지 먼저 보여 주고, 나머지는 지역과 관계없이 관심 분야·고민·전공 등이 잘 맞는 순서(점수 순)로 보여 줘요. 점수에 마우스를 올리면 점수를 매긴 이유를 볼 수 있어요.
        <br />
        점수 기준: 관심 분야 일치 +3 · 고민 유형 일치 +3 · 관심 전공 일치 +2 · 경험 분야 일치 +2 · 같은 지역 출신 +2 · 같은 입시 전형 +2 · 전공을 바꾼 경험 +1(전공 선택 고민일 때) · 가능 시간 겹침 +1
      </p>
    </div>
  );
}
