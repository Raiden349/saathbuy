import type { DealTier } from "@/lib/pricing";
import { getDealPricing } from "@/lib/pricing";

export function SlotRow({
  tiers,
  count,
  variant = "detail",
  initialCount,
}: {
  tiers: unknown;
  count: number;
  variant?: "detail" | "compact" | "small";
  initialCount?: number;
}) {
  const { currentTier, nextTier } = getDealPricing({ tiers, joinerCount: count, retailPrice: 0 });
  const sortedTiers = Array.isArray(tiers) ? tiers as DealTier[] : [];
  const maximum = sortedTiers.reduce((value, tier) => Math.max(value, Number(tier.min_joiners) || 0), 0);
  const goal = variant === "detail" ? maximum : (nextTier?.min_joiners ?? maximum);
  const total = Math.max(1, Math.min(goal, 30));
  const compact = variant !== "detail";
  const remaining = total - Math.min(count, total);

  return (
    <div className={`slot-row slot-row-${variant}`}>
      <div className="slot-list" role="img" aria-label={`${Math.min(count, total)} of ${total} joined`}>
        {Array.from({ length: total }, (_, index) => {
          const isFilled = index < count;
          const animate = initialCount !== undefined && count > initialCount && index === count - 1;
          return <span aria-hidden="true" className={`slot${isFilled ? " slot-filled" : ""}${animate ? " slot-new" : ""}`} key={index} />;
        })}
      </div>
      <p className="slot-copy">
        {count} of {total} joined
        {compact && nextTier && <span className="slot-unlock"> · {remaining} more joiners for {nextTier.name} (Rs. {nextTier.price})</span>}
        {!compact && currentTier && <span className="slot-unlock"> · {currentTier.name}</span>}
      </p>
    </div>
  );
}
