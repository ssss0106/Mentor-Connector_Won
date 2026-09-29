"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, useStore } from "@/lib/store";

export default function Header() {
  const { currentUser } = useStore();
  const router = useRouter();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          Mentor<span>connector</span>
        </Link>
        <nav className="nav">
          <Link href="/mentors">멘토 둘러보기</Link>
          {currentUser?.role === "student" && <Link href="/concern">고민 입력</Link>}
          {currentUser ? (
            <>
              <Link href="/mypage">마이페이지</Link>
              <button
                className="link-btn"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/signup" className="btn btn-sm">
              시작하기
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
