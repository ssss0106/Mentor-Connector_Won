"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VerificationBadge from "@/components/VerificationBadge";
import { submitVerification, useStore } from "@/lib/store";

// 멘토 경력 조회 동의서 + 조회 결과 파일 첨부 (시연 버전)
// 실제 조회는 멘토 본인이 사이트 밖에서 하고, 운영자가 서류를 확인한 뒤 /admin 에서 승인한다.
// 개인정보 보호를 위해 파일 내용은 읽거나 저장하지 않고 파일 이름만 기록한다.

export default function MentorVerifyPage() {
  const router = useRouter();
  const { ready, currentUser, allMentors } = useStore();
  const mentor = currentUser?.mentorId ? allMentors.find((m) => m.id === currentUser.mentorId) : undefined;

  const [agreeCheck, setAgreeCheck] = useState(false);
  const [agreeTrue, setAgreeTrue] = useState(false);
  const [signName, setSignName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!currentUser || currentUser.role !== "mentor") router.replace("/signup?role=mentor");
    else if (!currentUser.mentorId) router.replace("/mentor/profile");
  }, [ready, currentUser, router]);

  if (!ready || !currentUser || !mentor) return null;

  const status = mentor.verification.status;
  const canSubmit = status === "not_submitted" || status === "rejected";
  const nameMatches = signName.trim() === mentor.name;
  const valid = agreeCheck && agreeTrue && nameMatches && !!fileName;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");
    setFileName("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("PDF 파일만 첨부할 수 있어요.");
      e.target.value = "";
      return;
    }
    setFileName(file.name);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    submitVerification(mentor.id, signName.trim(), fileName);
    router.push("/mypage");
  };

  return (
    <div className="container narrow page">
      <h1 className="page-title">멘토 경력 조회 확인</h1>
      <p className="page-sub">
        청소년과 1:1로 만나는 활동이라, 경력 조회 확인을 마친 선배만 학생에게 소개돼요.
      </p>

      <div className="card verify-status-card">
        <span>현재 상태</span>
        <VerificationBadge status={status} />
      </div>

      {status === "rejected" && (
        <div className="card notice notice-warn">
          <strong>제출한 서류가 반려됐어요.</strong>
          <div>사유: {mentor.verification.rejectReason || "사유 없음"}</div>
          <div className="muted">서류를 다시 확인한 뒤 아래에서 다시 제출해 주세요.</div>
        </div>
      )}

      {!canSubmit ? (
        <div className="card notice">
          {status === "pending" ? (
            <>
              <strong>운영자가 서류를 확인하고 있어요.</strong>
              <div className="muted">
                제출 파일: {mentor.verification.fileName} · 확인이 끝나면 학생에게 프로필이 공개돼요.
              </div>
            </>
          ) : (
            <strong>경력 조회 확인이 완료됐어요. 이제 학생에게 추천돼요.</strong>
          )}
          <div style={{ marginTop: 16 }}>
            <Link href="/mypage" className="btn btn-sm">마이페이지로</Link>
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          <section className="card consent">
            <h2>성범죄 경력 및 아동학대관련범죄 전력 조회 동의서</h2>
            <p className="consent-note">시연용 양식 · 실제 운영 전 담당 선생님 등의 검토가 필요해요.</p>
            <ol>
              <li><strong>목적</strong> · 청소년 대상 1:1 멘토링 활동의 안전 확보</li>
              <li><strong>조회 항목</strong> · 성범죄 경력, 아동학대관련범죄 전력</li>
              <li><strong>관련 법령</strong> · 「아동·청소년의 성보호에 관한 법률」, 「아동복지법」</li>
              <li><strong>확인 방법</strong> · 멘토 본인이 발급받은 조회 결과 서류를 운영자가 확인</li>
              <li><strong>보관</strong> · 확인 후 서류는 파기하고, 확인 여부와 확인 일시만 보관</li>
              <li><strong>동의 거부</strong> · 동의하지 않을 수 있지만, 이 경우 멘토로 활동할 수 없어요</li>
            </ol>
          </section>

          <label className="check">
            <input type="checkbox" checked={agreeCheck} onChange={(e) => setAgreeCheck(e.target.checked)} />
            <span><strong>[필수]</strong> 위 내용을 읽었으며, 경력 조회 확인에 동의합니다.</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={agreeTrue} onChange={(e) => setAgreeTrue(e.target.checked)} />
            <span><strong>[필수]</strong> 제출하는 서류가 본인의 것이며 사실과 다르지 않음을 확인합니다.</span>
          </label>

          <div className="field">
            <label className="label" htmlFor="sign">
              서명 <span className="hint">프로필 이름({mentor.name})을 그대로 입력해 주세요</span>
            </label>
            <input id="sign" className="input" value={signName} onChange={(e) => setSignName(e.target.value)} placeholder={mentor.name} />
            {signName.trim() && !nameMatches && <div className="field-error">프로필 이름과 같아야 해요.</div>}
          </div>

          <div className="field">
            <label className="label" htmlFor="file">조회 결과 파일 (PDF)</label>
            <input id="file" type="file" accept="application/pdf,.pdf" className="input" onChange={onFile} />
            {fileError && <div className="field-error">{fileError}</div>}
            <div className="demo-warning">
              시연 버전에서는 파일 내용을 저장하지 않고 <strong>파일 이름만</strong> 기록해요.
              실제 개인정보가 담긴 서류는 올리지 말고, 아무 PDF 파일로 시연해 주세요.
            </div>
          </div>

          <button className="btn btn-block" disabled={!valid}>
            동의하고 제출하기
          </button>
        </form>
      )}
    </div>
  );
}
