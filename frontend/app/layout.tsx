import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/ThemeToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = "https://getleadly.net";

// SEO: descriptive title template + meta description (audit flagged the bare "Leadly" title)
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Leadly — Find weak local websites and turn them into paying clients",
    template: "%s · Leadly",
  },
  description:
    "Leadly pulls local businesses by niche and city, audits their websites across speed, mobile, SEO, design and security, scores each as a 0–100 opportunity, and writes honest outreach based on what's actually broken.",
  keywords: [
    "lead generation",
    "local SEO audit",
    "website audit tool",
    "agency lead finder",
    "cold outreach",
    "freelancer clients",
    "web design leads",
  ],
  authors: [{ name: "Leadly" }],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Leadly — Find weak local websites. Turn them into paying clients.",
    description:
      "Find local businesses by niche and city, audit their sites automatically, score the opportunity 0–100, and send honest outreach that lands.",
    siteName: "Leadly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leadly — Find weak local websites. Turn them into paying clients.",
    description:
      "Find, analyse, connect and close. The lead engine for agencies and freelancers.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
