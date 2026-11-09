"use client";

import { useMemo, useState } from "react";
import type { DealSummary } from "@/components/deal-card";
import { DealCard } from "@/components/deal-card";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

export function HomeDeals({ deals }: { deals: DealSummary[] }) {
  const categories = useMemo(() => [...new Set(deals.map((deal) => deal.category).filter((value): value is string => Boolean(value)))].sort(), [deals]);
  const [selected, setSelected] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("closing");
  const isSearching = query.trim().length > 0;
  const filtered = useMemo(() => deals
    .filter((deal) => selected === "All" || deal.category === selected)
    .filter((deal) => `${deal.title} ${deal.description ?? ""} ${deal.category ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => sort === "popular" ? b.joiner_count - a.joiner_count : new Date(a.deadline).getTime() - new Date(b.deadline).getTime()), [deals, selected, query, sort]);

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
      <div className="deal-tools">
        <label className="deal-search"><Search aria-hidden="true" size={18} /><span className="sr-only">Search deals</span><input aria-label="Search deals" onChange={(event) => setQuery(event.target.value)} placeholder="Search campus deals" type="search" value={query} /></label>
        <label className="deal-sort"><SlidersHorizontal aria-hidden="true" size={16} /><span className="sr-only">Sort deals</span><select aria-label="Sort deals" onChange={(event) => setSort(event.target.value)} value={sort}><option value="closing">Closing soon</option><option value="popular">Most joined</option></select></label>
        <span className="deal-count">{filtered.length} {filtered.length === 1 ? "deal" : "deals"}</span>
      </div>
      {featured && !isSearching
        ? <DealCard deal={featured} featured />
        : null}
      {(isSearching ? filtered.length > 0 : others.length > 0) && (
        <section aria-label="More open deals" className="more-deals">
          <h2 className="section-title">{isSearching ? "Search results" : "Open wholesale pools"}</h2>
          <div className="deal-list">{(isSearching ? filtered : others).map((deal) => <DealCard deal={deal} key={deal.id} />)}</div>
        </section>
      )}
      {!featured && !isSearching && <p className="empty-state">No open deals in {selected} right now.</p>}
      {isSearching && filtered.length === 0 && <p className="empty-state">No open deals match your search. Try another item or request a deal.</p>}
      {featured && !isSearching && <aside className="campus-guarantee" aria-label="How SaathBuy works"><div><strong>Direct group buying</strong><span>Pool orders together for lower prices.</span></div><div><strong>Clear price tiers</strong><span>See the current price and next unlock.</span></div><div><strong>Pickup on campus</strong><span>Collect successful orders at the listed point.</span></div></aside>}
    </>
  );
}
