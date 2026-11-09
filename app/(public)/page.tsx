import type { DealSummary } from "@/components/deal-card";
import { HomeDeals } from "@/components/home-deals";
import Link from "next/link";
import { EnableDealAlerts } from "@/components/enable-deal-alerts";
import { createClient } from "@/lib/supabase/server";

async function getOpenDeals(): Promise<DealSummary[] | null> {
  try {
    const supabase = await createClient();
    await supabase.rpc("close_expired_deals");
    const { data, error } = await supabase
      .from("deals")
      .select("id, slug, title, description, image_url, category, retail_price, tiers, max_qty_per_user, deadline, status, joiner_count, final_tier, final_price")
      .eq("status", "open")
      .order("deadline", { ascending: true });
    if (error) return null;
    return data as DealSummary[];
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [deals, signedIn] = await Promise.all([
    getOpenDeals(),
    createClient().then(async (client) => Boolean((await client.auth.getUser()).data.user)).catch(() => false),
  ]);
  return (
    <main className="home-main">
      <p className="eyebrow">SaathBuy campus pools</p>
      <div className="home-heading-row"><div><h1 className="home-title">Better prices, together.</h1><p className="home-subtitle">Join a campus deal with other students. As more people join, the group price can drop.</p></div><Link className="home-request-link" href="/request">Request a deal <span aria-hidden="true">↗</span></Link></div>
      <EnableDealAlerts signedIn={signedIn} />
      {deals === null
        ? <p className="empty-state">Deals could not load right now. Refresh the page.</p>
        : <HomeDeals deals={deals} />}
    </main>
  );
}
