import Image from "next/image";
import Link from "next/link";
import { Gift, House, PackageCheck, UserRound } from "lucide-react";

const tabs = [
  { label: "Deals", href: "/", icon: House },
  { label: "Pickups", href: "/pickup", icon: PackageCheck },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "Account", href: "/login", icon: UserRound },
] as const;

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand-lockup" href="/" aria-label="SaathBuy home">
          <Image src="/brand/logo-mark.png" alt="" width={30} height={30} priority />
          <Image src="/brand/logo-wordmark.png" alt="SaathBuy" width={104} height={20} priority />
        </Link>
      </header>
      {children}
      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map(({ label, href, icon: Icon }) => (
          <Link className="nav-link" href={href} key={label} aria-current={label === "Deals" ? "page" : undefined}>
            <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
