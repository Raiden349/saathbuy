import Link from "next/link";
import { redirect } from "next/navigation";
import { collectPickupAction } from "@/app/actions/collection";
import { CameraScanner } from "@/components/camera-scanner";
import { parsePickupQrInput, verifyPickupQr } from "@/lib/qr-token";
import { createClient } from "@/lib/supabase/server";

type ScanPageProps = { searchParams: Promise<{ code?: string; join_id?: string; sig?: string; issue?: string; notice?: string }> };

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PK", { timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(value));
}

function scanCopy(issue: string | undefined) {
  if (issue === "collect") return "This join is not ready for pickup or was already collected.";
  if (issue === "invalid") return "Code not recognized. Ask the student to reopen their pickup page.";
  return "";
}

export default async function AdminScanPage({ searchParams }: ScanPageProps) {
  const query = await searchParams;
  const token = query.code
    ? parsePickupQrInput(query.code)
    : query.join_id && query.sig
      ? parsePickupQrInput(`${query.join_id}.${query.sig}`)
      : null;
  const validSignature = token ? verifyPickupQr(token.joinId, token.signature) : false;

  let result: {
    join: { id: string; qty: number; amount_due: number | null; service_fee: number; payment_method: string; payment_status: string; status: string; collected_at: string | null };
    deal: { id: string; slug: string; title: string; status: string };
    studentName: string;
  } | null = null;

  if (validSignature && token) {
    const supabase = await createClient().catch(() => null);
    if (!supabase) redirect("/login?issue=configuration");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=%2Fadmin%2Fscan");

    const { data: join, error: joinError } = await supabase
      .from("deal_joins")
      .select("id, deal_id, user_id, qty, amount_due, service_fee, payment_method, payment_status, status, collected_at")
      .eq("id", token.joinId)
      .maybeSingle();
    if (join && !joinError) {
      const [{ data: deal }, { data: profile }] = await Promise.all([
        supabase.from("deals").select("id, slug, title, status").eq("id", join.deal_id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", join.user_id).maybeSingle(),
      ]);
      if (deal) result = { join, deal, studentName: profile?.full_name || "Student" };
    }
  }

  const invalidCode = Boolean(token && !validSignature) || Boolean(validSignature && !result);
  const pointsEarned = result?.join.amount_due === null || !result
    ? 0
    : Math.max(0, Math.floor((result.join.amount_due - result.join.service_fee) / 10));
  const isReady = result?.deal.status === "delivered" && result.join.status === "joined" && result.join.amount_due !== null;

  return (
    <main className="admin-main">
      <Link className="back-link" href="/admin">Pickup admin</Link>
      <h1 className="admin-title">Scan a pickup code</h1>
      <CameraScanner />
      <form action="/admin/scan" className="scan-manual" method="get">
        <label className="form-field"><span>Enter or paste the code</span>
          <input autoComplete="off" className="form-input" name="code" placeholder="Paste the full pickup code or link" required />
        </label>
        <p className="form-help">The eight-character code under the QR is a quick reference. Manual lookup needs the full code or QR link.</p>
        <button className="button-secondary" type="submit">Check code</button>
      </form>
      {invalidCode && <p className="auth-message auth-error" role="alert">Code not recognized. Ask the student to reopen their pickup page.</p>}
      {!invalidCode && query.issue && <p className="auth-message auth-error" role="alert">{scanCopy(query.issue)}</p>}
      {result && (
        <section aria-label="Pickup verification" className="scan-result">
          <h2 className="section-title">Pickup details</h2>
          <div className="admin-facts">
            <div><span>Student</span><strong>{result.studentName}</strong></div>
            <div><span>Deal</span><strong>{result.deal.title}</strong></div>
            <div><span>Quantity</span><strong>{result.join.qty} {result.join.qty === 1 ? "pack" : "packs"}</strong></div>
            <div><span>Amount due</span><strong>{result.join.amount_due === null ? "Pending" : `Rs. ${result.join.amount_due}`}</strong></div>
            <div><span>Payment method</span><strong>{result.join.payment_method === "wallet" ? "Wallet" : "Cash at pickup"}</strong></div>
          </div>
          {isReady && <form action={collectPickupAction} className="admin-action">
            <input name="deal_id" type="hidden" value={result.deal.id} />
            <input name="join_id" type="hidden" value={result.join.id} />
            <input name="signature" type="hidden" value={token!.signature} />
            <button className="button-primary" type="submit">Collect and mark paid</button>
          </form>}
          {result.join.status === "collected" && result.join.amount_due !== null && (
            <p className="status-message" role="status">
              {query.notice === "collected"
                ? `Collected. Rs. ${result.join.amount_due} paid. ${pointsEarned} points added.`
                : `Already collected${result.join.collected_at ? ` at ${formatTime(result.join.collected_at)}` : ""}.`}
            </p>
          )}
          {!isReady && result.join.status !== "collected" && <p className="status-message">This join is not ready for pickup.</p>}
          <Link className="back-link" href={`/admin/deals/${result.deal.id}`}>Back to deal</Link>
        </section>
      )}
    </main>
  );
}
