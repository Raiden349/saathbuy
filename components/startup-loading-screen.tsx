"use client";

import { useEffect, useRef, useState } from "react";

export function StartupLoadingScreen() {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fallback = window.setTimeout(() => setVisible(false), 20_000);
    return () => window.clearTimeout(fallback);
  }, []);

  function finish() {
    videoRef.current?.pause();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div aria-label="Loading SaathBuy" aria-live="polite" className="startup-loading-screen" role="status">
      <video
        autoPlay
        className="startup-loading-video"
        muted
        onEnded={finish}
        onError={finish}
        playsInline
        preload="auto"
        ref={videoRef}
        src="/brand/startup-loading.mp4"
      />
      <span className="startup-loading-sr-only">Loading SaathBuy</span>
    </div>
  );
}
