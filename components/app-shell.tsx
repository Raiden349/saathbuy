import Image from "next/image";
import Link from "next/link";
import { BottomNavigation, DesktopNavigation } from "@/components/app-navigation";
import { AccountControl } from "@/components/account-control";
import { ThemeToggle } from "@/components/theme-toggle";

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand-lockup" href="/" aria-label="SaathBuy home">
          <Image className="brand-mark brand-dark" src="/brand/logo-mark-on-dark.png" alt="" width={560} height={763} priority />
          <Image className="brand-mark brand-light" src="/brand/logo-mark.png" alt="" width={560} height={763} priority />
          <Image className="brand-wordmark brand-dark" src="/brand/logo-wordmark-on-dark.png" alt="SaathBuy" width={1176} height={313} priority />
          <Image className="brand-wordmark brand-light" src="/brand/logo-wordmark.png" alt="" width={1176} height={313} priority />
        </Link>
        <DesktopNavigation />
        <div className="header-actions">
          <ThemeToggle />
          <AccountControl />
        </div>
      </header>
      {children}
      <BottomNavigation />
    </div>
  );
}
