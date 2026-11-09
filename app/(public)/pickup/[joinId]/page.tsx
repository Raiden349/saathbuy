import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PickupQrCode } from "@/components/qr-code";
import { createPickupQr } from "@/lib/qr-token";
import { getMyPickups, pickupStatus } from "@/lib/pickups";
import { createClient } from "@/lib/supabase/server";

type PickupDetailProps = { params: Promise<{ joinId: string }> };

function formatPickupTime(value: string) {
  return new Intl.DateTimeFormat("en-PK", { weekday: "long", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(value));
}

export default async function PickupDetailPage({ params }: PickupDetailProps) {
  const { joinId } = await params;
  let supabase;
  try { supabase = await createClient(); }
  catch { redirect(`/login?next=${encodeURIComponent(`/pickup/${joinId}`)}`); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/pickup/${joinId}`)}`);

  let pickups;
  try { pickups = await getMyPickups(supabase, user.id); }
  catch { notFound(); }
  const pickup = pickups.find((item) => item.id === joinId);
  if (!pickup) notFound();

  const status = pickupStatus(pickup.deal.status, pickup.status);
  const qr = pickup.deal.status === "delivered" && pickup.status === "joined" ? createPickupQr(pickup.id) : null;
  const readyCopy = status === "Ready" && pickup.pickup
    ? `Ready at ${pickup.pickup.name}, ${pickup.deal.pickup_time ? formatPickupTime(pickup.deal.pickup_time) : "pickup time to be confirmed"}. Show this code.`
    : null;

  return (
    <main className="pickup-main pickup-detail-main">
      <Link className="back-link" href="/pickup">My pickups</Link>
      <h1 className="home-title">{pickup.deal.title}</h1>
      <div className="pickup-detail-row"><span>Status</span><span className={`pickup-status pickup-status-${status.toLowerCase()}`}>{status}</span></div>
      <div className="pickup-detail-row"><span>Quantity</span><span>{pickup.qty} {pickup.qty === 1 ? "pack" : "packs"}</span></div>
      {pickup.amount_due !== null && <div className="pickup-detail-row"><span>Amount due</span><span>Rs. {pickup.amount_due}</span></div>}
      {pickup.pickup && <div className="pickup-detail-row"><span>Pickup point</span><span>{pickup.pickup.name}</span></div>}
      {pickup.pickup?.description && <p className="pickup-description">{pickup.pickup.description}</p>}
      {pickup.deal.pickup_time && <div className="pickup-detail-row"><span>Pickup time</span><span>{formatPickupTime(pickup.deal.pickup_time)}</span></div>}
      {status === "Waiting" && <p className="status-message">Pickup opens once the supplier delivers. We will show the place and time here.</p>}
      {status === "Failed" && <p className="status-message">Not enough joiners by the deadline. You were not charged and your points are back.</p>}
      {status === "Collected" && <p className="status-message">Collected{pickup.collected_at ? ` at ${formatPickupTime(pickup.collected_at)}` : ""}.</p>}
      {status === "Ready" && <>
        <p className="pickup-ready-copy">{readyCopy}</p>
        {qr
          ? <div className="qr-card"><PickupQrCode label={`Pickup code for ${pickup.deal.title}`} value={qr.text} /><p className="qr-short-code">{qr.shortCode}</p></div>
          : <p className="auth-message auth-error" role="alert">Your pickup code is unavailable. Ask the SaathBuy admin to check the site settings.</p>}
      </>}
    </main>
  );
}
