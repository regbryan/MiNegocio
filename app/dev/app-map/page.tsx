import type { Metadata } from "next";
import { AppMap } from "./_components/app-map";

export const metadata: Metadata = {
  title: "App Map — Dev",
  robots: { index: false, follow: false },
};

export default function AppMapPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">App Map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click any node to see what it does, who owns it, and what breaks when
          it&apos;s down. Wire Sentry/Datadog alerts with{" "}
          <code className="rounded bg-muted/40 px-1.5 py-0.5">component: &lt;node-id&gt;</code>{" "}
          so alerts deep-link here.
        </p>
      </header>
      <AppMap />
    </div>
  );
}
