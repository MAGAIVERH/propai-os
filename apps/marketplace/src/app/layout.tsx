import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { CookieNotice } from "@/components/cookie-notice";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { fetchBranding } from "@/lib/api";
import { getDefaultTenantId } from "@/lib/env";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PropAI Marketplace — Homes & Rentals Across the US",
    template: "%s · PropAI Marketplace",
  },
  description:
    "Browse homes and rentals across the United States. AI-powered property search for buyers and renters, powered by PropAI.",
  applicationName: "PropAI Marketplace",
  keywords: [
    "real estate",
    "homes for sale",
    "apartments for rent",
    "property search",
    "US real estate",
    "AI real estate search",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "PropAI Marketplace",
    title: "PropAI Marketplace — Homes & Rentals Across the US",
    description:
      "AI-powered property search for buyers and renters across the United States.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PropAI Marketplace — Homes & Rentals Across the US",
    description:
      "AI-powered property search for buyers and renters across the United States.",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const tenantId = getDefaultTenantId();
  const branding = tenantId ? await fetchBranding(tenantId) : null;

  return (
    <html lang="en-US" className={`dark ${inter.variable}`}>
      {branding?.primaryColor ? (
        <head>
          {/* Apply the brokerage's brand color to the marketplace theme. */}
          <style>{`:root{--primary:${branding.primaryColor};--ring:${branding.primaryColor};}`}</style>
        </head>
      ) : null}
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader agencyName={branding?.agencyName} logoUrl={branding?.logoUrl} />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter agencyName={branding?.agencyName} />
        <CookieNotice />
      </body>
    </html>
  );
}
