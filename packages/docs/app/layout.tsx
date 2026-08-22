import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "nextra-theme-docs";
import { REPO_URL } from "@/const/link";
import { getPageMap } from "nextra/page-map";
import { banner, footer, navbar } from "./_components/Layout";
import { MSWProvider } from "./_components/MSWProvider";
import { GoogleAnalytics } from "@next/third-parties/google";

const SITE_URL = "https://msw-dev-tool-docs.vercel.app";
const SITE_NAME = "MSW Dev Tool";
const SITE_DESCRIPTION =
  "Inspect and control MSW API scenarios at runtime. Simulate failures, verify user flows, and give AI agents a controlled network environment.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MSW Dev Tool — Runtime API scenario control for MSW",
    template: "%s | MSW Dev Tool",
  },
  applicationName: SITE_NAME,
  description: SITE_DESCRIPTION,
  keywords: [
    "MSW Dev Tool",
    "Mock Service Worker",
    "runtime API mocking",
    "API scenario testing",
    "AI agent testing",
  ],
  authors: [{ name: "MSW Dev Tool contributors" }],
  creator: "MSW Dev Tool contributors",
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "MSW Dev Tool — Runtime API scenario control for MSW",
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MSW Dev Tool" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MSW Dev Tool — Runtime API scenario control for MSW",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  verification: {
    google: "nZV_ZdGfP7qnS6DjjdRD9T6a6XLWkdKXYYpphQg-w2s",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              alternateName: "msw-dev-tool",
              url: SITE_URL,
              description: SITE_DESCRIPTION,
            }),
          }}
        />
      </head>
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
