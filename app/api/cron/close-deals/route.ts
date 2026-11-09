import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

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
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("close_expired_deals");
    if (error) return Response.json({ error: "Deal closing failed." }, { status: 500 });
    return Response.json({ closed: data });
  } catch {
    return Response.json({ error: "Deal closing is not configured." }, { status: 500 });
  }
}
