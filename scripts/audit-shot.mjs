import { chromium } from "playwright";

// Captures desktop screenshots of the non-landing surfaces for the audit pass.
// Lives alongside landing-shot.mjs which handles the public landing page.

const base = "https://minegocio-plum.vercel.app";
const targets = [
  { name: "onboard", path: "/onboard" },
  { name: "chat", path: "/chat/salon-maria" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

for (const t of targets) {
  const page = await ctx.newPage();
  await page.goto(`${base}${t.path}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(1500);
  const path = `/tmp/${t.name}-desktop.png`;
  await page.screenshot({ path });
  console.log(t.name, path);
  await page.close();
}

await ctx.close();
await browser.close();
