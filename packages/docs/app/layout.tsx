import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "nextra-theme-docs";
import { REPO_URL } from "@/const/link";
import { getPageMap } from "nextra/page-map";
import { banner, footer, navbar } from "./_components/Layout";
import { MSWProvider } from "./_components/MSWProvider";

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
    "mock",
    "service",
    "worker",
    "devtool",
    "tool",
    "test",
    "api",
  ],
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
    </html>
  );
}
