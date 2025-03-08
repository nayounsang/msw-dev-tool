import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "nextra-theme-docs";
import { REPO_URL } from "@/const/link";
import { getPageMap } from "nextra/page-map";
import { banner, footer, navbar } from "./_components/Layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
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
        <Layout
          sidebar={{ autoCollapse: true }}
          docsRepositoryBase={REPO_URL}
          pageMap={await getPageMap()}
          navbar={navbar}
          footer={footer}
          banner={banner}
          editLink="Edit this page on GitHub"
          darkMode
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
