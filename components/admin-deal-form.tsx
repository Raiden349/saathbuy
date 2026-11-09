import { saveAdminDealAction } from "@/app/actions/admin";
import type { Json } from "@/lib/database.types";

type Tier = { name: string; min_joiners: number; price: number };
type Deal = {
  id: string; title: string; description: string | null; image_url: string | null; category: string | null;
  retail_price: number; tiers: Json; max_qty_per_user: number; deadline: string; pickup_point_id: string | null;
  pickup_time: string | null; sponsor_name: string | null;
};

function pktInput(value: string | null | undefined) {
  if (!value) return "";
  return new Date(new Date(value).getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function tiersFrom(value: Json | undefined): Tier[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
    const tier = item as Record<string, Json>;
    return typeof tier.name === "string" && typeof tier.min_joiners === "number" && typeof tier.price === "number"
      ? [{ name: tier.name, min_joiners: tier.min_joiners, price: tier.price }]
      : [];
  });
}

export function AdminDealForm({ deal, points, wholesaleCost, issue }: {
  deal?: Deal; points: Array<{ id: string; name: string }>; wholesaleCost?: number; issue?: string;
}) {
  const tiers = tiersFrom(deal?.tiers);
  const tierCount = Math.max(1, tiers.length);
  return <form action={saveAdminDealAction} className="admin-deal-form">
    {deal && <input name="deal_id" type="hidden" value={deal.id} />}
    {issue && <p className="auth-message auth-error" role="alert">{issue === "time" ? "Choose a future deadline and a valid pickup time." : issue === "cost" ? "The deal was saved, but its wholesale cost needs to be saved again." : "Check the fields and try again."}</p>}
    <label className="form-field"><span>Product name</span><input className="form-input" defaultValue={deal?.title ?? ""} maxLength={120} name="title" required /></label>
    <label className="form-field"><span>Description</span><textarea className="form-input request-note" defaultValue={deal?.description ?? ""} maxLength={1000} name="description" rows={3} /></label>
    <div className="admin-form-grid">
      <label className="form-field"><span>Category</span><input className="form-input" defaultValue={deal?.category ?? ""} maxLength={40} name="category" /></label>
      <label className="form-field"><span>Retail price (Rs.)</span><input className="form-input" defaultValue={deal?.retail_price ?? ""} min={1} name="retail_price" required type="number" /></label>
      <label className="form-field"><span>Wholesale cost (Rs.)</span><input className="form-input" defaultValue={wholesaleCost ?? ""} min={1} name="wholesale_cost" required type="number" /></label>
      <label className="form-field"><span>Maximum packs per student</span><input className="form-input" defaultValue={deal?.max_qty_per_user ?? 3} min={1} max={10} name="max_qty_per_user" required type="number" /></label>
    </div>
    <label className="form-field"><span>Product image URL (optional)</span><input className="form-input" defaultValue={deal?.image_url ?? ""} name="image_url" type="url" /></label>
    <div className="admin-form-grid">
      <label className="form-field"><span>Deadline (Pakistan time)</span><input className="form-input" defaultValue={pktInput(deal?.deadline)} name="deadline" required type="datetime-local" /></label>
      <label className="form-field"><span>Sponsor name</span><input className="form-input" defaultValue={deal?.sponsor_name ?? ""} maxLength={120} name="sponsor_name" /></label>
      <label className="form-field"><span>Pickup point</span><select className="form-input" defaultValue={deal?.pickup_point_id ?? ""} name="pickup_point_id"><option value="">Choose a pickup point</option>{points.map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}</select></label>
      <label className="form-field"><span>Pickup time (Pakistan time)</span><input className="form-input" defaultValue={pktInput(deal?.pickup_time)} name="pickup_time" type="datetime-local" /></label>
    </div>
    <section className="admin-tier-editor">
      <h2 className="section-title">Price tiers</h2>
      <label className="form-field"><span>Number of tiers</span><select className="form-input" defaultValue={tierCount} name="tier_count"><option value="1">1 tier</option><option value="2">2 tiers</option><option value="3">3 tiers</option></select></label>
      {[0, 1, 2].map((index) => {
        const number = index + 1;
        const tier = tiers[index];
        return <fieldset className="admin-tier-row" key={number}><legend>Tier {number}{number > 1 ? " (optional)" : ""}</legend>
          <label className="form-field"><span>Name</span><input className="form-input" defaultValue={tier?.name ?? ["Bronze", "Silver", "Gold"][index]} maxLength={30} name={`tier_${number}_name`} required={number === 1} /></label>
          <label className="form-field"><span>Minimum joiners</span><input className="form-input" defaultValue={tier?.min_joiners ?? ""} min={1} name={`tier_${number}_min_joiners`} required={number === 1} type="number" /></label>
          <label className="form-field"><span>Price per pack (Rs.)</span><input className="form-input" defaultValue={tier?.price ?? ""} min={1} name={`tier_${number}_price`} required={number === 1} type="number" /></label>
        </fieldset>;
      })}
    </section>
    <p className="form-help">The deadline and pickup time use Pakistan time. Higher tiers need more joiners and have a lower price.</p>
    <button className="button-primary" type="submit">{deal ? "Save deal" : "Create deal"}</button>
  </form>;
}
