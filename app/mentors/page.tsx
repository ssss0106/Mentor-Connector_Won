"use client";

import { useState } from "react";
import ChipSelect from "@/components/ChipSelect";
import MentorCard from "@/components/MentorCard";
import { ALL_TOPICS, INTERESTS } from "@/lib/data";
import { isExcellentMentor, useStore } from "@/lib/store";

// 입시 전형 키워드: 멘토가 거친 전형(admission.path)에 맞춰 고른다
// group "type"(수시/정시)과 group "track"(세부 전형)은 서로 "그리고"로, 같은 묶음 안에서는 "또는"으로 거른다
// 예: 수시 + 농어촌 → 수시 농어촌 전형 멘토만 / 학생부교과 + 논술 → 둘 중 하나
const ADMISSION_FILTERS: { label: string; group: "type" | "track"; test: (path: string) => boolean }[] = [
  { label: "수시", group: "type", test: (p) => p.startsWith("수시") },
  { label: "정시", group: "type", test: (p) => p.startsWith("정시") },
  { label: "학생부교과", group: "track", test: (p) => p.includes("학생부교과") },
  { label: "학생부종합", group: "track", test: (p) => p.includes("학생부종합") },
  { label: "논술", group: "track", test: (p) => p.includes("논술") },
  { label: "실기·특기자", group: "track", test: (p) => p.includes("실기") },
  { label: "농어촌", group: "track", test: (p) => p.includes("농어촌") },
];

export default function MentorsPage() {
  const store = useStore();
  const { visibleMentors } = store;
  const [interests, setInterests] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const matchesPath = (path?: string) => {
    if (paths.length === 0) return true;
    if (!path) return false;
    return (["type", "track"] as const).every((g) => {
      const chosen = ADMISSION_FILTERS.filter((f) => f.group === g && paths.includes(f.label));
      return chosen.length === 0 || chosen.some((f) => f.test(path));
    });
  };

  // 우수 멘토를 먼저 보여 주고, 나머지는 원래 순서대로
  const excellent = (id: string) => isExcellentMentor(store, id);
  const filtered = visibleMentors.filter(
    (m) =>
      (interests.length === 0 || m.interests.some((i) => interests.includes(i))) &&
      (topics.length === 0 || m.topics.some((t) => topics.includes(t))) &&
      matchesPath(m.admission?.path) &&
      (!q.trim() || `${m.name} ${m.university} ${m.major} ${m.intro} ${m.admission?.path ?? ""}`.includes(q.trim())),
  ).sort((a, b) => Number(excellent(b.id)) - Number(excellent(a.id)));
  const excellentCount = filtered.filter((m) => excellent(m.id)).length;

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
        <>
          {excellentCount > 0 && (
            <p className="excellent-note">
              🏅 <strong>우수 멘토 {excellentCount}명</strong>을 먼저 보여 드려요. 후기와 멘토링 기록, 안전 기록을 보고 운영팀이 선정해요.
            </p>
          )}
          <div className="grid">
            {filtered.map((m) => (
              <MentorCard key={m.id} mentor={m} excellent={excellent(m.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
