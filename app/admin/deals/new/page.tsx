import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDealForm } from "@/components/admin-deal-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewAdminDealPage({ searchParams }: { searchParams: Promise<{ issue?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/login?issue=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin%2Fdeals%2Fnew");
  await supabase.rpc("close_expired_deals");
  const { data: points } = await supabase.from("pickup_points").select("id, name").eq("active", true).order("name");
  return <main className="admin-main admin-form-main">
    <Link className="back-link" href="/admin/deals">Deals</Link>
    <h1 className="admin-title">Create a deal</h1>
    <AdminDealForm issue={query.issue} points={points ?? []} />
  </main>;
}
