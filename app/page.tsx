"use client";

import Link from "next/link";
import Avatar from "@/components/Avatar";
import LandingAnswers from "@/components/LandingAnswers";
import LandingFaq from "@/components/LandingFaq";
import { SEED_MENTORS, SESSION_PRICE, formatPrice } from "@/lib/data";
import { SESSION_MINUTES } from "@/lib/schedule";
import { useStore } from "@/lib/store";

// 시연용 예시 후기 (실제 이용자 후기가 아님)
const REVIEWS = [
  {
    name: "강원 고1 학생",
    info: "진로 고민 · 심리학과 멘토",
    text: "주변에 물어볼 사람이 없었는데, 실제로 배우는 과목과 진로를 듣고 목표가 확실해졌어요.",
  },
  {
    name: "전남 중3 학생",
    info: "학습 고민 · 교육학과 멘토",
    text: "멘토가 직접 썼던 플래너 방법을 알려줘서 한 달째 계획을 지키고 있어요!",
  },
  {
    name: "경북 고2 학생",
    info: "대학생활 고민 · 경영학과 멘토",
    text: "동아리와 대외활동 이야기를 들으니 대학에 가고 싶은 이유가 생겼어요.",
  },
];

// 첫 화면 미리보기에 보여줄 추천 결과 예시
// 공부 방법 고민에 맞는 멘토: 이하늘(공부 습관), 류다인(같은 강원 출신·운동과 공부 병행), 윤서아(학원 없이 영어 공부)
const HERO_MENTORS = ["m3", "m23", "m7"].map((id) => SEED_MENTORS.find((m) => m.id === id)!).filter(Boolean);

const STEPS = [
  { icon: "/images/step1.svg", title: "고민 입력", desc: "지금 가장 큰 고민을 적어요" },
  { icon: "/images/step2.svg", title: "맞춤 멘토 추천", desc: "고민을 먼저 겪은 멘토를 찾아드려요" },
  { icon: "/images/step3.svg", title: "1:1 멘토링", desc: `${SESSION_MINUTES}분 온라인으로 이야기해요` },
];

const COMPARE = [
  ["과목 중심", "고민 중심"],
  ["선생님을 직접 탐색", "나에게 맞는 멘토 추천"],
  ["수도권 학원가 중심", "지역 어디서든 온라인으로"],
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
            <span className="hero-eyebrow">지역 청소년 × 대학생 멘토 1:1</span>
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
          <div className="hero-preview" aria-hidden="true">
            <div className="preview-concern">
              <Avatar seed="hero-student" size={44} />
              <div>
                <div className="preview-label">고1 · 강원 · 학습 고민</div>
                <div className="preview-text">계획을 세워도 오래 못 가요. 나한테 맞는 공부 방법을 찾고 싶어요</div>
              </div>
            </div>
            <div className="preview-arrow">추천 멘토 3명을 찾았어요 ↓</div>
            {HERO_MENTORS.map((m) => (
              <div key={m.id} className="preview-mentor">
                <Avatar seed={m.id + m.name} size={48} />
                <div className="preview-mentor-info">
                  <strong>{m.name} 멘토</strong>
                  <span className="muted">{m.university} · {m.major}</span>
                </div>
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
            <p>시연용으로 작성한 가상 후기예요.</p>
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

      {/* 마무리 */}
      <section className="lp-cta">
        <div className="container">
          <p>
            어떤 과목을 누구에게 배울지가 아니라,
            <br />
            <em>어떤 고민에 어떤 경험이 필요한지</em>를 연결해요.
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
