import { notFound } from "next/navigation";
import { LiveDeal } from "@/components/live-deal";
import type { DealSummary } from "@/components/deal-card";
import { createClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-user";

type DealPageProps = { params: Promise<{ slug: string }> };

async function getDeal(slug: string) {
  try {
    const supabase = await createClient();
    const [{ data, error }, user] = await Promise.all([supabase
      .from("deals")
      .select("id, slug, title, description, image_url, category, retail_price, tiers, max_qty_per_user, deadline, status, joiner_count, final_tier, final_price, pickup_point_id, pickup_time, pickup:pickup_points!deals_pickup_point_id_fkey(name, description)")
      .eq("slug", slug)
      .maybeSingle(), getRequestUser()]);
    if (error || !data) return null;

    const joinResult = user
      ? await supabase.from("deal_joins").select("id, qty, status").eq("deal_id", data.id).eq("user_id", user.id).maybeSingle()
      : { data: null };
    const activeJoin = joinResult.data?.status === "joined" ? { id: joinResult.data.id, qty: joinResult.data.qty } : null;
    const pickup = data.pickup;

    const deal = {
      ...(data as DealSummary),
      pickup_time: data.pickup_time,
      pickup: pickup?.name ?? null,
      pickup_description: pickup?.description ?? null,
      active_join: activeJoin,
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
