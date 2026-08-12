import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAGUYA LANDER",
  description: "月面着陸ゲーム — ハーネス駆動開発の題材プロジェクト",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
