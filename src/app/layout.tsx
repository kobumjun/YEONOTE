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
    default: `${appName} — AI Template Generator`,
    template: `%s | ${appName}`,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  description:
    "AI-powered template generator for structured Notion-style pages. Describe what you need and get a ready-to-edit layout in seconds.",
  openGraph: {
    title: `${appName} — AI Template Generator`,
    description:
      "AI-powered template generator for structured Notion-style pages. Describe what you need and get a ready-to-edit layout in seconds.",
    url: appUrl,
    siteName: appName,
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
