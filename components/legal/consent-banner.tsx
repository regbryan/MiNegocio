"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "minegocio.consent.v1";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readConsent(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Compact privacy notice. MiNegocio uses only strictly-necessary cookies
 * (session storage, no tracking), which under GDPR/LFPDPPP doesn't require
 * affirmative consent — a notice + dismiss is sufficient. So instead of a
 * full-width modal banner blocking the page, this renders as a small
 * bottom-right toast with a single "Entendido" dismiss and a link to the
 * full privacy notice.
 */
export function ConsentBanner() {
  const stored = useSyncExternalStore(subscribe, readConsent, () => null);
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && stored === null;

  function record() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value: "acknowledged", at: new Date().toISOString() }),
      );
    } catch {
      // Storage may be blocked; banner just hides for this session.
    }
    setDismissed(true);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de privacidad"
      className="fixed bottom-3 left-3 right-3 z-50 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm"
    >
      <div className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/95 px-4 py-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/95">
        <p className="flex-1 text-[12.5px] leading-[1.5] text-neutral-700 dark:text-neutral-300">
          Solo cookies necesarias. Sin tracking.{" "}
          <Link
            href="/legal/privacidad"
            className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-900 dark:hover:text-white"
          >
            Aviso
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={record}
          className="shrink-0 rounded-md bg-neutral-900 px-2.5 py-1 text-[12px] font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          aria-label="Cerrar aviso"
        >
          OK
        </button>
      </div>
    </div>
  );
}
