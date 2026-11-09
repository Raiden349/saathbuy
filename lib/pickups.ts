import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

export async function closeExpiredDealsIfNeeded(supabase: Client) {
  const { data: expired, error } = await supabase.from("deals")
    .select("id")
    .eq("status", "open")
    .lte("deadline", new Date().toISOString())
    .limit(1);
  if (error || expired.length > 0) await supabase.rpc("close_expired_deals");
}

export async function getMyPickups(supabase: Client, userId: string) {
  await closeExpiredDealsIfNeeded(supabase);
  const { data: joins, error: joinError } = await supabase
    .from("deal_joins")
    .select("id, deal_id, qty, amount_due, payment_method, payment_status, status, collected_at, created_at, deal:deals!deal_joins_deal_id_fkey!inner(id, slug, title, status, final_price, pickup_time, pickup:pickup_points!deals_pickup_point_id_fkey(id, name, description))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (joinError) throw joinError;
  return joins.map(({ deal, ...join }) => {
    const { pickup, ...dealFields } = deal;
    return { ...join, deal: dealFields, pickup: pickup ?? null };
  });
}

export function pickupStatus(dealStatus: string, joinStatus: string) {
  if (joinStatus === "collected") return "Collected";
  if (joinStatus === "failed" || dealStatus === "failed") return "Failed";
  if (dealStatus === "delivered") return "Ready";
  if (dealStatus === "completed") return "Collected";
  return "Waiting";
}
