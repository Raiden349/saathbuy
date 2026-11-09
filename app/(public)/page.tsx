import type { DealSummary } from "@/components/deal-card";
import { HomeDeals } from "@/components/home-deals";
import Link from "next/link";
import { EnableDealAlerts } from "@/components/enable-deal-alerts";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getRequestUser } from "@/lib/supabase/request-user";

async function getOpenDeals(supabase: SupabaseClient<Database>): Promise<DealSummary[] | null> {
  try {
    const { data, error } = await supabase
      .from("deals")
      .select("id, slug, title, description, image_url, category, retail_price, tiers, max_qty_per_user, deadline, status, joiner_count, final_tier, final_price")
      .eq("status", "open")
      .gt("deadline", new Date().toISOString())
      .order("deadline", { ascending: true });
    if (error) return null;
    return data as DealSummary[];
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [supabase, user] = await Promise.all([createClient().catch(() => null), getRequestUser()]);
  const deals = supabase ? await getOpenDeals(supabase) : null;
  return (
    <main className="home-main">
      <p className="eyebrow">SaathBuy campus pools</p>
      <div className="home-heading-row"><div><h1 className="home-title">Buy together, Save together</h1><p className="home-subtitle">Join a campus deal with other students. As more people join, the group price can drop.</p></div><Link className="home-request-link" href="/request" prefetch={false}>Request a deal <span aria-hidden="true">↗</span></Link></div>
      <EnableDealAlerts signedIn={Boolean(user)} />
      {deals === null
        ? <p className="empty-state">Deals could not load right now. Refresh the page.</p>
        : <HomeDeals deals={deals} />}
    </main>
  );
}
