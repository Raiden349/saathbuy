import type { Metadata } from "next";
import { Hanken_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const outfit = Outfit({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-outfit", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-hanken", display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "SaathBuy",
  description: "Buy together. Save together.",
  manifest: "/manifest.webmanifest",
  openGraph: { title: "SaathBuy", description: "Buy together. Save together.", images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }] },
  icons: { icon: "/favicon.ico", apple: "/icons/apple-touch-icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${hanken.variable}`}>
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
