import { SEED_MENTORS } from "@/lib/data";

// 랜딩 페이지 "선배들은 이렇게 답했어요" (시연용으로 작성한 가상 질문·답변 사례)
// 답변자는 시연용 가상 멘토 데이터(SEED_MENTORS)에서 이름·학교·전공을 가져온다.
const ANSWERS = [
  {
    tag: "동기·방향",
    mentorId: "m1",
    question: "공부를 왜 해야 하는지 모르겠어요.",
    answer:
      "저도 중학생 때 똑같이 고민했어요. 공부가 꿈을 정해 주진 않지만, 나중에 하고 싶은 게 생겼을 때 고를 수 있는 길을 넓혀 줘요.",
  },
  {
    tag: "공부법",
    mentorId: "m3",
    question: "계획을 세워도 3일을 못 가요.",
    answer:
      "계획이 너무 커서 그래요. 하루 할 일을 3개만 적고, 못 한 건 다음 날로 넘기는 칸을 따로 만들어 보세요. 지키는 경험이 쌓여야 계획도 늘릴 수 있어요.",
  },
  {
    tag: "전공 선택",
    mentorId: "m2",
    question: "심리학과에 가면 상담사만 할 수 있나요?",
    answer:
      "상담은 여러 길 중 하나예요. 사람의 생각과 행동을 연구하는 분야가 정말 다양해요. 먼저 '사람의 어떤 점이 궁금한지'를 적어 보면 방향이 보여요.",
  },
  {
    tag: "진로 탐색",
    mentorId: "m4",
    question: "코딩이 좋은데 지금 뭘 해 보면 좋을까요?",
    answer:
      "작은 거라도 끝까지 만들어 보세요. 생활 속 불편한 점 하나를 골라 해결하는 프로그램을 만들면, 완성한 경험 자체가 나만의 이야기가 돼요.",
  },
  {
    tag: "대학 선택",
    mentorId: "m6",
    question: "지역 대학에 가면 불리하지 않을까요?",
    answer:
      "학교 이름보다 그 학교에서 무엇을 했는지가 더 중요했어요. 가고 싶은 학과의 수업과 실습 환경을 먼저 비교해 보면 나에게 맞는 곳이 보여요.",
  },
  {
    tag: "멘탈",
    mentorId: "m8",
    question: "슬럼프가 오면 어떻게 해야 하나요?",
    answer:
      "슬럼프는 열심히 해 온 사람에게 와요. 저는 그럴 때 목표를 '하루 30분만'으로 확 낮췄어요. 멈추지만 않으면 다시 돌아오더라고요.",
  },
];

export default function LandingAnswers() {
  return (
    <section className="landing-block">
      <div className="landing-eyebrow">MENTOR ANSWERS</div>
      <h2 className="landing-title">선배들은 이렇게 답했어요</h2>
      <p className="landing-sub">
        고민을 먼저 겪어 본 선배의 답변 예시예요.
        <span className="review-note">시연용으로 작성한 가상 사례예요</span>
      </p>
      <div className="answer-grid">
        {ANSWERS.map((a) => {
          const m = SEED_MENTORS.find((x) => x.id === a.mentorId);
          return (
            <article key={a.question} className="card answer-card">
              <span className="answer-tag">{a.tag}</span>
              <h3>“{a.question}”</h3>
              <p className="answer-text">{a.answer}</p>
              {m && (
                <div className="answer-by">
                  — {m.name} 멘토 · {m.university} {m.major}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
