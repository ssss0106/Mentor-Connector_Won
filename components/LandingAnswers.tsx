import Link from "next/link";
import Avatar from "./Avatar";
import { SEED_MENTORS } from "@/lib/data";

// 랜딩 페이지 "멘토와 나눈 대화 예시" (시연용으로 작성한 가상 질문·답변 사례)
// 답변자는 시연용 가상 멘토 데이터에서 이름·학교·전공을 가져온다.
const TALKS = [
  { who: "제주 고2 · 대학 선택", mentorId: "m12", q: "육지 대학에 갈지, 제주에 남을지 고민이에요.", a: "저도 오래 고민했어요. 가고 싶은 전공이 있는지, 생활비와 환경은 어떤지 둘 다 적어서 비교해 보세요." },
  { who: "전남 해남 중3 · 진학 준비", mentorId: "m26", q: "동네에 학원이 없어서 불안해요.", a: "저도 그랬어요. 학교 방과후와 인터넷 강의를 꾸준히 들었고, 모르는 건 선생님께 바로 물어봤어요." },
  { who: "강원 고1 · 진로", mentorId: "m2", q: "심리학과에 가면 상담사만 할 수 있나요?", a: "상담은 여러 길 중 하나예요. 사람의 어떤 점이 궁금한지부터 적어 보세요." },
  { who: "경북 의성 고2 · 농어촌 전형", mentorId: "m25", q: "농어촌 전형은 어떻게 준비해요?", a: "먼저 지원 자격부터 확인하세요. 저는 중·고등학교 6년을 농어촌에서 다녔고, 내신을 꾸준히 챙긴 게 가장 컸어요." },
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
