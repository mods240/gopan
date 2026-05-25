import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ゴパン - 助手席で見つけて運転手に届ける",
  description: "京阪神のパン屋を、ドライブ中に見つけられる地図アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
