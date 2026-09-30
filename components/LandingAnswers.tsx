"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import { SEED_MENTORS } from "@/lib/data";
import type { ConcernCategory } from "@/lib/types";

// 랜딩 페이지 "선배와 나눈 대화 예시" (시연용으로 작성한 가상 질문·답변 사례)
// 학생 질문 → 선배 답변을 채팅 말풍선처럼 보여 준다. 답변자는 시연용 가상 멘토 데이터에서 가져온다.
const TALKS: { category: ConcernCategory; student: string; mentorId: string; question: string; answer: string }[] = [
  {
    category: "학습",
    student: "전남 중3",
    mentorId: "m3",
    question: "계획을 세워도 3일을 못 가요.",
    answer: "계획이 너무 커서 그래요. 하루 할 일을 3개만 적고, 못 한 건 다음 날로 넘기는 칸을 따로 만들어 봐요. 지키는 경험이 쌓여야 계획도 늘릴 수 있어요.",
  },
  {
    category: "학습",
    student: "충북 고2",
    mentorId: "m8",
    question: "요즘 슬럼프라 공부가 손에 안 잡혀요.",
    answer: "저도 이과 과목 공부 동기를 잃은 적이 있어요. 그때 목표를 '하루 30분만'으로 확 낮췄더니 다시 돌아오더라고요. 멈추지만 않으면 돼요.",
  },
  {
    category: "진로",
    student: "강원 고1",
    mentorId: "m2",
    question: "심리학과에 가면 상담사만 할 수 있나요?",
    answer: "상담은 여러 길 중 하나예요. 사람의 생각과 행동을 연구하는 분야가 정말 다양해요. 먼저 '사람의 어떤 점이 궁금한지' 적어 보면 방향이 보여요.",
  },
  {
    category: "진로",
    student: "경북 고3",
    mentorId: "m6",
    question: "지역 대학에 가면 불리하지 않을까요?",
    answer: "학교 이름보다 그 학교에서 무엇을 했는지가 더 중요했어요. 저는 지역 병원 실습 기회가 많았어요. 가고 싶은 학과의 수업과 실습 환경부터 비교해 봐요.",
  },
  {
    category: "대학생활",
    student: "제주 고2",
    mentorId: "m5",
    question: "대학 가면 동아리는 꼭 해야 하나요?",
    answer: "꼭은 아니지만 저는 창업 동아리에서 진로를 찾았어요. 1학년 때 두세 곳에 가볍게 들어가 보고, 제일 재미있는 한 곳에 집중하는 걸 추천해요.",
  },
  {
    category: "대학생활",
    student: "부산 고1",
    mentorId: "m7",
    question: "교환학생은 언제부터 준비해야 해요?",
    answer: "보통 2학년 때 지원하니까 1학년 성적과 어학 점수가 중요해요. 지금은 영어를 꾸준히 읽고 듣는 습관만 만들어 둬도 충분해요.",
  },
];

const FILTERS: ("전체" | ConcernCategory)[] = ["전체", "학습", "진로", "대학생활"];

export default function LandingAnswers() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("전체");
  const shown = TALKS.filter((t) => filter === "전체" || t.category === filter);

  return (
    <>
      <div className="talk-head">
        <h2 className="section-title">
          선배와 나눈 대화 예시 <span className="review-note">시연용으로 작성한 가상 사례예요</span>
        </h2>
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={`chip ${filter === f ? "chip-on" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="talk-grid">
        {shown.map((t) => {
          const m = SEED_MENTORS.find((x) => x.id === t.mentorId);
          if (!m) return null;
          return (
            <article key={t.question} className="card talk-card">
              <div className="talk-row">
                <Avatar seed={`talk-${t.student}`} size={36} />
                <div>
                  <div className="preview-label">
                    {t.student} 학생 · {t.category} 고민
                  </div>
                  <p className="talk-bubble talk-q">{t.question}</p>
                </div>
              </div>

              <div className="talk-row talk-row-me">
                <div>
                  <div className="talk-who">
                    {m.name} 선배 · {m.university} {m.major}
                  </div>
                  <p className="talk-bubble talk-a">{t.answer}</p>
                </div>
                <Avatar seed={m.id + m.name} size={36} />
              </div>

              <Link href={`/mentors/${m.id}`} className="talk-link">
                {m.name} 선배 프로필 보기 →
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
