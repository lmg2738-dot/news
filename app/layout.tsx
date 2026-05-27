import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { getAppTitle } from "@/lib/app-meta";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: getAppTitle(),
  description: `${getAppTitle()} — 당일·어제 뉴스 모니터`,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSans.variable}>
      <body>{children}</body>
    </html>
  );
}
