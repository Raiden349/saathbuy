"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("saathbuy-theme-change", onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener("saathbuy-theme-change", onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => document.documentElement.dataset.theme === "light" ? "light" : "dark",
    () => "dark",
  );

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("saathbuy-theme", next); } catch { /* Keep the theme active for this page when storage is unavailable. */ }
    window.dispatchEvent(new Event("saathbuy-theme-change"));
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button aria-label={label} aria-pressed={theme === "light"} className="theme-toggle" onClick={toggleTheme} title={label} type="button">
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
    </button>
  );
}
