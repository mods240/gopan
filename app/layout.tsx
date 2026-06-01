import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#92400e",
};

export const metadata: Metadata = {
  title: "ゴパン - パン屋ナビ",
  description: "全国のパン屋を地図で見つけるアプリ。助手席で見つけて運転手に届ける。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ゴパン",
  },
  icons: {
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "ゴパン🥐 - パン屋ナビ",
    description: "全国のパン屋を地図で見つけるアプリ。助手席で見つけて運転手に届ける。",
    url: "https://gopan.vercel.app",
    siteName: "ゴパン",
    images: [
      {
        url: "https://gopan.vercel.app/icon-512.png",
        width: 512,
        height: 512,
        alt: "ゴパン - パン屋ナビ",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ゴパン🥐 - パン屋ナビ",
    description: "全国のパン屋を地図で見つけるアプリ。助手席で見つけて運転手に届ける。",
    images: ["https://gopan.vercel.app/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ゴパン" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0822883607725147" crossOrigin="anonymous"></script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
