import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex",
});

// 日本語フォントは全 unicode-range を CSS 側で分割配信するため preload しない
const shipporiMincho = Shippori_Mincho({
  weight: ["400", "500"],
  preload: false,
  variable: "--font-mincho",
});

export const metadata: Metadata = {
  title: "KAGUYA LANDER",
  description: "月面着陸ゲーム — ハーネス駆動開発の題材プロジェクト",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${plexMono.variable} ${shipporiMincho.variable}`}>
      <body>{children}</body>
    </html>
  );
}
