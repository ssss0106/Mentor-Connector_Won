"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VerificationBadge from "@/components/VerificationBadge";
import { submitEnrollment, submitVerification, useStore } from "@/lib/store";
import type { Mentor } from "@/lib/types";

// 멘토 인증 (시연 버전): ① 재학 인증(재학증명서·성적증명서) ② 성범죄·아동학대 경력 조회 동의 + 조회 결과
// 서류는 멘토 본인이 사이트 밖에서 발급받고, 운영자가 확인한 뒤 /admin 에서 승인한다.
// 개인정보 보호를 위해 파일 내용은 읽거나 저장하지 않고 파일 이름만 기록한다.

// PDF 한 개를 고르는 입력칸. 파일 이름만 부모에게 넘긴다.
function PdfInput({ id, label, onChange }: { id: string; label: string; onChange: (name: string) => void }) {
  const [error, setError] = useState("");
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        className="input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setError("");
          onChange("");
          if (!file) return;
          if (!file.name.toLowerCase().endsWith(".pdf")) {
            setError("PDF 파일만 첨부할 수 있어요.");
            e.target.value = "";
            return;
          }
          onChange(file.name);
        }}
      />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function DemoWarning() {
  return (
    <div className="demo-warning">
      시연 버전에서는 파일 내용을 저장하지 않고 <strong>파일 이름만</strong> 기록해요.
      실제 개인정보가 담긴 서류는 올리지 말고, 아무 PDF 파일로 시연해 주세요.
    </div>
  );
}

// 제출 후 상태 안내 (확인 대기 / 완료)
function SubmittedNotice({ status, files }: { status: "pending" | "approved"; files: string[] }) {
  return (
    <div className="notice verify-done">
      {status === "pending" ? (
        <>
          <strong>운영자가 서류를 확인하고 있어요.</strong>
          <div className="muted">제출 파일: {files.join(", ")}</div>
        </>
      ) : (
        <strong>확인이 완료됐어요.</strong>
      )}
    </div>
  );
}

function RejectedNotice({ reason }: { reason?: string }) {
  return (
    <div className="notice notice-warn">
      <strong>제출한 서류가 반려됐어요.</strong>
      <div>사유: {reason || "사유 없음"}</div>
      <div className="muted">서류를 다시 확인한 뒤 아래에서 다시 제출해 주세요.</div>
    </div>
  );
}

// ① 재학 인증
function EnrollmentSection({ mentor }: { mentor: Mentor }) {
  const [enrollmentFile, setEnrollmentFile] = useState("");
  const [transcriptFile, setTranscriptFile] = useState("");
  const [agree, setAgree] = useState(false);
  const e = mentor.enrollment;
  const canSubmit = e.status === "not_submitted" || e.status === "rejected";
  const valid = !!enrollmentFile && !!transcriptFile && agree;

  return (
    <section className="card verify-section">
      <div className="verify-section-head">
        <h2>1. 재학 인증</h2>
        <VerificationBadge status={e.status} kind="enrollment" />
      </div>
      <p className="muted">
        프로필에 적은 <strong>{mentor.university} {mentor.major}</strong> 재학 여부를 확인해요. 학생에게 보이는 학교·전공 정보를 믿을 수 있게 하기 위한 절차예요.
      </p>

      {e.status === "rejected" && <RejectedNotice reason={e.rejectReason} />}

      {!canSubmit ? (
        <SubmittedNotice status={e.status as "pending" | "approved"} files={[e.enrollmentFileName ?? "-", e.transcriptFileName ?? "-"]} />
      ) : (
        <form
          className="form"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (valid) submitEnrollment(mentor.id, enrollmentFile, transcriptFile);
          }}
        >
          <PdfInput id="enrollment-file" label="재학증명서 (PDF)" onChange={setEnrollmentFile} />
          <PdfInput id="transcript-file" label="성적증명서 (PDF)" onChange={setTranscriptFile} />
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(ev) => setAgree(ev.target.checked)} />
            <span>
              <strong>[필수]</strong> 제출하는 서류가 본인의 것이며, 최근 3개월 안에 발급받은 서류임을 확인합니다.
            </span>
          </label>
          <DemoWarning />
          <button className="btn btn-block" disabled={!valid}>
            재학 서류 제출하기
          </button>
        </form>
      )}
    </section>
  );
}

// ② 성범죄 경력 및 아동학대관련범죄 전력 조회
function BackgroundSection({ mentor }: { mentor: Mentor }) {
  const [agreeCheck, setAgreeCheck] = useState(false);
  const [agreeTrue, setAgreeTrue] = useState(false);
  const [signName, setSignName] = useState("");
  const [fileName, setFileName] = useState("");
  const v = mentor.verification;
  const canSubmit = v.status === "not_submitted" || v.status === "rejected";
  const nameMatches = signName.trim() === mentor.name;
  const valid = agreeCheck && agreeTrue && nameMatches && !!fileName;

  return (
    <section className="card verify-section">
      <div className="verify-section-head">
        <h2>2. 경력 조회 동의</h2>
        <VerificationBadge status={v.status} />
      </div>
      <p className="muted">청소년과 1:1로 만나는 활동이라, 경력 조회 확인을 마친 선배만 학생에게 소개돼요.</p>

      {v.status === "rejected" && <RejectedNotice reason={v.rejectReason} />}

      {!canSubmit ? (
        <SubmittedNotice status={v.status as "pending" | "approved"} files={[v.fileName ?? "-"]} />
      ) : (
        <form
          className="form"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (valid) submitVerification(mentor.id, signName.trim(), fileName);
          }}
        >
          <div className="consent">
            <h3>성범죄 경력 및 아동학대관련범죄 전력 조회 동의서</h3>
            <p className="consent-note">시연용 양식 · 실제 운영 전 담당 선생님 등의 검토가 필요해요.</p>
            <ol>
              <li><strong>목적</strong> · 청소년 대상 1:1 멘토링 활동의 안전 확보</li>
              <li><strong>조회 항목</strong> · 성범죄 경력, 아동학대관련범죄 전력</li>
              <li><strong>관련 법령</strong> · 「아동·청소년의 성보호에 관한 법률」, 「아동복지법」</li>
              <li><strong>확인 방법</strong> · 멘토 본인이 발급받은 조회 결과 서류를 운영자가 확인</li>
              <li><strong>보관</strong> · 확인 후 서류는 파기하고, 확인 여부와 확인 일시만 보관</li>
              <li><strong>동의 거부</strong> · 동의하지 않을 수 있지만, 이 경우 멘토로 활동할 수 없어요</li>
            </ol>
          </div>

          <label className="check">
            <input type="checkbox" checked={agreeCheck} onChange={(ev) => setAgreeCheck(ev.target.checked)} />
            <span><strong>[필수]</strong> 위 내용을 읽었으며, 경력 조회 확인에 동의합니다.</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={agreeTrue} onChange={(ev) => setAgreeTrue(ev.target.checked)} />
            <span><strong>[필수]</strong> 제출하는 서류가 본인의 것이며 사실과 다르지 않음을 확인합니다.</span>
          </label>

          <div className="field">
            <label className="label" htmlFor="sign">
              서명 <span className="hint">프로필 이름({mentor.name})을 그대로 입력해 주세요</span>
            </label>
            <input id="sign" className="input" value={signName} onChange={(ev) => setSignName(ev.target.value)} placeholder={mentor.name} />
            {signName.trim() && !nameMatches && <div className="field-error">프로필 이름과 같아야 해요.</div>}
          </div>

          <PdfInput id="file" label="조회 결과 파일 (PDF)" onChange={setFileName} />
          <DemoWarning />

          <button className="btn btn-block" disabled={!valid}>
            동의하고 제출하기
          </button>
        </form>
      )}
    </section>
  );
}

export default function MentorVerifyPage() {
  const router = useRouter();
  const { ready, currentUser, allMentors } = useStore();
  const mentor = currentUser?.mentorId ? allMentors.find((m) => m.id === currentUser.mentorId) : undefined;

  useEffect(() => {
    if (!ready) return;
    if (!currentUser || currentUser.role !== "mentor") router.replace("/signup?role=mentor");
    else if (!currentUser.mentorId) router.replace("/mentor/profile");
  }, [ready, currentUser, router]);

  if (!ready || !currentUser || !mentor) return null;

  return (
    <div className="container narrow page">
      <h1 className="page-title">멘토 인증</h1>
      <p className="page-sub">
        재학 인증과 경력 조회 확인을 모두 마친 선배만 학생에게 소개돼요. 두 가지는 따로 제출할 수 있어요.
      </p>

      <div className="verify-sections">
        <EnrollmentSection mentor={mentor} />
        <BackgroundSection mentor={mentor} />
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link href="/mypage" className="btn btn-ghost">마이페이지로</Link>
      </div>
    </div>
  );
}
