import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PropAI OS Marketplace",
  description: "Public property search for US real estate — powered by PropAI OS.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en-US" className="dark antialiased">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
