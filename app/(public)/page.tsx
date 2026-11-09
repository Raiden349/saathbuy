import type { DealSummary } from "@/components/deal-card";
import { HomeDeals } from "@/components/home-deals";
import Link from "next/link";
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
  const deals = await getOpenDeals();
  return (
    <main className="home-main">
      <h1 className="home-title">Open deals on campus</h1>
      <Link className="home-request-link" href="/request">Request a deal</Link>
      {deals === null
        ? <p className="empty-state">Deals could not load right now. Refresh the page.</p>
        : <HomeDeals deals={deals} />}
    </main>
  );
}
