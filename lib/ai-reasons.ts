"use client";

// 추천된 멘토마다 "왜 이 선배인지"를 서버(/api/recommend-reasons)에서 받아온다.
// 같은 고민·같은 멘토 조합은 브라우저에 저장해 두고 다시 요청하지 않는다.
// 실패해도 추천 화면은 그대로 보이고, AI 설명만 빠진다.

import { useEffect, useState } from "react";
import type { Mentor, StudentProfile } from "./types";

export const REASON_CACHE_PREFIX = "mentor-connector:reasons:";

export type ReasonStatus = "idle" | "loading" | "done" | "error";

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function useAiReasons(profile: StudentProfile | null, mentors: Mentor[]) {
  const [state, setState] = useState<{ status: ReasonStatus; reasons: Record<string, string> }>({
    status: "idle",
    reasons: {},
  });

  // 학생 이름 등 개인 정보는 보내지 않고, 추천에 필요한 내용만 보낸다
  const body =
    profile && mentors.length > 0
      ? JSON.stringify({
          student: {
            grade: profile.grade,
            region: profile.region,
            category: profile.category,
            topics: profile.topics,
            desiredMajor: profile.desiredMajor,
            admissionPath: profile.admissionPath ?? "",
            concern: profile.concern,
          },
          mentors: mentors.map((m) => ({
            id: m.id,
            university: m.university,
            major: m.major,
            hometown: m.hometown ?? "",
            admissionPath: m.admission?.path ?? "",
            unknownBefore: m.insight?.unknownBefore ?? "",
            hardPart: m.insight?.hardPart ?? "",
            switched: m.insight?.switched?.reason ?? "",
            topics: m.topics,
            experience: m.experience,
          })),
        })
      : "";

  useEffect(() => {
    if (!body) {
      setState({ status: "idle", reasons: {} });
      return;
    }
    const key = REASON_CACHE_PREFIX + hash(body);
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        setState({ status: "done", reasons: JSON.parse(cached) });
        return;
      }
    } catch {}

    let cancelled = false;
    setState({ status: "loading", reasons: {} });
    fetch("/api/recommend-reasons", { method: "POST", headers: { "Content-Type": "application/json" }, body })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        const reasons: Record<string, string> = d.reasons ?? {};
        try {
          localStorage.setItem(key, JSON.stringify(reasons));
        } catch {}
        setState({ status: "done", reasons });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", reasons: {} });
      });
    return () => {
      cancelled = true;
    };
  }, [body]);

  return state;
}
