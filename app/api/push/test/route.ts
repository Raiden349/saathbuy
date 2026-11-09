import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { configureWebPush, webpush } from "@/lib/web-push";

export async function POST() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Sign in as an admin first." }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in as an admin first." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return Response.json({ error: "Admin access is required." }, { status: 403 });
  if (!configureWebPush()) return Response.json({ error: "Push settings are not configured." }, { status: 503 });
  try {
    const admin = createAdminClient();
    const { data: subscription } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", user.id).limit(1).maybeSingle();
    if (!subscription) return Response.json({ error: "Enable deal alerts in this browser first." }, { status: 404 });
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: "SaathBuy test alert", body: "Deal alerts are working in this browser.", url: "/" }));
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", subscription.id);
      return Response.json({ error: "The test alert could not be delivered. Enable alerts again and retry." }, { status: 502 });
    }
    return Response.json({ sent: true });
  } catch {
    return Response.json({ error: "The test alert could not be sent." }, { status: 500 });
  }
}
