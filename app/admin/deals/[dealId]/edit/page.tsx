import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminDealForm } from "@/components/admin-deal-form";
import { createClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-user";
import { closeExpiredDealsIfNeeded } from "@/lib/pickups";

export default async function EditAdminDealPage({ params, searchParams }: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ issue?: string }>;
}) {
  const [{ dealId }, query] = await Promise.all([params, searchParams]);
  const [supabase, user] = await Promise.all([createClient().catch(() => null), getRequestUser()]);
  if (!supabase) redirect("/login?issue=configuration");
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/deals/${dealId}/edit`)}`);
  await closeExpiredDealsIfNeeded(supabase);
  const [{ data: deal }, { data: pickupPoints }, { data: cost }] = await Promise.all([
    supabase.from("deals").select("id, title, description, image_url, category, retail_price, tiers, max_qty_per_user, deadline, pickup_point_id, pickup_time, sponsor_name, status").eq("id", dealId).maybeSingle(),
    supabase.from("pickup_points").select("id, name").eq("active", true).order("name"),
    supabase.from("deal_costs").select("wholesale_cost").eq("deal_id", dealId).maybeSingle(),
  ]);
  if (!deal) notFound();
  if (deal.status !== "open") return <main className="admin-main"><Link className="back-link" href={`/admin/deals/${dealId}`}>Deal</Link><h1 className="admin-title">This deal can no longer be edited</h1><p className="admin-intro">Only open deals can be changed.</p></main>;
  return <main className="admin-main admin-form-main">
    <Link className="back-link" href={`/admin/deals/${dealId}`}>Deal details</Link>
    <h1 className="admin-title">Edit deal</h1>
    <AdminDealForm deal={deal} issue={query.issue} points={pickupPoints ?? []} wholesaleCost={cost?.wholesale_cost} />
  </main>;
}
