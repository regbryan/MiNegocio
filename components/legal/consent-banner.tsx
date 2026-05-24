"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export function ConsentBanner() {
  const stored = useSyncExternalStore(subscribe, readConsent, () => null);
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && stored === null;

  function record(value: "accepted" | "essential_only") {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() }),
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
      aria-label="Aviso de privacidad y consentimiento"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border border-border/40 bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <p className="text-sm leading-6">
        Usamos cookies estrictamente necesarias para operar MiNegocio. No
        usamos cookies de marketing ni rastreo de terceros. Al continuar,
        usted reconoce nuestro{" "}
        <Link href="/legal/privacidad" className="underline">
          Aviso de Privacidad
        </Link>{" "}
        y los{" "}
        <Link href="/legal/terminos" className="underline">
          Términos
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => record("accepted")}>
          Aceptar
        </Button>
        <Button size="sm" variant="outline" onClick={() => record("essential_only")}>
          Solo lo esencial
        </Button>
      </div>
    </div>
  );
}
