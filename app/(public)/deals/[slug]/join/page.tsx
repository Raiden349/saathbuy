import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import { getDealPricing } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";

type JoinPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ issue?: string }>;
};

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect(`/login?next=${encodeURIComponent(`/deals/${slug}/join`)}`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/deals/${slug}/join`)}`);

  await supabase.rpc("close_expired_deals");
  const { data: deal, error } = await supabase
    .from("deals")
    .select("id, slug, title, retail_price, tiers, max_qty_per_user, deadline, status, joiner_count, final_price, final_tier")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !deal) notFound();
  if (deal.status !== "open") {
    return (
      <main className="join-main">
        <Link className="back-link" href={`/deals/${slug}`}>Back to deal</Link>
        <h1 className="auth-title">This deal ended</h1>
        <p className="empty-state">This deal ended. Pick another open deal.</p>
      </main>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("points_balance, free_fee_credits").eq("id", user.id).maybeSingle();
  const pricing = getDealPricing({ tiers: deal.tiers, joinerCount: deal.joiner_count, retailPrice: deal.retail_price });

  return (
    <main className="join-main">
      <Link className="back-link" href={`/deals/${slug}`}>Back to deal</Link>
      <h1 className="auth-title">Join this deal</h1>
      <p className="join-deal-title">{deal.title}</p>
      <p className="join-current-price">Rs. {pricing.currentPrice} <span>per pack at this price</span></p>
      <JoinForm
        currentPrice={pricing.currentPrice}
        freeFeeCredits={profile?.free_fee_credits ?? 0}
        issue={query.issue}
        maxQuantity={deal.max_qty_per_user}
        pointsBalance={profile?.points_balance ?? 0}
        slug={deal.slug}
      />
    </main>
  );
}
