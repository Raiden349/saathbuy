import Link from "next/link";
import { redirect } from "next/navigation";
import { pickupStatus, getMyPickups } from "@/lib/pickups";
import { createClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-user";

export default async function PickupsPage() {
  const [supabase, user] = await Promise.all([createClient().catch(() => null), getRequestUser()]);
  if (!supabase) redirect("/login?issue=configuration&next=%2Fpickup");
  if (!user) redirect("/login?next=%2Fpickup");

  let pickups;
  try { pickups = await getMyPickups(supabase, user.id); }
  catch { pickups = null; }

  return (
    <main className="pickup-main">
      <h1 className="home-title">My pickups</h1>
      {pickups === null
        ? <p className="empty-state">Your pickups could not load right now. Refresh the page.</p>
        : pickups.length === 0
          ? <p className="empty-state">Your joined deals will appear here.</p>
          : <div className="pickup-list">
            {pickups.map((pickup) => {
              const status = pickupStatus(pickup.deal.status, pickup.status);
              return (
                <Link className="pickup-row" href={`/pickup/${pickup.id}`} key={pickup.id} prefetch={false}>
                  <span className="pickup-row-title">{pickup.deal.title}</span>
                  <span className={`pickup-status pickup-status-${status.toLowerCase()}`}>{status}</span>
                  <span className="pickup-row-meta">{pickup.qty} {pickup.qty === 1 ? "pack" : "packs"}{pickup.amount_due !== null ? ` · Rs. ${pickup.amount_due}` : ""}</span>
                </Link>
              );
            })}
          </div>}
    </main>
  );
}
