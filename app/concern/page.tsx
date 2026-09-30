"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChipSelect from "@/components/ChipSelect";
import { CONCERN_TOPICS, GRADES, INTERESTS, REGIONS, TIMES } from "@/lib/data";
import { saveStudentProfile, useStore } from "@/lib/store";
import type { ConcernCategory } from "@/lib/types";

const CATEGORY_DESC: Record<ConcernCategory, string> = {
  학습: "공부법·습관·동기",
  진로: "진로·전공·대학 선택",
  대학생활: "전공·동아리·캠퍼스",
};

export default function ConcernPage() {
  const router = useRouter();
  const { ready, currentUser, myProfile } = useStore();

  const [grade, setGrade] = useState("고1");
  const [region, setRegion] = useState("강원");
  const [interests, setInterests] = useState<string[]>([]);
  const [desiredMajor, setDesiredMajor] = useState("");
  const [category, setCategory] = useState<ConcernCategory>("진로");
  const [topics, setTopics] = useState<string[]>([]);
  const [concern, setConcern] = useState("");
  const [times, setTimes] = useState<string[]>([]);

  // 이미 입력한 고민이 있으면 불러온다
  useEffect(() => {
    if (!myProfile) return;
    setGrade(myProfile.grade);
    setRegion(myProfile.region);
    setInterests(myProfile.interests);
    setDesiredMajor(myProfile.desiredMajor);
    setCategory(myProfile.category);
    setTopics(myProfile.topics);
    setConcern(myProfile.concern);
    setTimes(myProfile.availableTimes);
  }, [myProfile]);

  useEffect(() => {
    if (ready && (!currentUser || currentUser.role !== "student")) router.replace("/signup");
  }, [ready, currentUser, router]);

  if (!ready || !currentUser) return null;

  const valid = interests.length > 0 && topics.length > 0 && concern.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    saveStudentProfile({
      userId: currentUser.id,
      grade,
      region,
      interests,
      desiredMajor: desiredMajor.trim(),
      category,
      topics,
      concern: concern.trim(),
      availableTimes: times,
    });
    router.push("/recommend");
  };

  return (
    <div className="container narrow page">
      <h1 className="page-title">{currentUser.name}님의 고민을 알려주세요</h1>
      <p className="page-sub">입력한 내용을 바탕으로 고민을 먼저 경험한 선배를 추천해 드려요.</p>

      <form className="form" onSubmit={submit}>
        <div className="row">
          <div className="field">
            <label className="label">학년</label>
            <select className="select" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">지역</label>
            <select className="select" value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label">관심 분야 <span className="hint">최대 3개</span></label>
          <ChipSelect options={INTERESTS} value={interests} onChange={setInterests} max={3} />
        </div>

        <div className="field">
          <label className="label" htmlFor="major">관심 전공 <span className="hint">선택 · 아직 모르면 비워도 돼요</span></label>
          <input id="major" className="input" value={desiredMajor} onChange={(e) => setDesiredMajor(e.target.value)} placeholder="예: 심리학과" />
        </div>

        <div className="field">
          <label className="label">어떤 고민인가요?</label>
          <div className="segment">
            {(Object.keys(CONCERN_TOPICS) as ConcernCategory[]).map((c) => (
              <button
                type="button"
                key={c}
                className={category === c ? "on" : ""}
                onClick={() => {
                  setCategory(c);
                  setTopics([]);
                }}
              >
                {c}
                <small>{CATEGORY_DESC[c]}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">원하는 멘토링 분야</label>
          <ChipSelect options={CONCERN_TOPICS[category]} value={topics} onChange={setTopics} />
        </div>

        <div className="field">
          <label className="label" htmlFor="concern">
            주요 고민 <span className="hint">이름·연락처·학교 이름은 적지 마세요</span>
          </label>
          <textarea
            id="concern"
            className="textarea"
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="예: 심리학에 관심이 있는데, 심리학과에 가면 실제로 뭘 배우는지, 어떤 진로가 있는지 궁금해요."
          />
        </div>

        <div className="field">
          <label className="label">온라인 멘토링 가능 시간 <span className="hint">선택</span></label>
          <ChipSelect options={TIMES} value={times} onChange={setTimes} />
        </div>

        <button className="btn btn-block" disabled={!valid}>
          나에게 맞는 멘토 찾기
        </button>
      </form>
    </div>
  );
}
