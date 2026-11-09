"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

type Account = { id: string; fullName: string; email: string; isAdmin?: boolean };

function initials(fullName: string, email: string) {
  const letters = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]);
  return (letters.join("") || email[0] || "S").toUpperCase();
}

export function AccountControl() {
  const [account, setAccount] = useState<Account | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const update = (user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!active) return;
      setAccount(user ? {
        id: user.id,
        email: user.email ?? "student",
        fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
      } : null);
      setAdminChecked(false);
    };

    void supabase.auth.getSession().then(({ data }) => update(data.session?.user ?? null)).catch(() => update(null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => update(session?.user ?? null));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const checkAdmin = async (open: boolean) => {
    if (!open || !account || adminChecked) return;
    setAdminChecked(true);
    const { data } = await createClient().from("profiles").select("is_admin").eq("id", account.id).maybeSingle();
    setAccount((current) => current ? { ...current, isAdmin: data?.is_admin ?? false } : current);
  };

  if (!account) return <Link className="account-login" href="/login">Log in</Link>;

  return (
    <details className="account-menu" onToggle={(event) => { void checkAdmin(event.currentTarget.open); }}>
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
