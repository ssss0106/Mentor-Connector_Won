import { SESSION_MINUTES } from "@/lib/schedule";

// 랜딩 페이지: 멘토링 신청부터 완료까지의 과정을 한눈에 보여 준다
const PROCESS: { who: "학생" | "멘토" | "함께"; title: string; desc: string }[] = [
  { who: "학생", title: "고민 입력", desc: "학년·지역·관심 분야와 고민, 보호자 연락처를 적어요" },
  { who: "학생", title: "멘토 추천·신청", desc: "점수로 매칭된 멘토 중 골라 원하는 시간에 신청해요" },
  { who: "멘토", title: "승인·일정 확정", desc: "멘토가 승인하면 채팅방이 열리고 일정이 확정돼요" },
  { who: "함께", title: "녹음 동의 후 입장", desc: "AI 녹음·요약에 동의해야 화상 멘토링에 들어갈 수 있어요" },
  { who: "함께", title: `${SESSION_MINUTES}분 화상 멘토링`, desc: "시작과 동시에 녹음되고, 나갈 때까지 계속 기록돼요" },
  { who: "학생", title: "AI 요약·후기", desc: "멘토링이 끝나면 AI 요약을 받고 후기를 남겨요" },
];

export default function LandingProcess() {
  return (
    <section className="lp-section lp-white">
      <div className="container">
        <div className="lp-head">
          <h2>신청부터 완료까지, 이렇게 진행돼요</h2>
          <p>모든 과정이 Menco 안에서 이루어져요.</p>
        </div>
        <ol className="process">
          {PROCESS.map((s, i) => (
            <li key={s.title} className="process-step">
              <span className="process-num">{i + 1}</span>
              <div className="process-body">
                <span className={`process-who who-${s.who === "학생" ? "student" : s.who === "멘토" ? "mentor" : "both"}`}>{s.who}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="process-extra">
          <span>🔁 끝난 뒤에도 같은 멘토와 <strong>이어서 멘토링</strong>을 신청하면, 같은 채팅방에서 대화가 이어져요.</span>
          <span>🛡️ 채팅과 화상 멘토링 내내 AI가 안전을 점검하고, 문제가 감지되면 <strong>운영자와 보호자에게 바로 알려요.</strong></span>
        </div>
      </div>
    </section>
  );
}
