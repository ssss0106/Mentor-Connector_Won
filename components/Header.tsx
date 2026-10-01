"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminChatMenu from "./AdminChatMenu";
import { logout, useStore } from "@/lib/store";
import ChatMenu from "./ChatMenu";
import Logo from "./Logo";

export default function Header() {
  const { currentUser } = useStore();
  // 운영자 페이지에서는 운영자용 채팅 아이콘(멘토와의 대화)을 보여 준다
  const isAdminPage = usePathname()?.startsWith("/admin");

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo" aria-label="Menco 홈">
          <Logo />
        </Link>
        <nav className="nav">
          <Link href="/mentors">멘토 둘러보기</Link>
          {isAdminPage && <AdminChatMenu />}
          {currentUser?.role === "student" && <Link href="/concern">고민 입력</Link>}
          {currentUser?.role === "mentor" && currentUser.mentorId && <Link href="/mentor/students">멘티 찾기</Link>}
          {currentUser ? (
            <>
              <Link href="/mypage">마이페이지</Link>
              {!isAdminPage && <ChatMenu />}
              <button
                className="link-btn"
                onClick={() => {
                  logout();
                  // 전체 새로고침으로 이동해, 로그인 필요 페이지의 /signup 리다이렉트와 겹치지 않게 한다
                  window.location.href = "/";
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
