import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upwork Proposal Generator",
  description: "채용 공고 분석 및 맞춤형 지원 전략 생성",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ko">
        <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
