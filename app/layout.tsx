import type { Metadata } from "next";
import { Hanken_Grotesk, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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
    <html lang="en" className={`${outfit.variable} ${hanken.variable}`} suppressHydrationWarning>
      <head>
        <Script id="saathbuy-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('saathbuy-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
