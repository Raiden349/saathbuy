import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { SlotRow } from "@/components/slot-row";
import { getDealPricing } from "@/lib/pricing";
import { PricePreview } from "@/components/price-preview";

export type DealSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  retail_price: number;
  tiers: unknown;
  max_qty_per_user: number;
  deadline: string;
  status: string;
  joiner_count: number;
  final_tier: string | null;
  final_price: number | null;
};

function validDealImage(value: string | null) {
  if (!value) return null;
  try {
    const image = new URL(value);
    const project = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
    return project && image.origin === project.origin && image.pathname.startsWith("/storage/v1/object/public/") ? image.toString() : null;
  } catch { return null; }
}

export function DealPhoto({ deal, featured = false, detail = false }: { deal: DealSummary; featured?: boolean; detail?: boolean }) {
  const src = validDealImage(deal.image_url);
  return (
    <div className={`deal-photo${featured ? " deal-photo-featured" : ""}${detail ? " deal-photo-detail" : ""}`}>
      {src
        ? <Image alt={deal.title} src={src} fill sizes={featured ? "(max-width: 767px) 100vw, 640px" : "(max-width: 767px) 72px, 112px"} />
        : <span>{deal.category ?? "SaathBuy"}</span>}
    </div>
  );
}

export function DealCard({ deal, featured }: { deal: DealSummary; featured?: boolean }) {
  const pricing = getDealPricing({
    tiers: deal.tiers,
    joinerCount: deal.joiner_count,
    retailPrice: deal.retail_price,
    status: deal.status,
    finalPrice: deal.final_price,
    finalTier: deal.final_tier,
  });

  if (featured) {
    return (
      <article className="featured-deal">
        <div className="featured-link">
          <Link aria-label={`View ${deal.title}`} className="featured-photo-link" href={`/deals/${deal.slug}`} prefetch={false}><DealPhoto deal={deal} featured /></Link>
          <div className="featured-content">
            <h2 className="featured-title">{deal.title}</h2>
            <div className="price-line">
              <span className="price-current">Rs. {pricing.currentPrice}</span>
              {pricing.currentTier && <span className="price-retail">Rs. {deal.retail_price}</span>}
              <Countdown deadline={deal.deadline} compact />
            </div>
            <SlotRow tiers={deal.tiers} count={deal.joiner_count} variant="compact" />
            <PricePreview tiers={deal.tiers} joinerCount={deal.joiner_count} retailPrice={deal.retail_price} />
            <Link className="featured-action" href={`/deals/${deal.slug}`} prefetch={false}>View deal <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="deal-list-row">
      <Link className="deal-row-link" href={`/deals/${deal.slug}`} prefetch={false}>
        <DealPhoto deal={deal} />
        <div className="deal-row-copy">
          <h2 className="deal-row-title">{deal.title}</h2>
          <div className="deal-row-meta">
            <span className="price-current price-current-small">Rs. {pricing.currentPrice}</span>
            {pricing.currentTier && <span className="price-retail">Rs. {deal.retail_price}</span>}
            <Countdown deadline={deal.deadline} compact />
          </div>
          <SlotRow tiers={deal.tiers} count={deal.joiner_count} variant="compact" />
        </div>
      </Link>
    </article>
  );
}
