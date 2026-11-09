import Image from "next/image";
import Link from "next/link";
import { BottomNavigation, DesktopNavigation } from "@/components/app-navigation";
import { AccountControl } from "@/components/account-control";

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand-lockup" href="/" aria-label="SaathBuy home">
          <Image className="brand-mark" src="/brand/logo-mark-on-dark.png" alt="" width={560} height={763} priority />
          <Image className="brand-wordmark" src="/brand/logo-wordmark-on-dark.png" alt="SaathBuy" width={1176} height={313} priority />
        </Link>
        <DesktopNavigation />
        <AccountControl />
      </header>
      {children}
      <BottomNavigation />
    </div>
  );
}
