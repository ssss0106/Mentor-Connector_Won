"use client";

import { useState } from "react";
import ChipSelect from "@/components/ChipSelect";
import MentorCard from "@/components/MentorCard";
import { ALL_TOPICS, INTERESTS } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function MentorsPage() {
  const { allMentors } = useStore();
  const [interests, setInterests] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const filtered = allMentors.filter(
    (m) =>
      (interests.length === 0 || m.interests.some((i) => interests.includes(i))) &&
      (topics.length === 0 || m.topics.some((t) => topics.includes(t))) &&
      (!q.trim() || `${m.name} ${m.university} ${m.major} ${m.intro}`.includes(q.trim())),
  );

  return (
    <div className="container page">
      <h1 className="page-title">멘토 둘러보기</h1>
      <p className="page-sub">관심 분야와 고민 주제로 선배를 찾아보세요.</p>

      <div className="filters">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름, 대학, 전공으로 검색" />
        <ChipSelect options={INTERESTS} value={interests} onChange={setInterests} />
        <ChipSelect options={ALL_TOPICS} value={topics} onChange={setTopics} />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">조건에 맞는 멘토가 없어요.</div>
      ) : (
        <div className="grid">
          {filtered.map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
      )}
    </div>
  );
}
