"use client";

// 헤더의 "진행절차": 마우스를 올리면(휴대폰에서는 누르면) 멘토링 진행 4단계가 펼쳐진다.
// 로그인하기 전 방문자에게만 보여 준다.

import { SESSION_MINUTES } from "@/lib/schedule";

const STEPS: { who: "학생" | "멘토" | "함께"; title: string; desc: string }[] = [
  { who: "학생", title: "고민 입력·멘토 추천", desc: "고민을 적으면 점수로 맞춤 멘토를 추천해요" },
  { who: "멘토", title: "신청·승인", desc: "원하는 시간에 신청하고, 멘토가 승인하면 일정이 확정돼요" },
  { who: "함께", title: `${SESSION_MINUTES}분 화상 멘토링`, desc: "AI 녹음에 동의하고 입장하면 1:1로 이야기해요" },
  { who: "학생", title: "AI 요약·후기", desc: "끝나면 AI 요약을 받고 후기를 남겨요" },
];

const whoClass = (w: string) => (w === "학생" ? "who-student" : w === "멘토" ? "who-mentor" : "who-both");

export default function ProcessMenu() {
  return (
    <div className="process-menu">
      <button type="button" className="process-trigger" aria-haspopup="true">
        진행절차
      </button>
      <div className="process-pop" role="tooltip">
        <strong className="process-pop-title">멘토링은 이렇게 진행돼요</strong>
        <ol className="process">
          {STEPS.map((s, i) => (
            <li key={s.title} className="process-step">
              <span className="process-num">{i + 1}</span>
              <div className="process-body">
                <span className={`process-who ${whoClass(s.who)}`}>{s.who}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
