import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDealsPage() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/login?issue=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin%2Fdeals");
  await supabase.rpc("close_expired_deals");
  const { data: deals, error } = await supabase.from("deals")
    .select("id, title, status, deadline, joiner_count, final_price")
    .order("created_at", { ascending: false });
  return <main className="admin-main">
    <div className="admin-heading-row"><div><Link className="back-link" href="/admin">Admin</Link><h1 className="admin-title">Deals</h1></div><Link className="button-primary" href="/admin/deals/new">Create a deal</Link></div>
    {error ? <p className="empty-state">Deals could not load right now. Refresh the page.</p>
      : deals.length === 0 ? <p className="empty-state">No deals yet. Create the first campus deal.</p>
        : <div className="admin-list">{deals.map((deal) => <Link className="admin-row" href={`/admin/deals/${deal.id}`} key={deal.id}>
          <span className="admin-row-title">{deal.title}</span>
          <span className="admin-row-meta">{deal.status}, {deal.joiner_count} joiners, {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" }).format(new Date(deal.deadline))}{deal.final_price ? `, Rs. ${deal.final_price}` : ""}</span>
        </Link>)}</div>}
  </main>;
}
