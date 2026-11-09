import Link from "next/link";
import { redirect } from "next/navigation";
import { ShareButton } from "@/components/share-button";
import { getDealPricing } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-user";
import { closeExpiredDealsIfNeeded } from "@/lib/pickups";

export default async function RewardsPage() {
  const [supabase, user] = await Promise.all([createClient().catch(() => null), getRequestUser()]);
  if (!supabase) redirect("/login?issue=configuration");
  if (!user) redirect("/login?next=%2Frewards");

  await closeExpiredDealsIfNeeded(supabase);
  const [{ data: profile }, { data: ledger }, { data: deals }] = await Promise.all([
    supabase.from("profiles").select("points_balance, streak_weeks, free_fee_credits").eq("id", user.id).maybeSingle(),
    supabase.from("points_ledger").select("id, delta, reason, join_id, created_at, joined_deal:deal_joins!points_ledger_join_id_fkey(deal:deals!deal_joins_deal_id_fkey(title))").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("deals").select("id, slug, title, retail_price, tiers, joiner_count").eq("status", "open").gt("deadline", new Date().toISOString()).order("deadline", { ascending: true }).limit(8),
  ]);
  const balance = profile?.points_balance ?? 0;
  const progress = Math.min(balance, 100);
  return (
    <main className="rewards-main">
      <h1 className="home-title">Rewards</h1>
      <section className="rewards-balance" aria-label="Points balance">
        <p className="rewards-number">{balance}<span> points</span></p>
        <div className="points-progress" role="progressbar" aria-label={`${progress} of 100 points toward Rs. 50`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="form-help">{balance >= 100 ? "Redeem 100 points for Rs. 50 off on your next join." : `${100 - balance} more points for Rs. 50 off.`}</p>
      </section>

      <section className="rewards-section">
        <h2 className="section-title">Your streak</h2>
        <div className="streak-slots" role="img" aria-label={`${profile?.streak_weeks ?? 0} of 3 weeks`}>
          {[0, 1, 2].map((week) => <span aria-hidden="true" className={`slot${week < (profile?.streak_weeks ?? 0) ? " slot-filled" : ""}`} key={week} />)}
        </div>
        <p className="rewards-copy">{profile?.streak_weeks ?? 0} of 3 weeks</p>
        <p className="rewards-copy">Free-fee credits: {profile?.free_fee_credits ?? 0}</p>
      </section>

      <section className="rewards-section">
        <div className="section-heading-row"><h2 className="section-title">Points history</h2><Link href="/request">Request a deal</Link></div>
        {(ledger ?? []).length === 0
          ? <p className="empty-state">No points yet. You earn 1 point for every Rs. 10 you spend, added after pickup.</p>
          : <div className="points-ledger">{ledger!.map((entry) => {
            const title = entry.join_id ? entry.joined_deal?.deal?.title : null;
            return <div className="points-ledger-row" key={entry.id}>
              <div><strong>{entry.reason === "earned" ? "Earned" : entry.reason === "redeemed" ? "Redeemed" : entry.reason === "refund" ? "Refund" : "Bonus"}</strong><span>{title ?? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" }).format(new Date(entry.created_at))}</span></div>
              <strong className={entry.delta < 0 ? "points-negative" : ""}>{entry.delta > 0 ? "+" : ""}{entry.delta}</strong>
            </div>;
          })}</div>}
      </section>

      {process.env.NEXT_PUBLIC_SITE_URL && (deals ?? []).length > 0 && <section className="rewards-section">
        <h2 className="section-title">Invite friends</h2>
        <div className="rewards-share-list">{deals!.map((deal) => {
          const price = getDealPricing({ tiers: deal.tiers, joinerCount: deal.joiner_count, retailPrice: deal.retail_price }).currentPrice;
          return <div className="rewards-share-row" key={deal.id}><span>{deal.title}</span><ShareButton title={deal.title} slug={deal.slug} price={price} siteUrl={process.env.NEXT_PUBLIC_SITE_URL!} referrerId={user.id} /></div>;
        })}</div>
      </section>}
    </main>
  );
}
