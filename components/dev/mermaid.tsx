"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  chart: string;
  className?: string;
};

let mermaidLoading: Promise<typeof import("mermaid").default> | null = null;

async function loadMermaid() {
  if (!mermaidLoading) {
    mermaidLoading = import("mermaid").then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          fontFamily: "var(--font-geist-sans), ui-sans-serif",
          fontSize: "14px",
          edgeLabelBackground: "#1f2937",
          tertiaryColor: "#1f2937",
        },
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence: { useMaxWidth: true },
        er: { useMaxWidth: true },
      });
      return mod.default;
    });
  }
  return mermaidLoading;
}

export function Mermaid({ chart, className }: Props) {
  const id = useId().replace(/[:]/g, "_");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await loadMermaid();
        const { svg } = await mermaid.render(`m-${id}`, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-auto rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
        Mermaid render failed: {error}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className={
        className ??
        "overflow-auto rounded-md border border-border/40 bg-card/30 p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      }
    />
  );
}
