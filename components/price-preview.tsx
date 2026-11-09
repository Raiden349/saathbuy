"use client";

import { useState } from "react";
import { getDealPricing, parseDealTiers } from "@/lib/pricing";

export function PricePreview({ tiers, joinerCount, retailPrice }: { tiers: unknown; joinerCount: number; retailPrice: number }) {
  const [extraStudents, setExtraStudents] = useState(0);
  const parsed = parseDealTiers(tiers);
  const largestTier = parsed.at(-1)?.min_joiners ?? joinerCount;
  const maxPreview = Math.max(0, largestTier - joinerCount);
  const preview = getDealPricing({ tiers: parsed, joinerCount: joinerCount + extraStudents, retailPrice });
  const current = getDealPricing({ tiers: parsed, joinerCount, retailPrice });

  return (
    <section aria-label="Price preview" className="price-preview">
      <div className="price-preview-copy">
        <strong>Preview if more students join</strong>
        <span>This changes the preview only. Live pool count stays at {joinerCount}.</span>
      </div>
      <div aria-label="Additional students in price preview" className="preview-stepper">
        <button aria-label="Remove one student from preview" disabled={extraStudents === 0} onClick={() => setExtraStudents((count) => Math.max(0, count - 1))} type="button">−</button>
        <output aria-live="polite">+{extraStudents}</output>
        <button aria-label="Add one student to preview" disabled={extraStudents >= maxPreview} onClick={() => setExtraStudents((count) => Math.min(maxPreview, count + 1))} type="button">+</button>
      </div>
      {extraStudents > 0 && <p aria-live="polite" className="preview-result">With {joinerCount + extraStudents} students: <strong>Rs. {preview.currentPrice}</strong> / pack{preview.currentPrice < current.currentPrice && <span> · Rs. {current.currentPrice - preview.currentPrice} less</span>}</p>}
    </section>
  );
}
