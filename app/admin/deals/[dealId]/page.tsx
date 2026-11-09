import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { markCompletedAction, markDeliveredAction } from "@/app/actions/collection";
import { createClient } from "@/lib/supabase/server";

type AdminDealProps = { params: Promise<{ dealId: string }>; searchParams: Promise<{ issue?: string; notice?: string }> };

export default async function AdminDealPage({ params, searchParams }: AdminDealProps) {
  const [{ dealId }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/login?issue=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/deals/${dealId}`)}`);

  await supabase.rpc("close_expired_deals");
  const { data: deal, error } = await supabase
    .from("deals")
    .select("id, title, status, deadline, joiner_count, final_tier, final_price, pickup_point_id, pickup_time")
    .eq("id", dealId)
    .maybeSingle();
  if (error || !deal) notFound();

  const { data: joins } = await supabase
    .from("deal_joins")
    .select("id, user_id, qty, amount_due, payment_method, payment_status, status")
    .eq("deal_id", deal.id)
    .in("status", ["joined", "collected"])
    .order("created_at", { ascending: true });
  const profileIds = [...new Set((joins ?? []).map((join) => join.user_id))];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const { data: pickup } = deal.pickup_point_id
    ? await supabase.from("pickup_points").select("name, description").eq("id", deal.pickup_point_id).maybeSingle()
    : { data: null };

  return (
    <main className="admin-main">
      <Link className="back-link" href="/admin">Pickup admin</Link>
      <h1 className="admin-title">{deal.title}</h1>
      <div className="admin-facts">
        <div><span>Status</span><strong>{deal.status}</strong></div>
        <div><span>Joiners</span><strong>{deal.joiner_count}</strong></div>
        {deal.final_tier && <div><span>Final tier</span><strong>{deal.final_tier}</strong></div>}
        {deal.final_price && <div><span>Final price</span><strong>Rs. {deal.final_price}</strong></div>}
        {pickup && <div><span>Pickup point</span><strong>{pickup.name}</strong></div>}
        {deal.pickup_time && <div><span>Pickup time</span><strong>{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(deal.pickup_time))}</strong></div>}
      </div>
      {query.notice === "delivered" && <p className="status-message" role="status">Deal marked delivered. Students can show their pickup codes.</p>}
      {query.notice === "completed" && <p className="status-message" role="status">Deal marked complete.</p>}
      {query.issue === "delivery" && <p className="auth-message auth-error" role="alert">This deal could not be marked delivered. Check its status and try again.</p>}
      {query.issue === "complete" && <p className="auth-message auth-error" role="alert">This deal could not be marked complete. Refresh and check its status.</p>}
      {deal.status === "open" && <Link className="button-secondary admin-edit-link" href={`/admin/deals/${deal.id}/edit`}>Edit deal</Link>}
      {deal.status === "confirmed" && <form action={markDeliveredAction} className="admin-action"><input name="deal_id" type="hidden" value={deal.id} /><button className="button-primary" type="submit">Mark delivered</button></form>}
      {deal.status === "delivered" && <p className="admin-intro">Scan each pickup code to mark it collected and paid. The deal completes when every join is collected.</p>}
      {deal.status === "delivered" && <form action={markCompletedAction} className="admin-action"><input name="deal_id" type="hidden" value={deal.id} /><button className="button-secondary" type="submit">Mark complete</button></form>}
      <section className="admin-section">
        <h2 className="section-title">Joiners</h2>
        <div className="admin-table" role="table" aria-label="Deal joiners">
          <div className="admin-table-head" role="row"><span role="columnheader">Student</span><span role="columnheader">Qty</span><span role="columnheader">Amount due</span><span role="columnheader">Payment</span><span role="columnheader">Status</span></div>
          {(joins ?? []).map((join) => (
            <div className="admin-table-row" key={join.id} role="row">
              <span role="cell">{profileMap.get(join.user_id) || "Student"}</span>
              <span role="cell">{join.qty}</span>
              <span role="cell">{join.amount_due === null ? "—" : `Rs. ${join.amount_due}`}</span>
              <span role="cell">{join.payment_method === "wallet" ? "Wallet" : "Cash"}</span>
              <span role="cell">{join.status === "collected" ? "Collected" : deal.status === "delivered" ? "Ready" : "Waiting"}</span>
            </div>
          ))}
          {(joins ?? []).length === 0 && <p className="empty-state">No joined students yet.</p>}
        </div>
      </section>
    </main>
  );
}
