export type DealTier = {
  name: string;
  min_joiners: number;
  price: number;
};

export type DealPricing = {
  currentTier: DealTier | null;
  nextTier: DealTier | null;
  currentPrice: number;
  remainingJoiners: number;
  finalPrice: number | null;
  finalTier: string | null;
};

export function parseDealTiers(value: unknown): DealTier[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tier): tier is Record<string, unknown> => typeof tier === "object" && tier !== null)
    .map((tier) => ({
      name: typeof tier.name === "string" ? tier.name : "",
      min_joiners: Number(tier.min_joiners),
      price: Number(tier.price),
    }))
    .filter((tier) => tier.name && Number.isInteger(tier.min_joiners) && tier.min_joiners > 0 && Number.isInteger(tier.price) && tier.price > 0)
    .sort((a, b) => a.min_joiners - b.min_joiners);
}

export function getDealPricing(input: {
  tiers: unknown;
  joinerCount: number;
  retailPrice: number;
  status?: string;
  finalPrice?: number | null;
  finalTier?: string | null;
}): DealPricing {
  const tiers = parseDealTiers(input.tiers);
  const joinerCount = Math.max(0, Math.floor(input.joinerCount));
  const currentTier = [...tiers].reverse().find((tier) => tier.min_joiners <= joinerCount) ?? null;
  const nextTier = tiers.find((tier) => tier.min_joiners > joinerCount) ?? null;
  const closedPrice = input.status && input.status !== "open" && Number.isInteger(input.finalPrice) && Number(input.finalPrice) > 0
    ? Number(input.finalPrice)
    : null;

  return {
    currentTier,
    nextTier,
    currentPrice: closedPrice ?? currentTier?.price ?? input.retailPrice,
    remainingJoiners: nextTier ? Math.max(0, nextTier.min_joiners - joinerCount) : 0,
    finalPrice: closedPrice,
    finalTier: input.finalTier ?? null,
  };
}
