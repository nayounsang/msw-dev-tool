import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "nextra-theme-docs";
import { REPO_URL } from "@/const/link";
import { getPageMap } from "nextra/page-map";
import { banner, footer, navbar } from "./_components/Layout";
import { MSWProvider } from "./_components/MSWProvider";
import { GoogleAnalytics } from '@next/third-parties/google'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'msw dev tool : Control and debug mock logic and api',
    template: '%s | msw dev tool'
  },
  description:
    "Dev tool to control mock logic, modify responses, and monitor API calls with msw.",
  keywords: [
    "msw",
    "zustand",
    "mock",
    "service",
    "worker",
    "devtool",
    "tool",
    "test",
    "api",
    "msw-dev-tool",
    "front-end",
    "FE",
    "react",
    "nextjs",
    "Next.js",
    "developer tool"
  ],
  other: {
    "google-site-verification":"nZV_ZdGfP7qnS6DjjdRD9T6a6XLWkdKXYYpphQg-w2s"
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180" }
    ],
    shortcut: ["/favicon/favicon.ico"],
    other: [
      { rel: "manifest", url: "/favicon/site.webmanifest" }
    ]
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MSWProvider>
          <Layout
            sidebar={{ autoCollapse: true }}
            docsRepositoryBase={REPO_URL}
            pageMap={await getPageMap()}
            navbar={navbar}
            footer={footer}
            banner={banner}
            editLink={null}
            darkMode={false}
            nextThemes={{ forcedTheme: "dark", defaultTheme: "dark" }}
          >
            {children}
          </Layout>
        </MSWProvider>
      </body>
      <GoogleAnalytics gaId="G-B4RWVVK40Q" />
    </html>
  );
}
