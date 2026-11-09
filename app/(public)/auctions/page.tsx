import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Gavel } from "lucide-react";
import { AuctionLiveCard } from "@/components/auction-live-card";
import { createClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-user";
import type { AuctionRow } from "@/lib/database.types";

type AuctionsPageProps = { searchParams: Promise<{ notice?: string }> };

const formatRs = (value: number) => `Rs. ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value)}`;

export default async function AuctionsPage({ searchParams }: AuctionsPageProps) {
  const params = await searchParams;
  const [supabase, user] = await Promise.all([createClient().catch(() => null), getRequestUser()]);
  if (!supabase) redirect("/login?issue=configuration");

  await supabase.rpc("settle_expired_auctions");
  const [{ data: auctionRows, error: auctionLoadError }, { data: profile }] = await Promise.all([
    supabase.from("auctions").select("*").order("created_at", { ascending: false }).limit(12),
    user ? supabase.from("profiles").select("points_balance, is_admin").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const auctions = (auctionRows ?? []) as AuctionRow[];
  const active = auctions.find((auction) => auction.status === "live");
  const ended = auctions.filter((auction) => auction.status === "ended");
  const isAdmin = profile?.is_admin === true;

  return (
    <main className="auction-main">
      <div className="auction-page-heading">
        <div><p className="eyebrow">SaathBuy community</p><h1 className="home-title">Auctions</h1><p className="home-subtitle">Use your points to lower the winner’s price on special campus picks.</p></div>
        {isAdmin && <Link className="button-secondary auction-admin-link" href="/admin/auctions/new">Create auction <ArrowUpRight aria-hidden="true" size={16} /></Link>}
      </div>
      {params.notice === "created" && <p className="status-message" role="status">Auction is live. Share it with your campus community.</p>}

      {auctionLoadError ? (
        <section className="auction-empty" role="status"><span className="auction-empty-icon"><Gavel aria-hidden="true" size={22} /></span><h2 className="section-title">Auctions are unavailable</h2><p>Please try again later. The SaathBuy admin may need to check the auction database setup.</p></section>
      ) : active ? (
        <AuctionLiveCard initialAuction={active} initialBalance={profile?.points_balance ?? 0} userId={user?.id ?? null} key={`${active.id}-${active.status}-${active.top_bid_points}-${active.bid_count}-${profile?.points_balance ?? 0}`} />
      ) : (
        <section className="auction-empty">
          <span className="auction-empty-icon"><Gavel aria-hidden="true" size={22} /></span>
          <h2 className="section-title">No live auction right now</h2>
          <p>Check back soon for a special campus auction. Your SaathBuy points will be ready when it opens.</p>
          {isAdmin && <Link className="button-primary" href="/admin/auctions/new">Create the first auction</Link>}
        </section>
      )}

      {ended.length > 0 && <section className="auction-history">
        <h2 className="section-title">Recently closed</h2>
        <div className="auction-history-list">{ended.map((auction) => <article className="auction-history-card" key={auction.id}>
          <div><p className="auction-kicker">Community auction · closed</p><h3>{auction.title}</h3><p>Top bid: {auction.top_bid_points} pts</p></div>
          <strong>{auction.final_price === null ? "No bids" : `${formatRs(auction.final_price)} paid`}</strong>
        </article>)}</div>
      </section>}
    </main>
  );
}
