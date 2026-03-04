import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "solvPS — 알고리즘 약점 분석",
  description: "solved.ac 데이터 기반 알고리즘 약점 분석 · Claude AI 문제 추천",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geist.variable} font-sans antialiased bg-background`}>
        {children}
      </body>
    </html>
  );
}
