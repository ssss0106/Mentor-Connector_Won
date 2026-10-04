"use client";

import Link from "next/link";
import Avatar from "@/components/Avatar";
import LandingAnswers from "@/components/LandingAnswers";
import LandingFaq from "@/components/LandingFaq";
import LandingProcess from "@/components/LandingProcess";
import { SEED_MENTORS, SESSION_PRICE, formatPrice } from "@/lib/data";
import { scoreMentor } from "@/lib/match";
import { SESSION_MINUTES } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import type { StudentProfile } from "@/lib/types";

// 시연용 예시 후기 (실제 이용자 후기가 아님)
const REVIEWS = [
  {
    name: "강원 고1 학생",
    info: "진로 고민 · 심리학과 멘토",
    text: "주변에 물어볼 사람이 없었는데, 실제로 배우는 과목과 진로를 듣고 목표가 확실해졌어요.",
  },
  {
    name: "전남 고2 학생",
    info: "대학 선택 고민 · 수의예과 멘토",
    text: "지역 대학과 수도권 대학 사이에서 고민이었는데, 선배 이야기를 들으니 나만의 기준이 생겼어요.",
  },
  {
    name: "경북 고2 학생",
    info: "대학생활 고민 · 경영학과 멘토",
    text: "동아리와 대외활동 이야기를 들으니 대학에 가고 싶은 이유가 생겼어요.",
  },
];

// 첫 화면 미리보기에 보여줄 추천 결과 예시: 심리학과가 궁금한 강원 고1 학생
// 실제 추천과 같은 방식(scoreMentor)으로 점수를 매겨 높은 순서로 보여 준다
const HERO_STUDENT: StudentProfile = {
  userId: "hero",
  grade: "고1",
  region: "강원",
  interests: ["사회·심리", "교육"],
  desiredMajor: "심리학과",
  category: "진로",
  topics: ["전공 선택"],
  concern: "심리학과에 가고 싶은데, 실제로 뭘 배우는지 궁금해요",
  availableTimes: [],
};
const HERO_RESULTS = ["m2", "m1", "m3"]
  .map((id) => SEED_MENTORS.find((m) => m.id === id)!)
  .filter(Boolean)
  .map((m) => scoreMentor(HERO_STUDENT, m))
  .sort((a, b) => b.score - a.score);

const STEPS = [
  { icon: "/images/step1.svg", title: "고민 입력", desc: "가고 싶은 대학·전공과 고민을 적어요" },
  { icon: "/images/step2.svg", title: "맞춤 멘토 추천", desc: "그 길을 먼저 겪은 선배를 찾아드려요" },
  { icon: "/images/step3.svg", title: "1:1 멘토링", desc: `${SESSION_MINUTES}분 온라인으로 이야기해요` },
];

const COMPARE = [
  ["과목 중심", "고민 중심"],
  ["선생님을 직접 탐색", "나에게 맞는 멘토 추천"],
  ["사는 곳에 따라 만날 수 있는 선배가 달라요", "지역과 상관없이 같은 조건으로 만나요"],
  ["입시·전공 정보는 알아서 찾기", "대학·전공을 먼저 겪은 선배의 실제 경험"],
  ["선생님마다 다른 수업료", `모든 멘토 ${SESSION_MINUTES}분 ${formatPrice(SESSION_PRICE)}`],
];

export default function Home() {
  const { currentUser, myProfile } = useStore();

  // 로그인 상태에 따라 "나에게 맞는 멘토 찾기" 버튼의 목적지를 바꾼다
  const findHref = !currentUser ? "/signup" : currentUser.role === "mentor" ? "/mypage" : myProfile ? "/recommend" : "/concern";

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">비수도권 청소년 × 대학생 멘토 1:1</span>
            <h1>
              내 고민을 <em>먼저 경험한</em>
              <br />
              대학생 선배를 만나보세요
            </h1>
            <p>진로·학습·대학생활 고민, 먼저 겪어 본 멘토에게 온라인으로 물어보세요.</p>
            <div className="hero-actions">
              <Link href={findHref} className="btn">
                나에게 맞는 멘토 찾기 →
              </Link>
              <Link href="/signup?role=mentor" className="btn btn-outline">
                멘토로 참여하기
              </Link>
            </div>
          </div>
          <div className="hero-preview">
            <div className="preview-concern">
              <Avatar seed="hero-student" size={44} />
              <div>
                <div className="preview-label">{HERO_STUDENT.grade} · {HERO_STUDENT.region} · 진로 고민</div>
                <div className="preview-text">{HERO_STUDENT.concern}</div>
              </div>
            </div>
            <div className="preview-arrow">추천 멘토 3명을 찾았어요 ↓</div>
            {HERO_RESULTS.map(({ mentor: m, score, breakdown }) => (
              <div key={m.id} className="preview-mentor">
                <Avatar seed={m.id + m.name} size={48} />
                <div className="preview-mentor-info">
                  <strong>{m.name} 멘토</strong>
                  <span className="muted">{m.university} · {m.major}</span>
                </div>
                <span className="score-wrap" tabIndex={0}>
                  <span className="score">{score}점</span>
                  <span role="tooltip" className="score-tip">
                    <strong className="score-tip-title">이렇게 점수를 매겼어요</strong>
                    {breakdown.map((b) => (
                      <span key={b.label} className="score-tip-row">
                        <span>{b.label}</span>
                        <span className="score-tip-pt">+{b.points}</span>
                      </span>
                    ))}
                    <span className="score-tip-row score-tip-total">
                      <span>합계</span>
                      <span className="score-tip-pt">{score}점</span>
                    </span>
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 이용 방법 */}
      <section className="lp-section">
        <div className="container">
          <div className="lp-head">
            <h2>이렇게 이용해요</h2>
            <p>세 단계면 충분해요.</p>
          </div>
          <ol className="lp-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="lp-step">
                <img src={s.icon} alt="" />
                <span className="lp-step-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 멘토 소개 */}
      <section className="lp-section lp-white">
        <div className="container">
          <div className="lp-head">
            <h2>이런 멘토들이 기다리고 있어요</h2>
            <p>재학 인증과 경력 조회를 마친 대학생 멘토예요.</p>
          </div>
          <div className="lp-mentors">
            {SEED_MENTORS.slice(0, 3).map((m) => (
              <Link key={m.id} href={`/mentors/${m.id}`} className="lp-mentor">
                <Avatar seed={m.id + m.name} size={64} />
                <strong>{m.name} 멘토</strong>
                <span className="muted">
                  {m.university} · {m.major}
                </span>
                <p>“{m.intro}”</p>
                <span className="lp-verified">✓ 인증 멘토</span>
              </Link>
            ))}
          </div>
          <div className="lp-more">
            <Link href="/mentors" className="btn btn-ghost">
              멘토 전체 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 대화 예시 */}
      <section className="lp-section">
        <div className="container">
          <div className="lp-head">
            <h2>멘토와 나눈 대화 예시</h2>
          </div>
          <LandingAnswers />
        </div>
      </section>

      {/* 후기 */}
      <section className="lp-section lp-white">
        <div className="container">
          <div className="lp-head">
            <h2>이용 후기</h2>
          </div>
          <div className="lp-reviews">
            {REVIEWS.map((r) => (
              <figure key={r.name} className="lp-review">
                <div className="stars" aria-label="별점 5점">★★★★★</div>
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  <Avatar seed={r.name} size={32} />
                  <div>
                    <strong>{r.name}</strong>
                    <div className="muted">{r.info}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 차별점 */}
      <section className="lp-section">
        <div className="container">
          <div className="lp-head">
            <h2>기존 과외 플랫폼과 달라요</h2>
          </div>
          <div className="lp-compare">
            <div className="lp-compare-col">
              <span className="lp-compare-label">기존 과외 플랫폼</span>
              {COMPARE.map(([before]) => (
                <div key={before} className="lp-compare-item">{before}</div>
              ))}
            </div>
            <div className="lp-compare-col ours">
              <span className="lp-compare-label">Menco</span>
              {COMPARE.map(([, after]) => (
                <div key={after} className="lp-compare-item">✓ {after}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 신청부터 완료까지 진행 과정 */}
      <LandingProcess />

      {/* 마무리 */}
      <section className="lp-cta">
        <div className="container">
          <p>
            누가 어디에 살든,
            <br />
            <em>같은 진학 정보와 같은 접근성</em>을 만들어요.
          </p>
          <Link href={findHref} className="btn">
            나에게 맞는 멘토 찾기 →
          </Link>
        </div>
      </section>

      <LandingFaq />
    </>
  );
}
