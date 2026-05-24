import { chromium } from "playwright";

const url = "https://minegocio-plum.vercel.app/";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const v of viewports) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(1500); // let any client-side hydration settle
  const path = `/tmp/landing-${v.name}.png`;
  await page.screenshot({ path, fullPage: v.name === "mobile" });
  console.log(v.name, path);
  await ctx.close();
}
await browser.close();
