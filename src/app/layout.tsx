import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Tre-アイトレ- - AIパーソナルトレーナーと始める理想のボディメイク",
  description: "AIがあなた専用のトレーニングメニューを画像で生成。自宅で本格的なパーソナルジム体験を提供するAI Tre-アイトレ-。",
  keywords: "AI, トレーニング, パーソナルジム, ワークアウト, フィットネス, 画像, 自宅",
  authors: [{ name: "AI Tre-アイトレ- Team" }],
  openGraph: {
    title: "AI Tre-アイトレ- - AIパーソナルトレーナー",
    description: "AIがあなた専用のトレーニングメニューを画像で生成",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tre-アイトレ- - AIパーソナルトレーナー",
    description: "AIがあなた専用のトレーニングメニューを画像で生成",
  },
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
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
