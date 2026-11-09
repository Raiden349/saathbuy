"use client";

import { useMemo, useState } from "react";
import type { DealSummary } from "@/components/deal-card";
import { DealCard } from "@/components/deal-card";
import Link from "next/link";

export function HomeDeals({ deals }: { deals: DealSummary[] }) {
  const categories = useMemo(() => [...new Set(deals.map((deal) => deal.category).filter((value): value is string => Boolean(value)))].sort(), [deals]);
  const [selected, setSelected] = useState("All");
  const filtered = useMemo(() => deals
    .filter((deal) => selected === "All" || deal.category === selected)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()), [deals, selected]);

  if (deals.length === 0) {
    return <div className="home-empty"><p className="empty-state">No open deals right now. Request one and the most-voted product goes up next.</p><Link className="button-secondary" href="/request">Request a deal</Link></div>;
  }

  const [featured, ...others] = filtered;
  return (
    <>
      <div className="category-chips" aria-label="Filter deals by category">
        {["All", ...categories].map((category) => (
          <button
            aria-pressed={selected === category}
            className={`category-chip${selected === category ? " category-chip-selected" : ""}`}
            key={category}
            onClick={() => setSelected(category)}
            type="button"
          >{category}</button>
        ))}
      </div>
      {featured
        ? <DealCard deal={featured} featured />
        : <p className="empty-state">No open deals in {selected} right now.</p>}
      {others.length > 0 && (
        <section aria-label="More open deals" className="more-deals">
          <h2 className="section-title">More open deals</h2>
          <div className="deal-list">{others.map((deal) => <DealCard deal={deal} key={deal.id} />)}</div>
        </section>
      )}
    </>
  );
}
