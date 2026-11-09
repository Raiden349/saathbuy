"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock3, Gavel, Sparkles, Users } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { placeAuctionBidAction } from "@/app/actions/auctions";
import type { AuctionRow } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

type AuctionLiveCardProps = {
  initialAuction: AuctionRow;
  initialBalance: number;
  userId: string | null;
};

const formatRs = (value: number) => `Rs. ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value)}`;

function timeLeft(endsAt: string, now: number | null) {
  if (now === null) return "Loading timer";
  const seconds = Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
}

export function AuctionLiveCard({ initialAuction, initialBalance, userId }: AuctionLiveCardProps) {
  const [auction, setAuction] = useState(initialAuction);
  const [pointsBalance, setPointsBalance] = useState(initialBalance);
  const [bidPoints, setBidPoints] = useState(String(initialAuction.top_bid_points + initialAuction.min_bid_increment));
  const [now, setNow] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const refreshedAtEnd = useRef(false);
  const leading = userId !== null && userId === auction.top_bidder_id;
  const isSignedIn = userId !== null;
  const minimumBid = auction.top_bid_points + auction.min_bid_increment;
  const availableToBid = pointsBalance + (leading ? auction.top_bid_points : 0);
  const maxBid = Math.min(auction.starting_price - 1, availableToBid);
  const winnerPays = auction.starting_price - auction.top_bid_points;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`auction-${auction.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "auctions", filter: `id=eq.${auction.id}` }, (payload) => {
        const updatedAuction = payload.new as AuctionRow;
        setAuction(updatedAuction);
        setBidPoints((current) => String(Math.max(Number(current) || 0, updatedAuction.top_bid_points + updatedAuction.min_bid_increment)));
        router.refresh();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [auction.id, router]);

  useEffect(() => {
    if (now !== null && new Date(auction.ends_at).getTime() <= now && auction.status === "live" && !refreshedAtEnd.current) {
      refreshedAtEnd.current = true;
      router.refresh();
    }
  }, [auction.ends_at, auction.status, now, router]);

  function submitBid(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await placeAuctionBidAction({ auction_id: auction.id, points: Number(bidPoints) });
      setMessage(result.message);
      setMessageIsError(!result.ok);
      if (result.ok) {
        setAuction(result.auction);
        setPointsBalance(result.pointsBalance);
        setBidPoints(String(result.auction.top_bid_points + result.auction.min_bid_increment));
      }
    });
  }

  const ended = auction.status !== "live" || (now !== null && new Date(auction.ends_at).getTime() <= now);

  return (
    <article className="auction-card">
      <div className="auction-banner"><Sparkles aria-hidden="true" size={22} /><span>Community Auction</span><span className="auction-banner-status"><i />{ended ? "Auction ended" : "Live · shared"}</span></div>
      <div className="auction-content">
        <p className="auction-kicker">Live points auction</p>
        <h2 className="auction-title">{auction.title}</h2>
        <p className="auction-description">{auction.description || "Community auction. Your points reduce the winner’s checkout price."}</p>
        {auction.image_url && <Image alt={auction.title} className="auction-product-image" height={360} src={auction.image_url} unoptimized width={1000} />}

        <div className="auction-stats">
          <div className="auction-stat"><span>Starting price</span><strong>{formatRs(auction.starting_price)}</strong></div>
          <div className="auction-stat"><span>Top bid</span><strong>{auction.top_bid_points} pts</strong></div>
          <div className="auction-stat auction-stat-price"><span>Winner pays</span><strong>{formatRs(winnerPays)}</strong></div>
        </div>

        <div className="auction-countdown"><span><Clock3 aria-hidden="true" size={18} /> Time left</span><strong>{ended ? "Closed" : timeLeft(auction.ends_at, now)}</strong></div>
        <div className="auction-activity"><span><Users aria-hidden="true" size={17} /> {auction.bid_count} {auction.bid_count === 1 ? "bid" : "bids"} placed</span>{leading && <strong>You’re leading</strong>}</div>

        {ended ? (
          <div className="auction-result" role="status">
            {auction.winner_id ? auction.winner_id === auction.top_bidder_id && leading ? `You won and pay ${formatRs(auction.final_price ?? winnerPays)}.` : `Auction closed. The winning price is ${formatRs(auction.final_price ?? winnerPays)}.` : "Auction closed with no bids."}
          </div>
        ) : isSignedIn ? (
          <form className="auction-bid-form" onSubmit={submitBid}>
          <label className="form-field" htmlFor={`bid-points-${auction.id}`}>
              <span>Your bid in points</span>
              <input autoComplete="off" className="form-input" id={`bid-points-${auction.id}`} inputMode="numeric" max={maxBid} min={minimumBid} onChange={(event) => setBidPoints(event.target.value)} required type="number" value={bidPoints} />
            </label>
            <p className="auction-bid-help">You have {pointsBalance} points available · minimum next bid {minimumBid} pts</p>
            {message && <p className={`auction-form-message${messageIsError ? " auth-error" : ""}`} role={messageIsError ? "alert" : "status"}>{message}</p>}
            <button className="button-primary auction-bid-button" disabled={pending || maxBid < minimumBid} type="submit"><Gavel aria-hidden="true" size={18} />{pending ? "Placing bid…" : `Bid ${bidPoints || minimumBid} points`}</button>
            {leading && <p className="auction-bid-help">Your current leading bid is held. If someone outbids you, those points return to your balance.</p>}
          </form>
        ) : (
          <div className="auction-sign-in"><p>Sign in to bid with your SaathBuy points.</p><Link className="button-primary" href="/login?next=%2Fauctions">Log in to bid</Link></div>
        )}
      </div>
    </article>
  );
}
