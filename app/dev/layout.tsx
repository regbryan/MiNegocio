import Link from "next/link";
import { notFound } from "next/navigation";

function devEnabled() {
  // Gating, in order of priority:
  // 1. Always available in development.
  // 2. In production, gated behind INTERNAL_DASHBOARD_ENABLED env flag.
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.INTERNAL_DASHBOARD_ENABLED === "true";
}

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!devEnabled()) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border/40 bg-card/30 px-6 py-3">
        <nav
          aria-label="Dev tools"
          className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-4 text-sm"
        >
          <Link href="/" className="font-semibold">
            MiNegocio
          </Link>
          <span className="text-muted-foreground">›</span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Dev
          </span>
          <span className="text-muted-foreground">|</span>
          <Link href="/dev/architecture" className="text-muted-foreground hover:text-foreground">
            Architecture
          </Link>
          <Link href="/dev/schema" className="text-muted-foreground hover:text-foreground">
            Schema
          </Link>
          <Link href="/dev/app-map" className="text-muted-foreground hover:text-foreground">
            App Map
          </Link>
          <Link href="/dev/flows" className="text-muted-foreground hover:text-foreground">
            User Flows
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-6 py-8 md:px-10">
        {children}
      </main>
    </div>
  );
}
