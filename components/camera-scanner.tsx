"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CameraScanner() {
  const router = useRouter();
  const id = `qr-reader-${useId().replace(/:/g, "")}`;
  const scanner = useRef<{ stop: () => Promise<void> } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  async function startCamera() {
    setMessage("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const reader = new Html5Qrcode(id);
      scanner.current = reader;
      await reader.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          let url: URL;
          try { url = new URL(decodedText, window.location.origin); }
          catch {
            setScanning(false);
            setMessage("Code not recognized. Ask the student to reopen their pickup page.");
            return;
          }
          const joinId = url.searchParams.get("join_id") ?? url.searchParams.get("join");
          const signature = url.searchParams.get("sig");
          await reader.stop().catch(() => undefined);
          if (!joinId || !signature) {
            setScanning(false);
            setMessage("Code not recognized. Ask the student to reopen their pickup page.");
            return;
          }
          router.push(`/admin/scan?join_id=${encodeURIComponent(joinId)}&sig=${encodeURIComponent(signature)}`);
        },
        () => undefined,
      );
      setScanning(true);
    } catch {
      setMessage("Camera could not start. Enter the code below.");
      setScanning(false);
    }
  }

  async function stopCamera() {
    try { await scanner.current?.stop(); } catch { /* Camera may already be closed. */ }
    setScanning(false);
  }

  return (
    <section className="scanner-section">
      <div className="scanner-actions">
        {!scanning
          ? <button className="button-secondary" onClick={startCamera} type="button">Start camera</button>
          : <button className="button-secondary" onClick={stopCamera} type="button">Stop camera</button>}
      </div>
      <div className="camera-frame" id={id} />
      {message && <p className="auth-message" role="status">{message}</p>}
    </section>
  );
}
