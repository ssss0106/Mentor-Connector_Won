"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChipSelect from "@/components/ChipSelect";
import SlotGrid from "@/components/SlotGrid";
import { ALL_TOPICS, INTERESTS, MENTOR_GRADES, SEED_MENTORS } from "@/lib/data";
import { slotsToBands, summarizeSlots } from "@/lib/schedule";
import { saveMentorProfile, useStore } from "@/lib/store";

export default function MentorProfilePage() {
  const router = useRouter();
  const { ready, currentUser, allMentors } = useStore();
  const existing = currentUser?.mentorId ? allMentors.find((m) => m.id === currentUser.mentorId) : undefined;
  const isSeed = !!existing && SEED_MENTORS.some((m) => m.id === existing.id);

  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [grade, setGrade] = useState(MENTOR_GRADES[0]);
  const [interests, setInterests] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [intro, setIntro] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!currentUser || currentUser.role !== "mentor") {
      router.replace("/signup?role=mentor");
      return;
    }
    const m = existing;
    setName(m?.name ?? currentUser.name);
    if (!m) return;
    setUniversity(m.university);
    setMajor(m.major);
    setGrade(m.grade);
    setInterests(m.interests);
    setTopics(m.topics);
    setExperience(m.experience);
    setIntro(m.intro);
    setSlots(m.slots ?? []);
    setOnline(m.online);
    // existing은 매 렌더마다 새로 계산되므로 id 기준으로만 다시 불러온다
  }, [ready, currentUser?.id, existing?.id]);

  if (!ready || !currentUser) return null;

  const valid = name.trim() && university.trim() && major.trim() && topics.length > 0 && intro.trim() && slots.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || isSeed) return;
    saveMentorProfile(
      currentUser.id,
      {
        name: name.trim(),
        university: university.trim(),
        major: major.trim(),
        grade,
        interests,
        topics,
        experience: experience.trim(),
        intro: intro.trim(),
        availableTimes: slotsToBands(slots),
        slots,
        online,
      },
      existing?.id,
    );
    // 아직 경력 조회 서류를 내지 않았거나 반려됐다면 동의서 단계로 보낸다
    const status = existing?.verification.status ?? "not_submitted";
    router.push(status === "not_submitted" || status === "rejected" ? "/mentor/verify" : "/mypage");
  };

  return (
    <div className="container narrow page">
      <h1 className="page-title">{existing ? "멘토 프로필 관리" : "멘토 프로필 만들기"}</h1>
      <p className="page-sub">나의 경험이 고민 중인 후배에게 큰 도움이 돼요. 프로필을 바탕으로 학생에게 추천돼요.</p>
      {isSeed && (
        <div className="card muted" style={{ marginBottom: 24 }}>
          시연용 멘토 계정은 프로필을 수정할 수 없어요. 직접 멘토로 가입하면 프로필을 등록·수정할 수 있어요.
        </div>
      )}

      <form className="form" onSubmit={submit}>
        <div className="row">
          <div className="field">
            <label className="label" htmlFor="name">이름</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">학년</label>
            <select className="select" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {MENTOR_GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label className="label" htmlFor="univ">대학교</label>
            <input id="univ" className="input" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="예: 강원대학교" />
          </div>
          <div className="field">
            <label className="label" htmlFor="major">전공</label>
            <input id="major" className="input" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="예: 심리학과" />
          </div>
        </div>

        <div className="field">
          <label className="label">관심 분야</label>
          <ChipSelect options={INTERESTS} value={interests} onChange={setInterests} />
        </div>

        <div className="field">
          <label className="label">멘토링 가능 분야</label>
          <ChipSelect options={ALL_TOPICS} value={topics} onChange={setTopics} />
        </div>

        <div className="field">
          <label className="label" htmlFor="intro">한 줄 소개</label>
          <input id="intro" className="input" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="예: 진로 고민, 편하게 이야기해요!" maxLength={60} />
        </div>

        <div className="field">
          <label className="label" htmlFor="exp">나의 경험</label>
          <textarea id="exp" className="textarea" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="중·고등학생 때의 고민, 전공을 선택한 계기, 공부 방법 등 후배에게 나눌 수 있는 경험을 적어주세요." />
        </div>

        <div className="field">
          <label className="label">
            가능한 멘토링 시간 <span className="hint">매주 반복돼요 · 칸을 눌러 가능한 시간(1시간 단위)을 모두 선택하세요</span>
          </label>
          <SlotGrid value={slots} onChange={isSeed ? undefined : setSlots} />
          <p className="muted" style={{ margin: "8px 0 0" }}>
            {slots.length ? `선택한 시간: ${summarizeSlots(slots)} (주 ${slots.length}시간)` : "아직 선택한 시간이 없어요."}
          </p>
        </div>

        <div className="field">
          <label className="label">
            <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} /> 온라인 멘토링 가능
          </label>
        </div>

        <button className="btn btn-block" disabled={!valid || isSeed}>
          프로필 저장
        </button>
      </form>
    </div>
  );
}
