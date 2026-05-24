"use client";

import { useState } from "react";
import { NODES, EDGES, ROLE_COLOR, type GraphNode } from "./graph";

const WIDTH = 1100;
const HEIGHT = 460;
const NODE_W = 180;
const NODE_H = 68;

export function AppMap() {
  const [selected, setSelected] = useState<GraphNode | null>(NODES[0] ?? null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="overflow-auto rounded-md border border-border/40 bg-card/30 p-2">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="Interactive system map"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
            </marker>
          </defs>

          {EDGES.map((e) => {
            const from = NODES.find((n) => n.id === e.from);
            const to = NODES.find((n) => n.id === e.to);
            if (!from || !to) return null;
            const x1 = from.x + NODE_W;
            const y1 = from.y + NODE_H / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_H / 2;
            const midX = (x1 + x2) / 2;
            return (
              <path
                key={`${e.from}->${e.to}`}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={1.4}
                strokeOpacity={0.55}
                markerEnd="url(#arrow)"
              />
            );
          })}

          {NODES.map((n) => {
            const isSelected = selected?.id === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                onClick={() => setSelected(n)}
                className="cursor-pointer"
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    setSelected(n);
                  }
                }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  ry={10}
                  fill="#0f1115"
                  stroke={ROLE_COLOR[n.role]}
                  strokeWidth={isSelected ? 2.5 : 1.4}
                  filter={isSelected ? "drop-shadow(0 0 6px currentColor)" : undefined}
                />
                <circle cx={14} cy={14} r={4} fill={ROLE_COLOR[n.role]} />
                <text
                  x={26}
                  y={18}
                  fontSize="11"
                  fontFamily="var(--font-geist-mono), ui-monospace"
                  fill="#a3a3a3"
                  style={{ textTransform: "uppercase" }}
                >
                  {n.role}
                </text>
                <text
                  x={14}
                  y={42}
                  fontSize="13"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                  fontWeight={600}
                  fill="#fafafa"
                >
                  {truncate(n.title, 22)}
                </text>
                <text
                  x={14}
                  y={58}
                  fontSize="10.5"
                  fontFamily="var(--font-geist-mono), ui-monospace"
                  fill="#737373"
                >
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="rounded-md border border-border/40 bg-card/30 p-4">
        {selected ? (
          <div className="space-y-3">
            <div>
              <div
                className="inline-block rounded-full px-2 py-0.5 text-xs font-mono uppercase tracking-wider"
                style={{
                  backgroundColor: `${ROLE_COLOR[selected.role]}22`,
                  color: ROLE_COLOR[selected.role],
                }}
              >
                {selected.role}
              </div>
              <h2 className="mt-1 text-lg font-semibold">{selected.title}</h2>
              <p className="font-mono text-xs text-muted-foreground">
                {selected.id}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Owner
              </p>
              <p className="text-sm">{selected.owner}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                What it does
              </p>
              <p className="text-sm leading-6">{selected.summary}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                What breaks here
              </p>
              <ul className="ml-4 list-disc text-sm leading-6">
                {selected.breaks.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a node.</p>
        )}
      </aside>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
