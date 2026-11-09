import Link from "next/link";
import { redirect } from "next/navigation";
import { createAuctionAction } from "@/app/actions/auctions";

type NewAuctionPageProps = { searchParams: Promise<{ issue?: string }> };

export default async function NewAuctionPage({ searchParams }: NewAuctionPageProps) {
  const { issue } = await searchParams;
  const issueCopy: Record<string, string> = {
    invalid: "Check the title, optional description and image, price, bid step, and closing time.",
    time: "Choose a closing time in the future.",
    save: "Auction could not be created. Confirm the auction database migration is applied and you have admin access.",
  };
  if (issue && !issueCopy[issue]) redirect("/admin/auctions/new");

  return (
    <main className="admin-main admin-form-main">
      <Link className="back-link" href="/admin">← Admin</Link>
      <h1 className="home-title">Create a community auction</h1>
      <p className="admin-intro">Set the campus item, opening price, points step and closing time. Closing time uses Pakistan Standard Time.</p>
      {issue && <p className="auth-message auth-error" role="alert">{issueCopy[issue]}</p>}
      <form action={createAuctionAction} className="admin-form auction-admin-form">
        <label className="form-field"><span>Item name</span><input autoComplete="off" className="form-input" maxLength={120} name="title" placeholder="SaathBuy Laptop" required /></label>
        <label className="form-field"><span>Description</span><textarea className="form-input admin-textarea" maxLength={1000} name="description" placeholder="Community auction. Your points reduce the winner’s checkout price." rows={3} /></label>
        <label className="form-field"><span>Image URL (optional)</span><input className="form-input" name="image_url" placeholder="https://…" type="url" /></label>
        <div className="admin-form-grid">
          <label className="form-field"><span>Starting price (Rs.)</span><input className="form-input" min={2} max={1000000} name="starting_price" required type="number" /></label>
          <label className="form-field"><span>Minimum bid increase (points)</span><input className="form-input" defaultValue={1} min={1} max={100000} name="min_bid_increment" required type="number" /></label>
        </div>
          <label className="form-field"><span>Closes at (PKT)</span><input className="form-input" name="ends_at" required type="datetime-local" /></label>
        <p className="form-help">One point lowers the winner’s payable amount by Rs. 1. The leading bid is held; it is returned if someone outbids it.</p>
        <button className="button-primary" type="submit">Open auction</button>
      </form>
    </main>
  );
}
