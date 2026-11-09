"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Gavel, House, PackageCheck, Sparkles, UserRound } from "lucide-react";

const tabs = [
  { label: "Deals", href: "/", icon: House },
  { label: "Pickups", href: "/pickup", icon: PackageCheck },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "Auctions", href: "/auctions", icon: Gavel },
  { label: "Request", href: "/request", icon: Sparkles },
  { label: "Account", href: "/login", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/deals/") : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="desktop-nav">
      {tabs.map(({ href, label }) => (
        <Link aria-current={isActive(pathname, href) || (label === "Account" && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) ? "page" : undefined} className="desktop-nav-link" href={href} key={href} prefetch={false}>{label}</Link>
      ))}
    </nav>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map(({ label, href, icon: Icon }) => (
        <Link className="nav-link" href={href} key={label} prefetch={false} aria-current={isActive(pathname, href) || (label === "Account" && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) ? "page" : undefined}>
          <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
