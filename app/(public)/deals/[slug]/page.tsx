import { notFound } from "next/navigation";
import { LiveDeal } from "@/components/live-deal";
import type { DealSummary } from "@/components/deal-card";
import { createClient } from "@/lib/supabase/server";

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

    return {
      ...(data as DealSummary),
      pickup_time: data.pickup_time,
      pickup: pickup?.name ?? null,
      pickup_description: pickup?.description ?? null,
    };
  } catch {
    return null;
  }
}

export default async function DealPage({ params }: DealPageProps) {
  const { slug } = await params;
  const deal = await getDeal(slug);
  if (!deal) notFound();
  return <LiveDeal deal={deal} />;
}
