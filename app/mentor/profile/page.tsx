"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChipSelect from "@/components/ChipSelect";
import SlotGrid from "@/components/SlotGrid";
import { ADMISSION_PATHS, ALL_TOPICS, GPA_SCALES, HOMETOWNS, INTERESTS, MENTOR_GRADES, SEED_MENTORS } from "@/lib/data";
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
  const [hometown, setHometown] = useState("");
  const [satisfaction, setSatisfaction] = useState("");
  const [unknownBefore, setUnknownBefore] = useState("");
  const [hardPart, setHardPart] = useState("");
  const [fitFor, setFitFor] = useState("");
  const [switched, setSwitched] = useState(false);
  const [switchReason, setSwitchReason] = useState("");
  const [admissionPath, setAdmissionPath] = useState("");
  const [hsGrade, setHsGrade] = useState("");
  const [gpaValue, setGpaValue] = useState("");
  const [gpaScale, setGpaScale] = useState("4.5");
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
    setHometown(m.hometown ?? "");
    setSatisfaction(m.insight ? String(m.insight.satisfaction) : "");
    setUnknownBefore(m.insight?.unknownBefore ?? "");
    setHardPart(m.insight?.hardPart ?? "");
    setFitFor(m.insight?.fitFor ?? "");
    setSwitched(!!m.insight?.switched);
    setSwitchReason(m.insight?.switched?.reason ?? "");
    setAdmissionPath(m.admission?.path ?? "");
    setHsGrade(m.admission ? String(m.admission.highSchoolGrade) : "");
    setGpaValue(m.admission?.collegeGpa ? String(m.admission.collegeGpa.value) : "");
    setGpaScale(String(m.admission?.collegeGpa?.scale ?? 4.5));
    setSlots(m.slots ?? []);
    setOnline(m.online);
    // existing은 매 렌더마다 새로 계산되므로 id 기준으로만 다시 불러온다
  }, [ready, currentUser?.id, existing?.id]);

  if (!ready || !currentUser) return null;

  const hs = Number(hsGrade);
  const hsOk = hsGrade.trim() !== "" && hs >= 1 && hs <= 9;
  const gpa = Number(gpaValue);
  const gpaOk = gpaValue.trim() === "" || (gpa > 0 && gpa <= Number(gpaScale));
  const valid = admissionPath && hsOk && gpaOk && name.trim() && university.trim() && major.trim() && topics.length > 0 && intro.trim() && hometown && slots.length > 0 &&
    satisfaction && unknownBefore.trim() && hardPart.trim() && (!switched || switchReason.trim());

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
        hometown,
        admission: {
          path: admissionPath,
          highSchoolGrade: Math.round(hs * 100) / 100,
          ...(gpaValue.trim() ? { collegeGpa: { value: Math.round(gpa * 100) / 100, scale: Number(gpaScale) } } : {}),
        },
        insight: {
          satisfaction: Number(satisfaction),
          unknownBefore: unknownBefore.trim(),
          hardPart: hardPart.trim(),
          ...(fitFor.trim() ? { fitFor: fitFor.trim() } : {}),
          ...(switched ? { switched: { reason: switchReason.trim() } } : {}),
        },
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
          <label className="label" htmlFor="hometown">
            출신 지역 <span className="hint">고등학교를 다닌 지역 · 같은 지역 후배에게 먼저 추천돼요</span>
          </label>
          <select id="hometown" className="select" value={hometown} onChange={(e) => setHometown(e.target.value)}>
            <option value="">선택해 주세요</option>
            {HOMETOWNS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="intro">한 줄 소개</label>
          <input id="intro" className="input" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="예: 진로 고민, 편하게 이야기해요!" maxLength={60} />
        </div>

        <div className="field">
          <label className="label" htmlFor="exp">나의 경험</label>
          <textarea id="exp" className="textarea" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="중·고등학생 때의 고민, 전공을 선택한 계기, 공부 방법 등 후배에게 나눌 수 있는 경험을 적어주세요." />
        </div>

        <div className="field insight-form">
          <label className="label">
            입시·성적 정보 <span className="hint">학생이 참고하도록 본인이 직접 입력해요 · 추천 순서에는 쓰이지 않아요</span>
          </label>
          <div className="field">
            <label className="label" htmlFor="adm">거친 입시 전형</label>
            <select id="adm" className="select" value={admissionPath} onChange={(e) => setAdmissionPath(e.target.value)}>
              <option value="">선택해 주세요</option>
              {ADMISSION_PATHS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="hs">고등학교 내신 등급 <span className="hint">전 과목 평균, 소수점까지 입력해요 (1~9)</span></label>
            <input id="hs" className="input" type="number" inputMode="decimal" step="0.01" min="1" max="9" value={hsGrade} onChange={(e) => setHsGrade(e.target.value)} placeholder="예: 2.35" />
            {hsGrade.trim() !== "" && !hsOk && <span className="field-error">1.00~9.00 사이로 입력해 주세요.</span>}
          </div>
          <div className="field">
            <label className="label" htmlFor="gpa">대학 학점 <span className="hint">선택 · 공개하고 싶을 때만 입력하고, 비우면 공개하지 않아요</span></label>
            <div className="gpa-row">
              <input id="gpa" className="input" type="number" inputMode="decimal" step="0.01" min="0" value={gpaValue} onChange={(e) => setGpaValue(e.target.value)} placeholder="예: 3.85" />
              <span>/</span>
              <select className="select" value={gpaScale} onChange={(e) => setGpaScale(e.target.value)} aria-label="학점 만점">
                {GPA_SCALES.map((g) => <option key={g} value={g}>{g.toFixed(1)}</option>)}
              </select>
            </div>
            {!gpaOk && <span className="field-error">학점은 0보다 크고 만점({gpaScale}) 이하로 입력해 주세요.</span>}
          </div>
        </div>

        <div className="field insight-form">
          <label className="label">
            전공·대학생활, 실제로는 이랬어요 <span className="hint">진학을 고민하는 후배에게 가장 도움이 되는 정보예요</span>
          </label>
          <div className="row">
            <div className="field">
              <label className="label" htmlFor="sat">지금 전공 만족도</label>
              <select id="sat" className="select" value={satisfaction} onChange={(e) => setSatisfaction(e.target.value)}>
                <option value="">선택해 주세요</option>
                <option value="5">5 · 매우 만족해요</option>
                <option value="4">4 · 만족해요</option>
                <option value="3">3 · 보통이에요</option>
                <option value="2">2 · 아쉬운 점이 많아요</option>
                <option value="1">1 · 많이 후회돼요</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="unk">입학 전에는 몰랐던 점</label>
            <input id="unk" className="input" value={unknownBefore} onChange={(e) => setUnknownBefore(e.target.value)} maxLength={150} placeholder="예: 수학·통계 과목이 생각보다 많았어요" />
          </div>
          <div className="field">
            <label className="label" htmlFor="hard">적응하면서 힘들었던 점</label>
            <input id="hard" className="input" value={hardPart} onChange={(e) => setHardPart(e.target.value)} maxLength={150} placeholder="예: 첫 학기에 전공 수업 수준 차이에 적응하기 어려웠어요" />
          </div>
          <div className="field">
            <label className="label" htmlFor="fit">이런 학생에게 잘 맞아요 <span className="hint">선택</span></label>
            <input id="fit" className="input" value={fitFor} onChange={(e) => setFitFor(e.target.value)} maxLength={150} placeholder="예: 사람의 마음이 궁금하고 숫자도 괜찮은 학생" />
          </div>
          <label className="check">
            <input type="checkbox" checked={switched} onChange={(e) => setSwitched(e.target.checked)} />
            <span>전공을 바꾼 경험이 있어요 <span className="hint">학과 옮김·복수전공·전공 재선택 모두 포함해요 (학업 경험을 묻는 항목이에요)</span></span>
          </label>
          {switched && (
            <input className="input" style={{ marginTop: 8 }} value={switchReason} onChange={(e) => setSwitchReason(e.target.value)} maxLength={200} placeholder="바꾼 이유와 지금의 생각을 적어주세요" aria-label="전공을 바꾼 이유" />
          )}
        </div>

        <div className="field">
          <label className="label">
            가능한 멘토링 시간 <span className="hint">매주 반복돼요 · 칸을 눌러 가능한 시간(1시간 단위)을 모두 선택하세요 · 한 칸에서 30분 멘토링을 2회 받을 수 있어요</span>
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
