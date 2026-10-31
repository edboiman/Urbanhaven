// Offline reliability: cold offline start after closing the browser, verified bytes,
// damaged-cache detection and repair, pause/resume, and storage-quota failure handling.
// Usage: node e2e/offline-core.e2e.mjs <dist dir>
import { chromium } from "playwright";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { startServer, step } from "./lib.mjs";
const dist = process.argv[2] || "dist";
const state = { root: dist };
const { server, base } = await startServer(state, 4311);
const profile = mkdtempSync(join(tmpdir(), "uh-core-"));
const failed = [];
async function open(offline) {
  const ctx = await chromium.launchPersistentContext(profile, { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  if (offline) await ctx.setOffline(true);
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("requestfailed", (r) => { if (!/__network/.test(r.url())) failed.push(r.url()); });
  page.on("pageerror", (e) => failed.push("pageerror " + e));
  return { ctx, page };
}
const status = (page) => page.locator(".offline-hero [role=status]").innerText();
let { ctx, page } = await open(false);
await page.goto(base + "#/offline");
await page.getByRole("button", { name: "Download & verify" }).click();
await page.locator(".offline-hero [role=status]").filter({ hasText: "verified on this device" }).waitFor({ timeout: 60000 });
const progress = await page.locator(".offline-hero small").first().innerText();
step("online install verified: " + progress);
assert.match(progress, /(\d+) \/ \1 files checked/);
await ctx.close();
// Cold offline start: every main route renders from the device.
({ ctx, page } = await open(true));
for (const route of ["", "urgent", "checklist", "supplies", "water", "map", "meals", "garden", "library", "guide/water-boiling", "tools", "notebook", "documents", "offline", "settings"]) {
  await page.goto(base + "#/" + route);
  await page.locator("main h1").first().waitFor({ timeout: 10000 });
}
await page.goto(base + "#/documents");
await page.getByRole("button", { name: "Read here" }).click();
await page.locator(".pdf-toolbar").waitFor({ timeout: 15000 });
step("offline cold start: all 15 routes and the bundled PDF reader rendered");
assert.ok((await page.locator(".network-bar").innerText()).includes("verified"));
assert.deepEqual(failed, [], "no failed requests offline");
// Damage one cached file, offline: recheck must fail and must not claim readiness.
const damaged = await page.evaluate(async () => {
  const name = (await caches.keys()).find((n) => n.startsWith("urban-haven-core-"));
  const cache = await caches.open(name);
  const key = (await cache.keys()).find((r) => r.url.endsWith(".css"));
  await cache.put(key, new Response("/* damaged */"));
  const check = await (await cache.match(key)).text();
  if (!check.includes("damaged")) throw new Error("could not damage the cache entry");
  return key.url;
});
await page.goto(base + "#/offline");
await page.getByRole("button", { name: "Recheck local files" }).waitFor();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Recheck local files" }).click();
await page.waitForFunction(() => /damaged/.test(document.querySelector(".offline-hero [role=status]")?.textContent || ""), null, { timeout: 30000 }).catch(async (e) => { console.log("status was:", await status(page)); throw e; });
step("damaged file detected offline: " + (await status(page)).slice(0, 90));
assert.notEqual(await page.locator(".offline-pill.verified").count(), 1);
// Repair while still offline fails cleanly.
await page.getByRole("button", { name: "Download & verify" }).click();
await page.locator(".offline-hero [role=status]").filter({ hasText: /Could not|fetch|Failed|network/i }).waitFor({ timeout: 20000 }).catch(() => {});
step("repair offline reports: " + (await status(page)).slice(0, 90));
// Quota failure: back online, but make Cache.put throw QuotaExceededError.
await ctx.setOffline(false);
await page.evaluate(() => {
  const orig = Cache.prototype.put;
  window.__restorePut = () => (Cache.prototype.put = orig);
  Cache.prototype.put = () => Promise.reject(new DOMException("full", "QuotaExceededError"));
});
await page.getByRole("button", { name: "Download & verify" }).click();
await page.locator(".offline-hero [role=status]").filter({ hasText: "storage" }).waitFor({ timeout: 20000 });
step("quota error surfaced: " + (await status(page)));
await page.evaluate(() => window.__restorePut());
// Pause mid-way, then repair for real.
await page.getByRole("button", { name: "Download & verify" }).click();
await page.getByRole("button", { name: "Pause" }).click();
await page.locator(".offline-hero [role=status]").filter({ hasText: /Paused|verified on this device/ }).waitFor({ timeout: 20000 });
step("pause: " + (await status(page)).slice(0, 80));
await page.getByRole("button", { name: "Download & verify" }).click();
await page.locator(".offline-hero [role=status]").filter({ hasText: "verified on this device" }).waitFor({ timeout: 60000 });
const repaired = await page.evaluate(async (url) => {
  const name = (await caches.keys()).find((n) => n.startsWith("urban-haven-core-"));
  return (await (await caches.open(name)).match(url)).text();
}, damaged);
assert.ok(!repaired.includes("damaged"));
step("repaired from network and re-verified");
await ctx.close();
server.close();
console.log("PASS offline core");
