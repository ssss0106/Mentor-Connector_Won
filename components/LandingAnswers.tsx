import Link from "next/link";
import Avatar from "./Avatar";
import { SEED_MENTORS } from "@/lib/data";

// 랜딩 페이지 "멘토와 나눈 대화 예시" (시연용으로 작성한 가상 질문·답변 사례)
// 답변자는 시연용 가상 멘토 데이터에서 이름·학교·전공을 가져온다.
const TALKS = [
  { who: "전남 중3 · 학습", mentorId: "m3", q: "계획을 세워도 3일을 못 가요.", a: "하루 할 일을 3개만 적어 보세요. 지키는 경험이 쌓이면 계획도 늘릴 수 있어요." },
  { who: "충북 고2 · 학습", mentorId: "m8", q: "슬럼프라 공부가 손에 안 잡혀요.", a: "목표를 '하루 30분'으로 낮춰 보세요. 멈추지만 않으면 다시 돌아와요." },
  { who: "강원 고1 · 진로", mentorId: "m2", q: "심리학과에 가면 상담사만 할 수 있나요?", a: "상담은 여러 길 중 하나예요. 사람의 어떤 점이 궁금한지부터 적어 보세요." },
  { who: "경북 고3 · 진로", mentorId: "m6", q: "지역 대학에 가면 불리할까요?", a: "학교 이름보다 그곳에서 무엇을 했는지가 더 중요했어요." },
  { who: "제주 고2 · 대학생활", mentorId: "m5", q: "대학 가면 동아리는 꼭 해야 하나요?", a: "필수는 아니에요. 1학년 때 두세 곳을 경험해 보고 한 곳에 집중해 보세요." },
  { who: "부산 고1 · 대학생활", mentorId: "m7", q: "교환학생은 언제부터 준비해요?", a: "보통 2학년 때 지원해요. 지금은 영어를 꾸준히 읽고 듣는 습관이면 충분해요." },
];

export default function LandingAnswers() {
  return (
    <div className="talk-grid">
      {TALKS.map((t) => {
        const m = SEED_MENTORS.find((x) => x.id === t.mentorId);
        if (!m) return null;
        return (
          <article key={t.q} className="talk-card">
            <span className="talk-who">{t.who}</span>
            <h3 className="talk-q">{t.q}</h3>
            <p className="talk-a">{t.a}</p>
            <div className="talk-foot">
              <Avatar seed={m.id + m.name} size={32} />
              <div>
                <Link href={`/mentors/${m.id}`} className="talk-link">
                  {m.name} 멘토 프로필 보기 →
                </Link>
                <div className="muted">{m.university} {m.major}</div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
