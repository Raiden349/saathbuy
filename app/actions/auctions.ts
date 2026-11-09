"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAuctionSchema, auctionBidSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-user";

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function karachiDateToIso(value: string) {
  const date = new Date(`${value}:00+05:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createAuctionAction(formData: FormData) {
  const parsed = adminAuctionSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/admin/auctions/new?issue=invalid");
  const endsAt = karachiDateToIso(parsed.data.ends_at);
  if (!endsAt || new Date(endsAt).getTime() <= Date.now()) redirect("/admin/auctions/new?issue=time");

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_auction", {
    p_title: parsed.data.title,
    p_description: parsed.data.description ?? null,
    p_image_url: parsed.data.image_url ?? null,
    p_starting_price: parsed.data.starting_price,
    p_min_bid_increment: parsed.data.min_bid_increment,
    p_ends_at: endsAt,
  });
  if (error) redirect("/admin/auctions/new?issue=save");
  revalidatePath("/auctions");
  redirect("/auctions?notice=created");
}

export async function placeAuctionBidAction(input: { auction_id: string; points: number }) {
  const parsed = auctionBidSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Enter a valid bid amount." };
  const [supabase, user] = await Promise.all([createClient(), getRequestUser()]);
  if (!user) return { ok: false as const, message: "Sign in to place a bid." };

  const { data: auction, error } = await supabase.rpc("bid_on_auction", {
    p_auction: parsed.data.auction_id,
    p_points: parsed.data.points,
  });
  if (error || !auction) return { ok: false as const, message: error?.message ?? "Your bid could not be placed. Refresh and try again." };

  const { data: profile } = await supabase.from("profiles").select("points_balance").eq("id", user.id).maybeSingle();
  revalidatePath("/auctions");
  return {
    ok: true as const,
    message: "Your bid is live. Your points are held while you lead.",
    auction,
    pointsBalance: profile?.points_balance ?? 0,
  };
}
