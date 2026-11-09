"use client";

import { useState } from "react";

export function TestPushButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const send = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const result = await response.json();
      setMessage(response.ok ? "Test alert sent to this browser." : result.error || "The test alert could not be sent.");
    } catch {
      setMessage("The test alert could not be sent. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return <div className="admin-test-push"><button className="button-secondary" disabled={busy} onClick={send} type="button">{busy ? "Sending…" : "Send test push"}</button>{message && <p className="form-help" role="status">{message}</p>}</div>;
}
