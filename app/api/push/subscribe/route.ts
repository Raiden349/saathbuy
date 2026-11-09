import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({ p256dh: z.string().min(1).max(512), auth: z.string().min(1).max(256) }),
});

export async function POST(request: Request) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Not signed in." }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });
  const body = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid subscription." }, { status: 400 });
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: body.data.endpoint,
      p256dh: body.data.keys.p256dh,
      auth: body.data.keys.auth,
    }, { onConflict: "endpoint" });
    if (error) return Response.json({ error: "Subscription could not be saved." }, { status: 500 });
    return Response.json({ subscribed: true });
  } catch {
    return Response.json({ error: "Push settings are not configured." }, { status: 500 });
  }
}
