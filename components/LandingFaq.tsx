"use client";

import { useState } from "react";
import { SESSION_PRICE, formatPrice } from "@/lib/data";
import { SESSION_MINUTES } from "@/lib/schedule";

// 랜딩 페이지 맨 아래 자주 묻는 질문
const FAQS: { q: string; a: string }[] = [
  {
    q: "누가 이용할 수 있나요?",
    a: "비수도권에 사는 중학교 1학년부터 고등학교 3학년까지 누구나 이용할 수 있어요.",
  },
  {
    q: "처음인데 뭘 물어봐야 할지 모르겠어요.",
    a: "괜찮아요. '진로가 막막해요'처럼 짧게 적어도 고민에 맞는 선배를 추천해 드려요. 선배가 먼저 질문을 건네며 이야기를 풀어 줄 거예요.",
  },
  {
    q: "어떤 내용을 준비해 가면 좋나요?",
    a: "가장 궁금한 것 2~3가지만 적어 오면 충분해요. 성적표나 생활기록부 같은 서류는 필요 없어요.",
  },
  {
    q: "원하는 멘토를 직접 고를 수 있나요?",
    a: "네. 추천 결과와 상관없이 '멘토 둘러보기'에서 전공·관심 분야로 찾아보고 직접 신청할 수 있어요.",
  },
  {
    q: "멘토링은 어떻게 진행되나요?",
    a: `${SESSION_MINUTES}분 동안 온라인 화상이나 채팅으로 1:1로 이야기해요. 멘토가 신청을 승인하면 채팅방이 열려서 미리 인사를 나눌 수 있어요.`,
  },
  {
    q: "멘토는 믿을 수 있는 사람인가요?",
    a: "재학증명서·성적증명서로 재학 인증을 하고, 성범죄 경력 및 아동학대관련범죄 전력 조회 확인까지 마친 대학생만 멘토로 소개돼요.",
  },
  {
    q: "비용은 얼마인가요?",
    a: `모든 멘토가 ${SESSION_MINUTES}분 1회 ${formatPrice(SESSION_PRICE)}으로 같아요. 멘토에 따라 가격이 달라지지 않아요.`,
  },
  {
    q: "같은 멘토와 다시 멘토링할 수 있나요?",
    a: "네. 멘토 페이지에서 다시 신청하면 돼요. 이전에 나눈 이야기를 이어서 할 수 있어요.",
  },
  {
    q: "일정을 바꾸거나 취소하고 싶어요.",
    a: "일정 변경은 채팅방에서 멘토와 상의해 주세요. 멘토링 시작 24시간 전까지 취소하면 이용료를 전액 돌려드려요.",
  },
  {
    q: "멘토와 개인 연락처를 주고받아도 되나요?",
    a: "안전을 위해 전화번호나 SNS 아이디는 주고받지 않고, 모든 대화는 사이트 안에서만 해요.",
  },
];

export default function LandingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="faq-section">
      <div className="container">
        <div className="lp-head">
          <h2>자주 묻는 질문</h2>
          <p>궁금한 질문을 눌러 보세요.</p>
        </div>
        <ul className="faq-list">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className={`faq-item ${isOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{f.q}</span>
                  <span className="faq-chevron" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <p id={`faq-a-${i}`} className="faq-a">
                    {f.a}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
