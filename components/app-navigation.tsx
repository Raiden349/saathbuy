"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, House, PackageCheck, Sparkles, UserRound } from "lucide-react";

const tabs = [
  { label: "Deals", href: "/", icon: House },
  { label: "Pickups", href: "/pickup", icon: PackageCheck },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "Request", href: "/request", icon: Sparkles },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/deals/") : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Main navigation" className="desktop-nav">
        {tabs.map(({ href, label }) => (
          <Link aria-current={isActive(pathname, href) ? "page" : undefined} className="desktop-nav-link" href={href} key={href}>{label}</Link>
        ))}
      </nav>
      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map(({ label, href, icon: Icon }) => (
          <Link className="nav-link" href={href} key={label} aria-current={isActive(pathname, href) ? "page" : undefined}>
            <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        ))}
        <Link className="nav-link nav-account-link" href="/login" aria-current={pathname.startsWith("/login") || pathname.startsWith("/signup") ? "page" : undefined}>
          <UserRound aria-hidden="true" size={20} strokeWidth={1.75} /><span>Account</span>
        </Link>
      </nav>
    </>
  );
}
