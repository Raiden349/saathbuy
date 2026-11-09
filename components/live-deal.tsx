"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/countdown";
import { SlotRow } from "@/components/slot-row";
import { TierLadder } from "@/components/tier-ladder";
import { DealPhoto } from "@/components/deal-card";
import { createClient } from "@/lib/supabase/client";
import { getDealPricing } from "@/lib/pricing";
import type { DealSummary } from "@/components/deal-card";

type DealDetailData = DealSummary & { pickup_time: string | null; pickup: string | null; pickup_description: string | null };

export function LiveDeal({ deal }: { deal: DealDetailData }) {
  const [joinerCount, setJoinerCount] = useState(deal.joiner_count);
  const pricing = getDealPricing({
    tiers: deal.tiers,
    joinerCount,
    retailPrice: deal.retail_price,
    status: deal.status,
    finalPrice: deal.final_price,
    finalTier: deal.final_tier,
  });

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`deal-progress-${deal.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "deals", filter: `id=eq.${deal.id}` }, (payload) => {
        const nextCount = payload.new.joiner_count;
        if (typeof nextCount === "number") setJoinerCount(nextCount);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [deal.id]);

  const statusCopy: Record<string, string> = {
    confirmed: `Deal confirmed. Everyone pays Rs. ${deal.final_price ?? pricing.currentPrice} each.`,
    failed: "Not enough joiners by the deadline. You were not charged and your points are back.",
    delivered: `Deal confirmed. Everyone pays Rs. ${deal.final_price ?? pricing.currentPrice} each. Pickup details are ready.`,
    completed: `Deal confirmed. Everyone pays Rs. ${deal.final_price ?? pricing.currentPrice} each.`,
  };
  const open = deal.status === "open";

  return (
    <main className="detail-main">
      <Link className="back-link" href="/">Deals</Link>
      <DealPhoto deal={deal} featured detail />
      <div className="detail-heading">
        <div>
          {deal.category && <p className="detail-category">{deal.category}</p>}
          <h1 className="detail-title">{deal.title}</h1>
        </div>
        <p className="detail-price">Rs. {pricing.currentPrice}<span> / pack</span></p>
      </div>
      <p className="detail-retail">Retail price {pricing.currentTier ? <s>Rs. {deal.retail_price}</s> : <span>Rs. {deal.retail_price}</span>}</p>
      {pricing.currentTier && open && <p className="savings-chip">You save Rs. {Math.max(0, deal.retail_price - pricing.currentPrice)} ({Math.max(0, Math.round((deal.retail_price - pricing.currentPrice) * 100 / deal.retail_price))}%) at this price</p>}
      {deal.description && <p className="detail-description">{deal.description}</p>}
      {statusCopy[deal.status]
        ? <p className={`status-message status-${deal.status}`} role="status">{statusCopy[deal.status]}</p>
        : <div className="detail-progress"><SlotRow tiers={deal.tiers} count={joinerCount} initialCount={deal.joiner_count} /><Countdown deadline={deal.deadline} /></div>}
      <section className="detail-section">
        <h2 className="section-title">Group price</h2>
        <TierLadder tiers={deal.tiers} joinerCount={joinerCount} retailPrice={deal.retail_price} />
      </section>
      <section className="detail-section detail-pickup">
        <h2 className="section-title">Pickup</h2>
        <p>{deal.pickup ?? "Pickup details will be shared if the deal succeeds."}</p>
        {deal.pickup_description && <p>{deal.pickup_description}</p>}
        {deal.pickup_time && <p>{new Intl.DateTimeFormat("en-PK", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(deal.pickup_time))}</p>}
      </section>
      {open && (
        <div className="detail-sticky-action">
          <div><span className="sticky-price">Rs. {pricing.currentPrice}</span><span className="sticky-caption"> You pay the best price reached at the deadline.</span></div>
          <Link className="button-primary sticky-join" href={`/deals/${deal.slug}/join`}>Join this deal</Link>
        </div>
      )}
    </main>
  );
}
