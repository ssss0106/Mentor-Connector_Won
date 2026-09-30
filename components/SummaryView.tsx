import type { LectureSummary } from "@/lib/types";

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </>
  );
}

export default function SummaryView({ summary }: { summary: LectureSummary }) {
  return (
    <div className="summary">
      <p className="summary-overview">{summary.overview}</p>
      <Section title="핵심 내용" items={summary.keyPoints} />
      <Section title="앞으로 해볼 일" items={summary.actionItems} />
      <Section title="다음에 이야기해 볼 질문" items={summary.nextQuestions} />
      <div className="summary-note">AI가 만든 요약이라 틀린 부분이 있을 수 있어요.</div>
    </div>
  );
}
