# Visual regression

Baseline pixel snapshots for every brand-critical surface. Pairs with the
`/app-review` Phase 3a Design Review gate — a redesign that doesn't move the
diff is by definition a `NEEDS WORK`.

## What it covers

[tests/visual/public-surfaces.spec.ts](../tests/visual/public-surfaces.spec.ts)
captures snapshots at three viewports (mobile 412×915 via Pixel 7, desktop
1280×800, wide 1800×1000) for:

| Surface | Why |
|---|---|
| `/` landing hero | Brand presentation moment #1; any change here is intentional |
| `/legal/*` (4 pages) | Compliance copy must not visually regress (header, footer, body type) |
| `/dev/architecture`, `/dev/schema`, `/dev/flows` | Mermaid diagrams render client-side; CSP / dep upgrades can silently break them |
| `/dev/app-map` | Interactive SVG; verifies the brand-colored node palette |
| `/widget` launcher (closed state) | Confirms the floating chat bubble is visible and styled |
| `/widget` open state | The mascot-avatar header, presence dot, composer, empty state |
| `/onboard` empty state | Mascot tile + headline + suggestion chips |

The chat surface inside `/chat/[tenantSlug]` is **not** in the suite because
it requires live Supabase + AI Gateway and is intentionally non-deterministic.
Add a manual visual review against the Vercel preview deploy when changing
that flow.

## Workflow

```bash
# 1. Run the suite (compares current pixels to committed baselines).
npm run visual

# 2. Inspect failures.
npm run visual:report   # opens the Playwright HTML report

# 3. If the diff is INTENTIONAL (you redesigned something), accept it.
npm run visual:update

# 4. Commit the updated PNGs under tests/visual/__snapshots__/.
```

`reg-cli` (installed but not yet wired into CI by default) produces a
PR-ready HTML diff report when comparing two snapshot sets:

```bash
npm run visual:diff
```

## CI gate (recommended)

Add a GitHub Actions job:

```yaml
- name: Visual regression
  run: |
    npm ci
    npx playwright install --with-deps chromium
    npm run build
    npm run visual
  env:
    CI: 'true'
```

Failures upload the Playwright HTML report as an artifact:

```yaml
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

## When to update baselines

- **Always**, when you intentionally change a brand-critical surface.
  Commit the new PNGs in the same PR as the code change so reviewers can
  see the diff in the GitHub UI.
- **Never**, just to make a failing CI go green. Failures are signal.

## Configuration knobs

- `playwright.config.ts` → `expect.toHaveScreenshot.maxDiffPixelRatio`:
  currently 0.002 (0.2%). Allows font-rendering jitter, catches real
  regressions. Tighten before launch.
- `VISUAL_BASE_URL=https://preview.minegocio.digital npm run visual` —
  run against a remote preview deploy instead of `npm run dev`.

## Relationship to `/app-review` Phase 3a

Phase 3a (Design Review) requires per-surface screenshots + critiques. The
visual-regression suite is the **automated** half — it catches *unintended*
visual changes. The Design Review critique catches *intentional but bad*
visual changes. Both gates have to pass.
