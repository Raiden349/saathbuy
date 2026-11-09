import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminRequestsPage() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/login?issue=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin%2Frequests");
  await supabase.rpc("close_expired_deals");
  const [{ data: requests, error }, { data: votes }] = await Promise.all([
    supabase.from("deal_requests").select("id, title, note, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("request_votes").select("request_id"),
  ]);
  const counts = new Map<string, number>();
  for (const vote of votes ?? []) counts.set(vote.request_id, (counts.get(vote.request_id) ?? 0) + 1);
  const sorted = [...(requests ?? [])].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || b.created_at.localeCompare(a.created_at));
  return <main className="admin-main">
    <Link className="back-link" href="/admin">Admin</Link><h1 className="admin-title">Requested products</h1>
    {error ? <p className="empty-state">Requests could not load right now. Refresh the page.</p>
      : sorted.length === 0 ? <p className="empty-state">No product requests yet.</p>
        : <div className="admin-request-list">{sorted.map((request) => <article className="admin-request-row" key={request.id}>
          <div><h2>{request.title}</h2>{request.note && <p>{request.note}</p>}</div><strong>{counts.get(request.id) ?? 0} votes</strong>
        </article>)}</div>}
  </main>;
}
