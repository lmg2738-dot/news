import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CJ 뉴스 알림",
  description: "CJ 관련 최신 뉴스 (전일·당일)",
  themeColor: "#f4f7fb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
