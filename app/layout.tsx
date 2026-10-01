import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menco · Mentor Connector | 내 고민을 먼저 경험한 대학생 선배와 1:1 멘토링",
  description: "지역 청소년과 대학생 선배를 고민 기반으로 연결하는 1:1 진로·학습 멘토링 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="footer">
          <div className="container">
            © Menco (Mentor Connector) · <Link href="/admin">운영자 페이지</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
