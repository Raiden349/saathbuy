"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { adminDealSchema, manualKpiSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function toKarachiIso(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}:00+05:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function makeSlug(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return base || `deal-${randomUUID().slice(0, 8)}`;
}

export async function saveAdminDealAction(formData: FormData) {
  const parsed = adminDealSchema.safeParse(values(formData));
  const returnPath = parsed.success && parsed.data.deal_id ? `/admin/deals/${parsed.data.deal_id}/edit` : "/admin/deals/new";
  if (!parsed.success) redirect(`${returnPath}?issue=invalid`);
  const deadline = toKarachiIso(parsed.data.deadline);
  const pickupTime = toKarachiIso(parsed.data.pickup_time);
  if (!deadline || new Date(deadline).getTime() <= Date.now() || (parsed.data.pickup_time && !pickupTime)) redirect(`${returnPath}?issue=time`);
  const tiers = [1, 2, 3].slice(0, parsed.data.tier_count).map((index) => ({
    name: parsed.data[`tier_${index}_name` as "tier_1_name"],
    min_joiners: parsed.data[`tier_${index}_min_joiners` as "tier_1_min_joiners"],
    price: parsed.data[`tier_${index}_price` as "tier_1_price"],
  }));
  const supabase = await createClient();
  let dealId = parsed.data.deal_id;
  const dealValues = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    image_url: parsed.data.image_url ?? null,
    category: parsed.data.category ?? null,
    retail_price: parsed.data.retail_price,
    tiers,
    max_qty_per_user: parsed.data.max_qty_per_user,
    deadline,
    pickup_point_id: parsed.data.pickup_point_id ?? null,
    pickup_time: pickupTime,
    sponsor_name: parsed.data.sponsor_name ?? null,
  };

  if (dealId) {
    const { error } = await supabase.from("deals").update(dealValues).eq("id", dealId).eq("status", "open");
    if (error) redirect(`${returnPath}?issue=save`);
  } else {
    const { data, error } = await supabase.from("deals").insert({ ...dealValues, slug: makeSlug(parsed.data.title) }).select("id").single();
    if (error || !data) redirect(`${returnPath}?issue=save`);
    dealId = data.id;
  }
  const { error: costError } = await supabase.from("deal_costs").upsert({ deal_id: dealId, wholesale_cost: parsed.data.wholesale_cost });
  if (costError) redirect(`${dealId ? `/admin/deals/${dealId}/edit` : "/admin/deals"}?issue=cost`);
  redirect(`/admin/deals/${dealId}?notice=saved`);
}

export async function saveManualKpisAction(formData: FormData) {
  const parsed = manualKpiSchema.safeParse(values(formData));
  if (!parsed.success) redirect("/admin?issue=kpi");
  const supabase = await createClient();
  const { error } = await supabase.from("kpi_manual").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) redirect("/admin?issue=kpi");
  redirect("/admin?notice=kpi");
}
