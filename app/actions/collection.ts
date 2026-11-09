"use server";

import { redirect } from "next/navigation";
import { collectJoinSchema, dealIdSchema } from "@/lib/schemas";
import { verifyPickupQr } from "@/lib/qr-token";
import { createClient } from "@/lib/supabase/server";

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function markDeliveredAction(formData: FormData) {
  const parsed = dealIdSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/admin?issue=invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_delivered", { p_deal: parsed.data.deal_id });
  if (error) redirect(`/admin/deals/${parsed.data.deal_id}?issue=delivery`);
  redirect(`/admin/deals/${parsed.data.deal_id}?notice=delivered`);
}

export async function markCompletedAction(formData: FormData) {
  const parsed = dealIdSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/admin/deals?issue=invalid");
  const supabase = await createClient();
  const { error } = await supabase.from("deals").update({ status: "completed" }).eq("id", parsed.data.deal_id).eq("status", "delivered");
  if (error) redirect(`/admin/deals/${parsed.data.deal_id}?issue=complete`);
  redirect(`/admin/deals/${parsed.data.deal_id}?notice=completed`);
}

export async function collectPickupAction(formData: FormData) {
  const parsed = collectJoinSchema.safeParse(formValues(formData));
  if (!parsed.success || !verifyPickupQr(parsed.data.join_id, parsed.data.signature)) redirect("/admin/scan?issue=invalid");

  const supabase = await createClient();
  const { error } = await supabase.rpc("collect_join", { p_join: parsed.data.join_id });
  const query = `join_id=${encodeURIComponent(parsed.data.join_id)}&sig=${encodeURIComponent(parsed.data.signature)}`;
  if (error) redirect(`/admin/scan?${query}&issue=collect`);
  redirect(`/admin/scan?${query}&notice=collected`);
}
