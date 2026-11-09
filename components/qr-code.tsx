"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function PickupQrCode({ value, label }: { value: string; label: string }) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    let active = true;
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue("--color-ink").trim();
    const surface = styles.getPropertyValue("--color-surface").trim();
    if (!ink || !surface) return;
    void QRCode.toDataURL(value, {
      width: 256,
      margin: 1,
      color: { dark: ink, light: surface },
    }).then((url) => { if (active) setDataUrl(url); });
    return () => { active = false; };
  }, [value]);

  if (!dataUrl) return <div aria-label="Preparing pickup code" className="qr-image qr-loading" role="status" />;
  return <Image alt={label} className="qr-image" height={256} src={dataUrl} unoptimized width={256} />;
}
