import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/login?issue=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin");

  const { data: deals, error } = await supabase
    .from("deals")
    .select("id, title, status, deadline, joiner_count, final_price")
    .in("status", ["confirmed", "delivered"])
    .order("deadline", { ascending: true });

  return (
    <main className="admin-main">
      <div className="admin-heading-row"><h1 className="home-title">Pickup admin</h1><Link className="button-secondary" href="/admin/scan">Scan a code</Link></div>
      <p className="admin-intro">Mark delivered deals, then scan each student&apos;s pickup code.</p>
      {error
        ? <p className="empty-state">Admin deals could not load right now. Refresh the page.</p>
        : deals.length === 0
          ? <p className="empty-state">No deals are ready for pickup.</p>
          : <div className="admin-list">
            {deals.map((deal) => (
              <Link className="admin-row" href={`/admin/deals/${deal.id}`} key={deal.id}>
                <span className="admin-row-title">{deal.title}</span>
                <span className="admin-row-meta">{deal.joiner_count} joiners · {deal.status}{deal.final_price ? ` · Rs. ${deal.final_price}` : ""}</span>
              </Link>
            ))}
          </div>}
    </main>
  );
}
