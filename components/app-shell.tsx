import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions/auth";
import { BottomNavigation, DesktopNavigation } from "@/components/app-navigation";

function initials(fullName: string, email: string) {
  const letters = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]);
  return (letters.join("") || email[0] || "S").toUpperCase();
}

async function AccountArea() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return <Link className="account-login" href="/login">Log in</Link>;

  let account: { fullName: string; email: string; isAdmin: boolean } | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, is_admin")
        .eq("id", user.id)
        .maybeSingle();
      account = {
        fullName: profile?.full_name ?? "",
        email: user.email ?? "student",
        isAdmin: profile?.is_admin ?? false,
      };
    }
  } catch {
    account = undefined;
  }

  if (!account) return <Link className="account-login" href="/login">Log in</Link>;
  return (
    <details className="account-menu">
      <summary className="account-trigger" aria-label="Account menu">
        <span aria-hidden="true">{initials(account.fullName, account.email)}</span>
      </summary>
      <div className="account-panel">
        <p className="account-name">{account.fullName || account.email}</p>
        {account.fullName && <p className="account-email">{account.email}</p>}
        {account.isAdmin && <Link className="account-menu-link" href="/admin">Admin</Link>}
        <form action={signOutAction}>
          <button className="account-menu-link account-logout" type="submit">Log out</button>
        </form>
      </div>
    </details>
  );
}

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand-lockup" href="/" aria-label="SaathBuy home">
          <Image src="/brand/logo-mark.png" alt="" width={30} height={30} priority />
          <Image src="/brand/logo-wordmark.png" alt="SaathBuy" width={104} height={20} priority />
        </Link>
        <DesktopNavigation />
        <AccountArea />
      </header>
      {children}
      <BottomNavigation />
    </div>
  );
}
