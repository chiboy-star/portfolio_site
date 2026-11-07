import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { tierDetectionScript } from "@/lib/tier-script";
import { DevTierBadge } from "@/components/dev-tier-badge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chinemerem.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Chinemerem Madueke | Junior Frontend Developer",
  description:
    "Junior Software Developer and Pan-Atlantic University software engineering student. Front-end engineering in React and Next.js. Open to internships.",
  keywords: [
    "Chinemerem Madueke",
    "Frontend Developer",
    "React Developer",
    "Next.js",
    "Tailwind CSS",
    "Software Engineering Intern",
  ],
  authors: [{ name: "Chinemerem Madueke", url: "https://github.com/chiboy-star" }],
  creator: "Chinemerem Madueke",
  openGraph: {
    title: "Chinemerem Madueke | Junior Frontend Developer",
    description: "Junior Frontend Developer. Open to internships.",
    url: siteUrl,
    siteName: "Chinemerem Madueke Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chinemerem Madueke | Junior Frontend Developer",
    description: "Junior Frontend Developer. Open to internships.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: tierDetectionScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--bg)] text-[var(--fg)]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Analytics />
          <DevTierBadge />
        </ThemeProvider>
      </body>
    </html>
  );
}
