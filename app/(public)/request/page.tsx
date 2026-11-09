import Link from "next/link";
import { redirect } from "next/navigation";
import { createRequestAction, toggleRequestVoteAction } from "@/app/actions/engagement";
import { createClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-user";

type RequestPageProps = { searchParams: Promise<{ issue?: string; notice?: string }> };

export default async function RequestPage({ searchParams }: RequestPageProps) {
  const query = await searchParams;
  const [supabase, user] = await Promise.all([createClient().catch(() => null), getRequestUser()]);
  if (!supabase) redirect("/login?issue=configuration");
  if (!user) redirect("/login?next=%2Frequest");
  const [{ data: requests, error }, { data: votes }] = await Promise.all([
    supabase.from("deal_requests").select("id, title, note, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("request_votes").select("request_id, user_id"),
  ]);
  const voteCounts = new Map<string, number>();
  const myVotes = new Set<string>();
  for (const vote of votes ?? []) {
    voteCounts.set(vote.request_id, (voteCounts.get(vote.request_id) ?? 0) + 1);
    if (vote.user_id === user.id) myVotes.add(vote.request_id);
  }
  const sorted = [...(requests ?? [])].sort((a, b) => (voteCounts.get(b.id) ?? 0) - (voteCounts.get(a.id) ?? 0) || b.created_at.localeCompare(a.created_at));

  return (
    <main className="request-main">
      <Link className="back-link" href="/">Deals</Link>
      <h1 className="home-title">Request a deal</h1>
      <p className="request-intro">Suggest a product for campus. Vote for the ones you want next.</p>
      {query.notice === "added" && <p className="status-message" role="status">Request added.</p>}
      {query.issue && <p className="auth-message auth-error" role="alert">{query.issue === "invalid" ? "Enter a product name and keep the note under 500 characters." : query.issue === "vote" ? "Your vote could not be saved. Try again." : "Your request could not be saved. Try again."}</p>}
      <form action={createRequestAction} className="request-form">
        <label className="form-field"><span>Product</span><input className="form-input" maxLength={100} name="title" placeholder="What should we find?" required /></label>
        <label className="form-field"><span>Details (optional)</span><textarea className="form-input request-note" maxLength={500} name="note" rows={3} /></label>
        <button className="button-primary" type="submit">Add request</button>
      </form>

      <section className="request-list-section">
        <h2 className="section-title">Requested products</h2>
        {error ? <p className="empty-state">Requests could not load right now. Refresh the page.</p>
          : sorted.length === 0 ? <p className="empty-state">No product requests yet. Add one above.</p>
            : <div className="request-list">{sorted.map((request) => {
              const voted = myVotes.has(request.id);
              return <article className="request-row" key={request.id}>
                <div className="request-copy"><h3>{request.title}</h3>{request.note && <p>{request.note}</p>}</div>
                <form action={toggleRequestVoteAction}>
                  <input name="request_id" type="hidden" value={request.id} />
                  <button aria-pressed={voted} className={`request-vote${voted ? " request-vote-selected" : ""}`} type="submit">{voteCounts.get(request.id) ?? 0} {voted ? "Voted" : "Vote"}</button>
                </form>
              </article>;
            })}</div>}
      </section>
    </main>
  );
}
