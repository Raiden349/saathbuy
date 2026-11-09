import type { DealTier } from "@/lib/pricing";
import { getDealPricing, parseDealTiers } from "@/lib/pricing";

export function TierLadder({ tiers, joinerCount, retailPrice }: { tiers: unknown; joinerCount: number; retailPrice: number }) {
  const parsedTiers = parseDealTiers(tiers);
  const { currentTier } = getDealPricing({ tiers: parsedTiers, joinerCount, retailPrice });

  return (
    <div className="tier-ladder" aria-label="Deal price tiers">
      {parsedTiers.map((tier: DealTier) => {
        const reached = joinerCount >= tier.min_joiners;
        const current = currentTier?.name === tier.name;
        return (
          <div className={`tier-row${current ? " tier-current" : ""}${reached ? " tier-reached" : " tier-locked"}`} key={tier.name}>
            <span aria-hidden="true" className="tier-dot" />
            <span className="tier-name">{tier.name}</span>
            <span className="tier-min">from {tier.min_joiners} joiners</span>
            <span className="tier-price">Rs. {tier.price}</span>
          </div>
        );
      })}
    </div>
  );
}
