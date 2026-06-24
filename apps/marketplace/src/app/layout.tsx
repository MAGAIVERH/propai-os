import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { CookieNotice } from "@/components/cookie-notice";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PropAI OS Marketplace — US Real Estate",
    template: "%s · PropAI OS",
  },
  description:
    "Browse homes and rentals across the United States. AI-powered property search for buyers and renters, powered by PropAI OS.",
  keywords: [
    "real estate",
    "homes for sale",
    "apartments for rent",
    "property search",
    "US real estate",
  ],
  openGraph: {
    type: "website",
    siteName: "PropAI OS Marketplace",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en-US" className={`dark ${inter.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
        <CookieNotice />
      </body>
    </html>
  );
}
