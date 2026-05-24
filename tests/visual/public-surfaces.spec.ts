/**
 * Visual regression baseline for public, no-DB-needed surfaces.
 *
 * Run:
 *   npm run visual                  # check against baseline
 *   npm run visual:update           # accept current pixels as the new baseline
 *
 * Add a new surface by appending an entry to `SURFACES`. Baseline images
 * land under tests/visual/__snapshots__/<spec>/<surface>-<project>.png.
 */
import { test, expect, type Page } from "@playwright/test";

// Pre-seed the consent decision so the banner never mounts during captures —
// otherwise it races layout and partially-occludes screenshots.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem(
        "minegocio.consent.v1",
        JSON.stringify({ value: "essential_only", at: new Date().toISOString() }),
      );
    } catch {
      // localStorage may be blocked in some test contexts; that's fine.
    }
  });
});

const SURFACES = [
  { name: "landing",            path: "/",                        prep: dismissConsent },
  { name: "legal-privacidad",   path: "/legal/privacidad",        prep: dismissConsent },
  { name: "legal-terminos",     path: "/legal/terminos",          prep: dismissConsent },
  { name: "legal-derechos-arco",path: "/legal/derechos-arco",     prep: dismissConsent },
  { name: "legal-subprocesadores", path: "/legal/subprocesadores", prep: dismissConsent },
  { name: "dev-architecture",   path: "/dev/architecture",        prep: waitForMermaid },
  { name: "dev-schema",         path: "/dev/schema",              prep: waitForMermaid },
  { name: "dev-flows",          path: "/dev/flows",               prep: waitForMermaid },
  { name: "dev-app-map",        path: "/dev/app-map",             prep: noop },
  { name: "widget-launcher",    path: "/widget",                  prep: dismissConsent },
];

for (const { name, path, prep } of SURFACES) {
  test(`${name} matches baseline`, async ({ page }) => {
    await page.goto(path);
    await prep(page);
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: false,
    });
  });
}

// NOTE: a `widget-open` capture (mascot avatar header, presence dot, composer,
// empty state) is intentionally NOT in this suite. The post-click panel mounts
// assistant-ui's chat runtime, which makes an async request to /api/onboard;
// under Next dev's on-demand-compilation the first mount races the timeout in
// a non-deterministic way across viewports. The widget-launcher (closed state)
// snapshot above + the dedicated /onboard empty-state snapshot below cover the
// same brand surfaces. If we ever need pixel coverage for the open panel,
// run the suite against a built Vercel preview (`VISUAL_BASE_URL=...`) instead
// of `next dev`.

test("onboard-empty matches baseline", async ({ page }) => {
  await page.goto("/onboard");
  await dismissConsent(page);
  // The onboard empty state mounts immediately — no async to wait on.
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
  });
  await expect(page).toHaveScreenshot("onboard-empty.png", { fullPage: false });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function dismissConsent(_page: Page) {
  // No-op: localStorage is pre-seeded in beforeEach so the banner never
  // appears. Kept as a slot so individual specs can opt into extra waits.
}

async function waitForMermaid(page: Page) {
  // Mermaid diagrams render client-side via dynamic import. Wait for at least
  // one SVG to appear before snapshotting.
  await page
    .locator('svg[id^="m-"]')
    .first()
    .waitFor({ state: "visible", timeout: 10_000 })
    .catch(() => {});
  // Animations off so motion doesn't jitter the snapshot.
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
  });
}

async function noop() {
  /* no-op */
}
