import assert from "node:assert/strict";
import test from "node:test";
import { getDealPricing, parseDealTiers } from "./pricing.ts";

const tiers = [
  { name: "Bronze", min_joiners: 5, price: 570 },
  { name: "Silver", min_joiners: 10, price: 520 },
  { name: "Gold", min_joiners: 20, price: 470 },
];

test("uses retail price until the first tier is reached", () => {
  const pricing = getDealPricing({ tiers, joinerCount: 2, retailPrice: 650 });
  assert.equal(pricing.currentPrice, 650);
  assert.equal(pricing.currentTier, null);
  assert.equal(pricing.nextTier?.name, "Bronze");
  assert.equal(pricing.remainingJoiners, 3);
});

test("selects the highest reached tier and next target", () => {
  const pricing = getDealPricing({ tiers, joinerCount: 12, retailPrice: 650 });
  assert.equal(pricing.currentPrice, 520);
  assert.equal(pricing.currentTier?.name, "Silver");
  assert.equal(pricing.nextTier?.name, "Gold");
  assert.equal(pricing.remainingJoiners, 8);
});

test("uses stored final price for a closed deal", () => {
  const pricing = getDealPricing({ tiers, joinerCount: 13, retailPrice: 650, status: "confirmed", finalPrice: 520, finalTier: "Silver" });
  assert.equal(pricing.currentPrice, 520);
  assert.equal(pricing.finalTier, "Silver");
});

test("ignores malformed tiers and clamps the joiner count", () => {
  assert.deepEqual(parseDealTiers([{ name: "bad", min_joiners: 0, price: 1 }, { name: "Bronze", min_joiners: 5, price: 570 }]), [tiers[0]]);
  const pricing = getDealPricing({ tiers, joinerCount: -4, retailPrice: 650 });
  assert.equal(pricing.remainingJoiners, 5);
});
