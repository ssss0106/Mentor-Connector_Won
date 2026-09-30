"use client";

import Link from "next/link";
import Avatar from "@/components/Avatar";
import MentorCard from "@/components/MentorCard";
import { SEED_MENTORS, SESSION_PRICE, formatPrice } from "@/lib/data";
import { useStore } from "@/lib/store";

// 시연용 예시 후기 (실제 이용자 후기가 아님)
const REVIEWS = [
  {
    name: "강원 고1 학생",
    info: "진로 고민 · 심리학과 멘토와 멘토링",
    text: "심리학과에 가고 싶었는데 주변에 물어볼 사람이 없었어요. 선배가 실제로 배우는 과목이랑 진로를 알려줘서 목표가 확실해졌어요.",
  },
  {
    name: "전남 중3 학생",
    info: "학습 고민 · 교육학과 멘토와 멘토링",
    text: "공부 계획을 세워도 매번 흐지부지됐는데, 선배가 직접 썼던 플래너 방법을 알려줘서 한 달째 지키고 있어요!",
  },
  {
    name: "경북 고2 학생",
    info: "대학생활 고민 · 경영학과 멘토와 멘토링",
    text: "대학생활이 막연하게만 느껴졌는데 동아리, 대외활동 이야기를 들으니 대학에 가고 싶은 이유가 생겼어요.",
  },
];

// 첫 화면 미리보기에 보여줄 추천 결과 예시
const HERO_MENTORS = [
  { ...SEED_MENTORS[1], score: 13 },
  { ...SEED_MENTORS[0], score: 9 },
  { ...SEED_MENTORS[2], score: 6 },
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
          <span className="hero-eyebrow">지역 청소년 × 대학생 선배 1:1 멘토링</span>
          <h1>
            내 고민을 <em>먼저 경험한</em>
            <br />
            대학생 선배를 만나보세요
          </h1>
          <p>
            과목이 아니라 고민으로 연결해요. 물어볼 곳이 없던 진로·학습·대학생활 고민도, 같은 지역에서 자란 선배에게 온라인으로 물어보세요.
          </p>
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
                <div className="preview-label">고1 · 강원 · 진로 고민</div>
                <div className="preview-text">심리학과에 가고 싶은데, 실제로 뭘 배우는지 궁금해요</div>
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
                <span className="score">{m.score}점</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <h2 className="section-title">이렇게 이용해요</h2>
        <div className="features">
          <div className="card feature">
            <img src="/images/step1.svg" alt="" className="feature-icon" />
            <div className="num">STEP 1</div>
            <h3>고민 입력</h3>
            <p>학년, 관심 분야, 관심 전공, 지금 가장 큰 고민을 간단히 적어요.</p>
          </div>
          <div className="card feature">
            <img src="/images/step2.svg" alt="" className="feature-icon" />
            <div className="num">STEP 2</div>
            <h3>맞춤 선배 추천</h3>
            <p>내 고민을 먼저 경험한 대학생 멘토를 추천 이유와 함께 보여드려요.</p>
          </div>
          <div className="card feature">
            <img src="/images/step3.svg" alt="" className="feature-icon" />
            <div className="num">STEP 3</div>
            <h3>1:1 멘토링 신청</h3>
            <p>30분 1:1 멘토링을 원하는 날짜와 시간, 묻고 싶은 내용과 함께 신청하면 끝! (1회 {formatPrice(SESSION_PRICE)})</p>
          </div>
        </div>

        <h2 className="section-title">이런 선배들이 기다리고 있어요</h2>
        <div className="grid">
          {SEED_MENTORS.slice(0, 3).map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/mentors" className="btn btn-ghost">
            멘토 전체 보기
          </Link>
        </div>

        <h2 className="section-title">
          이용 후기 <span className="review-note">예시 후기 · MVP 데모용으로 작성한 가상 후기예요</span>
        </h2>
        <div className="grid">
          {REVIEWS.map((r) => (
            <div key={r.name} className="card review">
              <div className="stars">★★★★★</div>
              <p>“{r.text}”</p>
              <div className="review-who">
                <Avatar seed={r.name} size={40} />
                <div>
                  <strong>{r.name}</strong>
                  <div className="muted">{r.info}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="section-title">기존 과외 플랫폼과 무엇이 다른가요?</h2>
        <table className="compare">
          <thead>
            <tr>
              <th>기존 과외 플랫폼</th>
              <th>Mentor connector</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>과목 중심</td><td>고민 중심</td></tr>
            <tr><td>선생님 탐색</td><td>나에게 맞는 선배 추천</td></tr>
            <tr><td>수업·성적 향상</td><td>진로·학습·대학생활 경험 공유</td></tr>
            <tr><td>전문 강사·과외 중심</td><td>대학생 선배 중심</td></tr>
            <tr><td>수도권 학원가 중심</td><td>지역 어디서든 온라인으로, 같은 지역 출신 선배까지</td></tr>
            <tr><td>선생님마다 다른 수업료</td><td>모든 멘토 30분 1회 {formatPrice(SESSION_PRICE)} 동일</td></tr>
            <tr><td>가격·수업 조건 비교</td><td>경험·전공·관심 분야 기반 선택</td></tr>
          </tbody>
        </table>

        <p className="quote">
          ‘어떤 과목을 누구에게 배울지’가 아니라
          <br />
          <em>‘어떤 고민을 가진 학생에게 어떤 경험을 가진 선배가 필요한지’</em>를 연결합니다.
        </p>
      </section>
    </>
  );
}
