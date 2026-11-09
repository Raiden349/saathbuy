"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cancelJoinSchema, joinDealSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function joinIssue(message: string) {
  if (message.includes("ended") || message.includes("open")) return "ended";
  if (message.includes("up to") || message.includes("at least one")) return "quantity";
  if (message.includes("points")) return "points";
  if (message.includes("transaction ID")) return "wallet";
  if (message.includes("already joined")) return "already";
  return "failed";
}

export async function joinDealAction(formData: FormData) {
  const slugValue = String(formData.get("deal_slug") ?? "");
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue) ? slugValue : "";
  const parsed = joinDealSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect(slug ? `/deals/${slug}/join?issue=invalid` : "/");

  const supabase = await createClient();
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id")
    .eq("slug", parsed.data.deal_slug)
    .maybeSingle();
  if (dealError || !deal) redirect(`/deals/${parsed.data.deal_slug}/join?issue=ended`);

  const cookieStore = await cookies();
  const referrerValue = cookieStore.get("ref")?.value;
  const referrer = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(referrerValue ?? "")
    ? referrerValue!
    : null;
  const { error } = await supabase.rpc("join_deal", {
    p_deal: deal.id,
    p_qty: parsed.data.qty,
    p_points: parsed.data.points_redeemed,
    p_method: parsed.data.payment_method,
    p_wallet_ref: parsed.data.payment_method === "wallet" ? parsed.data.wallet_reference ?? null : null,
    p_referrer: referrer,
  });
  if (error) redirect(`/deals/${parsed.data.deal_slug}/join?issue=${joinIssue(error.message)}`);
  cookieStore.delete("ref");
  redirect(`/deals/${parsed.data.deal_slug}?notice=joined`);
}

export async function cancelJoinAction(formData: FormData) {
  const parsed = cancelJoinSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_join", { p_join: parsed.data.join_id });
  if (error) redirect(`/deals/${parsed.data.deal_slug}?notice=cancel-failed`);
  redirect(`/deals/${parsed.data.deal_slug}?notice=cancelled`);
}
