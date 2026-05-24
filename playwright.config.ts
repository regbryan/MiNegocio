import { defineConfig, devices } from "@playwright/test";

/**
 * Visual-regression suite. Pairs with `npm run visual` / `npm run visual:update`.
 *
 * Snapshots live next to specs under `tests/visual/__snapshots__`. Diffs land
 * in `test-results/` and `playwright-report/`. Pixel diffs are post-processed
 * with `reg-cli` to publish a PR-ready HTML report (see scripts in package.json).
 *
 * Conventions:
 *  - Snapshots are taken against a Next.js dev server bound by webServer below.
 *  - Each viewport gets its own snapshot suffix (Playwright auto-suffixes).
 *  - `animations: "disabled"` + `caret: "hide"` to make the captures deterministic.
 *  - `fullPage: false` by default to keep snapshots scoped to the viewport — most
 *    surfaces under review are above-the-fold. Override per-spec for long pages.
 */
export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "./test-results",
  snapshotDir: "./tests/visual/__snapshots__",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],

  expect: {
    toHaveScreenshot: {
      // 0.2% tolerance is enough to allow font-rendering jitter without
      // hiding real visual regressions. Tighten before launch.
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },

  use: {
    baseURL: process.env.VISUAL_BASE_URL ?? "http://localhost:3210",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    colorScheme: "dark",
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
  },

  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "wide-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1800, height: 1000 },
      },
    },
  ],

  webServer: process.env.VISUAL_BASE_URL
    ? undefined
    : {
        // Use a project-specific port so we never reuse another app's dev server.
        command: "next dev --port 3210",
        url: "http://localhost:3210",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
