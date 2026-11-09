import { timingSafeEqual } from "node:crypto";
import { getDealPricing } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { configureWebPush, webpush } from "@/lib/web-push";

export const dynamic = "force-dynamic";

function authorized(value: string | null, secret: string | undefined) {
  if (!value || !secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(value);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!authorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!configureWebPush()) return Response.json({ error: "Push settings are not configured." }, { status: 500 });
  try {
    const admin = createAdminClient();
    const [{ data: deals, error: dealsError }, { data: subscriptions, error: subscriptionsError }] = await Promise.all([
      admin.from("deals").select("title, retail_price, tiers, joiner_count").eq("status", "open").order("deadline", { ascending: true }).limit(3),
      admin.from("push_subscriptions").select("id, endpoint, p256dh, auth"),
    ]);
    if (dealsError || subscriptionsError) return Response.json({ error: "Deal alerts could not load." }, { status: 500 });
    if (!deals?.length || !subscriptions?.length) return Response.json({ sent: 0, removed: 0 });
    const lines = deals.map((deal) => {
      const price = getDealPricing({ tiers: deal.tiers, joinerCount: deal.joiner_count, retailPrice: deal.retail_price }).currentPrice;
      return `${deal.title}: Rs. ${price}`;
    });
    const payload = JSON.stringify({ title: "New deals on campus", body: lines.join(". "), url: "/" });
    const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload);
        return "sent" as const;
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
          return "removed" as const;
        }
        return "failed" as const;
      }
    }));
    const counts = results.reduce((total, result) => {
      if (result.status === "fulfilled" && result.value === "sent") total.sent += 1;
      if (result.status === "fulfilled" && result.value === "removed") total.removed += 1;
      if (result.status === "rejected" || (result.status === "fulfilled" && result.value === "failed")) total.failed += 1;
      return total;
    }, { sent: 0, removed: 0, failed: 0 });
    return Response.json(counts);
  } catch {
    return Response.json({ error: "Deal alerts could not be sent." }, { status: 500 });
  }
}
