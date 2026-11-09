"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function decodeKey(value: string) {
  const padded = `${value}${"=".repeat((4 - value.length % 4) % 4)}`;
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export function EnableDealAlerts({ signedIn }: { signedIn: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const enable = async () => {
    if (!signedIn) { router.push("/login?next=%2F"); return; }
    if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Deal alerts are not available in this browser yet.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setMessage("Allow notifications in your browser settings to get deal alerts."); return; }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(vapidKey) });
      const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error("subscribe");
      setMessage("Deal alerts are on.");
    } catch {
      setMessage("Deal alerts could not be enabled. Try again from this browser.");
    } finally {
      setBusy(false);
    }
  };

  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const installed = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  return <section className="deal-alerts" aria-label="Deal alerts">
    <div><strong>Deal drops</strong><p>Get a message when new deals open on Thursday at 5 pm.</p>
      {isIos && !installed && <p className="form-help">On iPhone, add SaathBuy to your Home Screen before enabling alerts.</p>}
      {message && <p className="form-help" role="status">{message}</p>}
    </div>
    <button className="button-secondary" disabled={busy} onClick={enable} type="button">{busy ? "Enabling…" : "Enable deal alerts"}</button>
  </section>;
}
