import Link from "next/link";
import { redirect } from "next/navigation";
import { saveManualKpisAction } from "@/app/actions/admin";
import { TestPushButton } from "@/components/test-push-button";
import { countJoinsThisWeek } from "@/lib/admin-metrics";
import { createClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-user";
import { closeExpiredDealsIfNeeded } from "@/lib/pickups";

type AdminHomeProps = { searchParams: Promise<{ issue?: string; notice?: string }> };

export default async function AdminHomePage({ searchParams }: AdminHomeProps) {
  const query = await searchParams;
  const [supabase, user] = await Promise.all([createClient().catch(() => null), getRequestUser()]);
  if (!supabase) redirect("/login?issue=configuration");
  if (!user) redirect("/login?next=%2Fadmin");

  await closeExpiredDealsIfNeeded(supabase);
  const [{ data: deals }, { data: joins }, { data: manual, error: manualError }] = await Promise.all([
    supabase.from("deals").select("id, status, joiner_count, tiers"),
    supabase.from("deal_joins").select("user_id, created_at, status"),
    supabase.from("kpi_manual").select("instagram_engagement, sponsor_leads").eq("id", 1).maybeSingle(),
  ]);
  const dealRows = deals ?? [];
  const joinRows = (joins ?? []).filter((join) => join.status === "joined" || join.status === "collected");
  const fillRates = dealRows.flatMap((deal) => {
    if (!Array.isArray(deal.tiers) || !deal.tiers.length) return [];
    const firstTier = deal.tiers[0];
    if (!firstTier || typeof firstTier !== "object" || Array.isArray(firstTier)) return [];
    const target = Number((firstTier as { min_joiners?: unknown }).min_joiners);
    return target > 0 ? [Math.min(100, deal.joiner_count / target * 100)] : [];
  });
  const joinCounts = new Map<string, number>();
  for (const join of joinRows) joinCounts.set(join.user_id, (joinCounts.get(join.user_id) ?? 0) + 1);
  const repeatJoiners = [...joinCounts.values()].filter((count) => count >= 2).length;
  const totalJoiners = joinCounts.size;
  const joinsThisWeek = countJoinsThisWeek(joinRows);

  return <main className="admin-main">
    <div className="admin-heading-row"><h1 className="home-title">Admin</h1><div className="admin-heading-actions"><Link className="button-secondary" href="/admin/scan">Scan a code</Link><Link className="button-secondary" href="/admin/auctions/new">Create auction</Link><Link className="button-primary" href="/admin/deals">Manage deals</Link></div></div>
    {query.notice === "kpi" && <p className="status-message" role="status">Manual figures saved.</p>}
    {query.issue === "kpi" && <p className="auth-message auth-error" role="alert">Manual figures could not be saved. Check the values and database setup.</p>}
    <section className="admin-section"><h2 className="section-title">Campus activity</h2>
      <div className="admin-kpi-list">
        <div><span>Deals completed</span><strong>{dealRows.filter((deal) => deal.status === "completed").length}</strong></div>
        <div><span>Average fill rate</span><strong>{fillRates.length ? `${Math.round(fillRates.reduce((sum, value) => sum + value, 0) / fillRates.length)}%` : "0%"}</strong></div>
        <div><span>Repeat joiners</span><strong>{repeatJoiners}</strong></div>
        <div><span>Total joiners</span><strong>{totalJoiners}</strong></div>
        <div><span>Joins this week</span><strong>{joinsThisWeek}</strong></div>
      </div>
    </section>
    <section className="admin-section"><h2 className="section-title">Manual figures</h2>
      {manualError || !manual ? <p className="admin-intro">Apply migration 002_admin_kpi_manual.sql to enable these fields.</p> : <form action={saveManualKpisAction} className="admin-kpi-form">
        <label className="form-field"><span>Instagram engagement</span><input className="form-input" defaultValue={manual.instagram_engagement} min={0} name="instagram_engagement" required type="number" /></label>
        <label className="form-field"><span>Sponsor leads</span><input className="form-input" defaultValue={manual.sponsor_leads} min={0} name="sponsor_leads" required type="number" /></label>
        <button className="button-secondary" type="submit">Save figures</button>
      </form>}
    </section>
    <section className="admin-section"><h2 className="section-title">Deal alerts</h2><TestPushButton /></section>
    <section className="admin-section">
      <div className="admin-heading-row"><h2 className="section-title">Pickup operations</h2><Link href="/admin/deals">All deals</Link></div>
      <p className="admin-intro">Open a delivered deal to scan pickup codes and review joiners.</p>
    </section>
    <section className="admin-section"><h2 className="section-title">Requests</h2><Link href="/admin/requests">View requested products</Link></section>
  </main>;
}
