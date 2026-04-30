import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "YEO";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} — AI 템플릿 워크플로`,
    template: `%s | ${appName}`,
  },
  description:
    "말만 하세요. YEO가 만듭니다. Describe it. YEO builds it. AI-powered Notion-style templates.",
  openGraph: {
    title: appName,
    description: "Describe it. YEO builds it.",
    url: appUrl,
    siteName: appName,
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body
        className={cn(
          inter.variable,
          "min-h-screen bg-background font-sans antialiased [--font-pretendard:'Pretendard',sans-serif]"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
