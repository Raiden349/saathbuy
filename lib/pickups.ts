import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

export async function getMyPickups(supabase: Client, userId: string) {
  await supabase.rpc("close_expired_deals");
  const { data: joins, error: joinError } = await supabase
    .from("deal_joins")
    .select("id, deal_id, qty, amount_due, payment_method, payment_status, status, collected_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (joinError) throw joinError;
  if (!joins.length) return [];

  const dealIds = [...new Set(joins.map((join) => join.deal_id))];
  const { data: deals, error: dealError } = await supabase
    .from("deals")
    .select("id, slug, title, status, final_price, pickup_point_id, pickup_time")
    .in("id", dealIds);
  if (dealError) throw dealError;

  const pickupIds = [...new Set(deals.map((deal) => deal.pickup_point_id).filter((id): id is string => Boolean(id)))];
  const { data: points, error: pickupError } = pickupIds.length
    ? await supabase.from("pickup_points").select("id, name, description").in("id", pickupIds)
    : { data: [], error: null };
  if (pickupError) throw pickupError;

  const dealMap = new Map(deals.map((deal) => [deal.id, deal]));
  const pointMap = new Map((points ?? []).map((point) => [point.id, point]));
  return joins.flatMap((join) => {
    const deal = dealMap.get(join.deal_id);
    if (!deal) return [];
    const point = deal.pickup_point_id ? pointMap.get(deal.pickup_point_id) : null;
    return [{ ...join, deal, pickup: point ?? null }];
  });
}

export function pickupStatus(dealStatus: string, joinStatus: string) {
  if (joinStatus === "collected") return "Collected";
  if (joinStatus === "failed" || dealStatus === "failed") return "Failed";
  if (dealStatus === "delivered") return "Ready";
  if (dealStatus === "completed") return "Collected";
  return "Waiting";
}
