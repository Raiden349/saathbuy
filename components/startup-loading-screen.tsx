"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const MOBILE_LAYOUT = "(max-width: 767px)";

function subscribeToLayout(onChange: () => void) {
  const media = window.matchMedia(MOBILE_LAYOUT);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getIsMobileLayout() {
  return window.matchMedia(MOBILE_LAYOUT).matches;
}

export function StartupLoadingScreen() {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobileLayout = useSyncExternalStore(subscribeToLayout, getIsMobileLayout, () => false);
  const videoSource = isMobileLayout ? "/brand/mobile-startup-loading.mp4" : "/brand/startup-loading.mp4";

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
        aria-hidden="true"
        autoPlay
        className="startup-loading-backdrop"
        loop
        muted
        playsInline
        preload="auto"
        src={videoSource}
      />
      <video
        aria-hidden="true"
        autoPlay
        className="startup-loading-video"
        muted
        onEnded={finish}
        onError={finish}
        playsInline
        preload="auto"
        ref={videoRef}
        src={videoSource}
      />
      <span className="startup-loading-sr-only">Loading SaathBuy</span>
    </div>
  );
}
