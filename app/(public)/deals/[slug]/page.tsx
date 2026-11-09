import { notFound } from "next/navigation";
import { LiveDeal } from "@/components/live-deal";
import type { DealSummary } from "@/components/deal-card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type DealPageProps = { params: Promise<{ slug: string }> };

async function getDeal(slug: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("close_expired_deals");
    const { data, error } = await supabase
      .from("deals")
      .select("id, slug, title, description, image_url, category, retail_price, tiers, max_qty_per_user, deadline, status, joiner_count, final_tier, final_price, pickup_point_id, pickup_time")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;

    let pickup: { name: string; description: string | null } | null = null;
    if (data.pickup_point_id) {
      const { data: pickupData } = await supabase.from("pickup_points").select("name, description").eq("id", data.pickup_point_id).maybeSingle();
      pickup = pickupData;
    }

    let activeJoin: { id: string; qty: number } | null = null;
    const { data: { user } } = await supabase.auth.getUser();
    let referralCount = 0;
    if (user) {
      const { data: join } = await supabase
        .from("deal_joins")
        .select("id, qty, status")
        .eq("deal_id", data.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (join?.status === "joined") activeJoin = { id: join.id, qty: join.qty };
      try {
        const admin = createAdminClient();
        const { count } = await admin.from("deal_joins").select("id", { count: "exact", head: true }).eq("deal_id", data.id).eq("referred_by", user.id).in("status", ["joined", "collected"]);
        referralCount = count ?? 0;
      } catch { referralCount = 0; }
    }

    const deal = {
      ...(data as DealSummary),
      pickup_time: data.pickup_time,
      pickup: pickup?.name ?? null,
      pickup_description: pickup?.description ?? null,
      active_join: activeJoin,
      referralCount,
      referrerId: user?.id ?? null,
    };
    return deal;
  } catch {
    return null;
  }
}

export default async function DealPage({ params, searchParams }: DealPageProps & { searchParams: Promise<{ notice?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const deal = await getDeal(slug);
  if (!deal) notFound();
  return <LiveDeal deal={deal} notice={query.notice} />;
}
