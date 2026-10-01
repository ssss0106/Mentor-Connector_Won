"use client";

import { useState } from "react";
import ChipSelect from "@/components/ChipSelect";
import MentorCard from "@/components/MentorCard";
import { ALL_TOPICS, INTERESTS } from "@/lib/data";
import { useStore } from "@/lib/store";

// 입시 전형 키워드: 멘토가 거친 전형(admission.path)에 맞춰 고른다
const ADMISSION_FILTERS: { label: string; test: (path: string) => boolean }[] = [
  { label: "수시", test: (p) => p.startsWith("수시") },
  { label: "정시", test: (p) => p.startsWith("정시") },
  { label: "학생부교과", test: (p) => p.includes("학생부교과") },
  { label: "학생부종합", test: (p) => p.includes("학생부종합") },
  { label: "논술", test: (p) => p.includes("논술") },
  { label: "실기·특기자", test: (p) => p.includes("실기") },
  { label: "농어촌", test: (p) => p.includes("농어촌") },
];

export default function MentorsPage() {
  const { visibleMentors } = useStore();
  const [interests, setInterests] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const matchesPath = (path?: string) =>
    paths.length === 0 || (!!path && ADMISSION_FILTERS.some((f) => paths.includes(f.label) && f.test(path)));

  const filtered = visibleMentors.filter(
    (m) =>
      (interests.length === 0 || m.interests.some((i) => interests.includes(i))) &&
      (topics.length === 0 || m.topics.some((t) => topics.includes(t))) &&
      matchesPath(m.admission?.path) &&
      (!q.trim() || `${m.name} ${m.university} ${m.major} ${m.intro} ${m.admission?.path ?? ""}`.includes(q.trim())),
  );

  return (
    <div className="container page">
      <h1 className="page-title">멘토 둘러보기</h1>
      <p className="page-sub">관심 분야와 고민 주제, 입시 전형으로 멘토를 찾아보세요. 경력 조회 확인을 마친 멘토만 보여요.</p>

      <div className="filters">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름, 대학, 전공, 전형으로 검색" />
        <div className="filter-group">
          <span className="filter-label">관심 분야</span>
          <ChipSelect options={INTERESTS} value={interests} onChange={setInterests} />
        </div>
        <div className="filter-group">
          <span className="filter-label">고민 주제</span>
          <ChipSelect options={ALL_TOPICS} value={topics} onChange={setTopics} />
        </div>
        <div className="filter-group">
          <span className="filter-label">입시 전형</span>
          <ChipSelect options={ADMISSION_FILTERS.map((f) => f.label)} value={paths} onChange={setPaths} />
        </div>
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
