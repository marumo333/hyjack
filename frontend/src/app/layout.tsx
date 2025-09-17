import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/component/Header";
import RecoilProvider from "./RecoilProvider"; // Recoilを使用している場合
import AppMantineProvider from "./MantineProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HYjack",
  description: "趣味でつながるSNS・EC複合アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Recoilを使用している場合はネスト */}
        <RecoilProvider>
          <AppMantineProvider>
            <Header />
            <main className="pt-16">{children}</main>
          </AppMantineProvider>
        </RecoilProvider>
      </body>
    </html>
  );
}
