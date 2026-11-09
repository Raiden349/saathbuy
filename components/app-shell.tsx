import Image from "next/image";
import Link from "next/link";
import { BottomNavigation, DesktopNavigation } from "@/components/app-navigation";
import { AccountControl } from "@/components/account-control";

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand-lockup" href="/" aria-label="SaathBuy home">
          <Image src="/brand/logo-mark.png" alt="" width={30} height={30} priority />
          <Image src="/brand/logo-wordmark.png" alt="SaathBuy" width={104} height={20} priority />
        </Link>
        <DesktopNavigation />
        <AccountControl />
      </header>
      {children}
      <BottomNavigation />
    </div>
  );
}
