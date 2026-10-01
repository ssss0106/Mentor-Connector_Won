import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import RoomBadge from "@/components/RoomBadge";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menco · Mentor Connector | 어디에 살아도 같은 진학 정보, 대학생 선배 1:1 멘토링",
  description: "지역 청소년이 어디에 살아도 같은 진학 정보를 얻도록, 대학·전공을 먼저 경험한 대학생 선배와 1:1로 연결하는 멘토링 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main>{children}</main>
        <RoomBadge />
        <footer className="footer">
          <div className="container">
            © Menco (Mentor Connector) · <Link href="/admin">운영자 페이지</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
