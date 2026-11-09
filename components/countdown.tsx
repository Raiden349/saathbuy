"use client";

import { useEffect, useState } from "react";

function getParts(deadline: string, now: number) {
  const secondsLeft = Math.max(0, Math.floor((new Date(deadline).getTime() - now) / 1000));
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  return { secondsLeft, days, hours, minutes, seconds };
}

export function Countdown({ deadline, compact = false }: { deadline: string; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  const parts = now === null ? null : getParts(deadline, now);
  const label = !parts ? "Deadline" : parts.secondsLeft === 0
    ? "Ended"
    : parts.days > 0
      ? `${parts.days}d ${parts.hours}h left`
      : parts.hours > 0
        ? `${parts.hours}h ${parts.minutes}m left`
        : `${parts.minutes}m ${parts.seconds}s left`;

  return <time className={compact ? "countdown countdown-compact" : "countdown"} dateTime={deadline} aria-label={label}>{label}</time>;
}
