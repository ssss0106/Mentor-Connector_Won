"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SEED_MENTORS } from "@/lib/data";
import { login, loginAsSeedMentor, signUp, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { users } = useStore();
  const [role, setRole] = useState<Role>(params.get("role") === "mentor" ? "mentor" : "student");
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    signUp(role, name.trim());
    router.push(role === "student" ? "/concern" : "/mentor/profile");
  };

  // 이 브라우저에서 만든 계정 (학생, 프로필을 등록한 멘토)
  const myAccounts = users.filter((u) => u.role === "student" || !SEED_MENTORS.some((m) => m.id === u.mentorId));

  return (
    <div className="container narrow page">
      <h1 className="page-title">회원가입</h1>
      <p className="page-sub">어떤 역할로 참여하시나요?</p>

      <form className="form" onSubmit={submit}>
        <div className="role-cards">
          <button type="button" className={`card role-card ${role === "student" ? "on" : ""}`} onClick={() => setRole("student")}>
            <div className="emoji">🎒</div>
            <h3>학생이에요</h3>
            <div className="muted">중·고등학생 · 고민을 나누고 선배를 찾고 싶어요</div>
          </button>
          <button type="button" className={`card role-card ${role === "mentor" ? "on" : ""}`} onClick={() => setRole("mentor")}>
            <div className="emoji">🎓</div>
            <h3>대학생 멘토예요</h3>
            <div className="muted">내 경험을 후배들과 나누고 싶어요</div>
          </button>
        </div>

        <div className="field">
          <label className="label" htmlFor="name">
            이름 <span className="hint">MVP에서는 이름만 받아요 (실명 대신 닉네임도 괜찮아요)</span>
          </label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동" />
        </div>

        <button className="btn btn-block" disabled={!name.trim()}>
          {role === "student" ? "가입하고 고민 입력하기" : "가입하고 멘토 프로필 만들기"}
        </button>
      </form>

      {myAccounts.length > 0 && (
        <>
          <div className="divider">이 브라우저에서 만든 계정으로 로그인</div>
          <div className="demo-list">
            {myAccounts.map((u) => (
              <button
                key={u.id}
                className="chip"
                onClick={() => {
                  login(u.id);
                  router.push("/mypage");
                }}
              >
                {u.role === "student" ? "🎒" : "🎓"} {u.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="divider">시연용 멘토 계정으로 로그인</div>
      <p className="muted" style={{ marginTop: 0 }}>
        학생으로 신청한 뒤, 해당 멘토 계정으로 로그인하면 신청을 승인하는 흐름을 확인할 수 있어요.
      </p>
      <div className="demo-list">
        {SEED_MENTORS.map((m) => (
          <button
            key={m.id}
            className="chip"
            onClick={() => {
              loginAsSeedMentor(m.id);
              router.push("/mypage");
            }}
          >
            🎓 {m.name} ({m.major})
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
