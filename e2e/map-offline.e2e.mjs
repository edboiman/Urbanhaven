// ACCEPTANCE (map): install map data, disable networking, close and reopen the app,
// search towns in both peninsulas, zoom to local context, open saved markers, and
// confirm that no external request is made.
// Usage: node e2e/map-offline.e2e.mjs http://127.0.0.1:4101/urban-haven/ [profileDir]
import { chromium } from "playwright";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const base = process.argv[2];
const origin = new URL(base).origin;
const profile = process.argv[3] || mkdtempSync(join(tmpdir(), "uh-map-"));
const external = [];
const failed = [];
async function open(offline) {
  const ctx = await chromium.launchPersistentContext(profile, { viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  if (offline) await ctx.setOffline(true);
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("request", (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
  page.on("requestfailed", (r) => failed.push(r.url() + " " + r.failure()?.errorText));
  page.on("pageerror", (e) => failed.push("pageerror " + e));
  return { ctx, page };
}
const step = (s) => console.log("•", s);
// 1. Online: install the app and two regional packs; save markers in both peninsulas.
let { ctx, page } = await open(false);
await page.goto(base + "#/offline");
await page.getByRole("button", { name: "Download & verify" }).click();
await page.locator(".offline-hero [role=status]").filter({ hasText: "verified on this device" }).waitFor({ timeout: 60000 });
step("core files verified online");
await page.goto(base + "#/map");
await page.locator(".pack").first().waitFor();
for (const name of ["Upper Peninsula", "Southern Lower Peninsula"]) {
  const pack = page.locator(".pack", { hasText: name });
  await pack.getByRole("button", { name: /Download|Resume/ }).click();
  await pack.locator(".status-badge", { hasText: "Installed" }).waitFor({ timeout: 30000 });
  step(`${name} pack installed and verified`);
}
async function addMarker(name, coords) {
  await page.getByRole("button", { name: /At map center/ }).click();
  await page.fill("input[name=name]", name);
  const coord = page.locator("form.edit-form input:not([name])").first();
  await coord.fill(coords);
  await page.getByRole("button", { name: "Save marker" }).click();
  await page.locator(".marker-list li", { hasText: name }).waitFor();
}
await addMarker("Aunt's house Marquette", "46.5436, -87.3954");
await addMarker("Meeting place Kalamazoo library", "42°17'30\"N 85°35'10\"W");
step("markers saved");
await ctx.close();
// 2. Offline cold start.
({ ctx, page } = await open(true));
await page.goto(base + "#/map");
await page.locator(".map-status").waitFor({ timeout: 20000 });
await page.locator(".map-loading").waitFor({ state: "detached", timeout: 15000 }).catch(async () => {
  console.log("still loading; page says:", (await page.locator("main").innerText()).slice(0, 400), failed);
});
assert.equal(await page.locator(".map-loading").count(), 0, "map data opened offline");
step("map opened offline after close/reopen");
async function search(q, expect) {
  await page.fill(".map-search input", q);
  const first = page.locator(".map-results li button").first();
  await first.waitFor();
  const text = await first.innerText();
  assert.match(text, expect, `search ${q}`);
  await first.click();
  await page.waitForTimeout(400);
  const status = await page.locator(".map-status").innerText();
  const banners = await page.locator(".map-banner.warn").allInnerTexts();
  await page.locator(".map-frame").screenshot({ path: `${process.env.SHOTS || "/tmp"}/offline-${q.replace(/\W+/g, "_")}.png` });
  return { status, banners };
}
let r = await search("Marquette", /Marquette\s*City · Marquette County/);
assert.match(r.status, /z11/); assert.equal(r.banners.length, 0, "UP detail pack used, no missing-pack warning");
step("UP town found and shown with detail pack: " + r.status.replace(/\n/g, " "));
r = await search("Ironwood", /Ironwood/); step("western UP: " + r.status.replace(/\n/g, " "));
r = await search("Paradise", /Paradise/); step("eastern UP community: " + r.status.replace(/\n/g, " "));
r = await search("Kalamazoo", /Kalamazoo\s*City/); assert.equal(r.banners.length, 0); step("SLP city with detail pack: " + r.status.replace(/\n/g, " "));
r = await search("Traverse City", /Traverse City/); assert.ok(r.banners.some((b) => /not downloaded/.test(b)), "NLP warns when pack missing"); step("NLP shows the missing-pack warning as expected");
r = await search("St. James", /St\. James/); step("Beaver Island town: " + r.status.replace(/\n/g, " "));
// Zoom controls
await page.getByRole("button", { name: "Zoom in" }).click(); await page.getByRole("button", { name: "Zoom out" }).click();
// Markers open offline
await page.locator(".marker-list li", { hasText: "Aunt's house Marquette" }).click();
await page.locator(".marker-card", { hasText: "Aunt's house Marquette" }).waitFor();
await page.locator(".marker-list li", { hasText: "Kalamazoo library" }).click();
const card = await page.locator(".marker-card").innerText();
assert.match(card, /42\.29\d*, -85\.58/);
step("saved markers open offline");
// Pinch zoom (two touch pointers) changes zoom.
await page.getByRole("button", { name: "Zoom out" }).click();
await page.getByRole("button", { name: "Zoom out" }).click();
const before = await page.locator(".map-status").innerText();
await page.locator(".map-canvas").evaluate((c) => c.scrollIntoView({ block: "center" }));
await page.waitForTimeout(300);
const box = await page.locator(".map-canvas").boundingBox();
const cdp = await ctx.newCDPSession(page);
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx - 30, y: cy, id: 1 }, { x: cx + 30, y: cy, id: 2 }] });
for (let i = 1; i <= 6; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx - 30 - i * 15, y: cy, id: 1 }, { x: cx + 30 + i * 15, y: cy, id: 2 }] });
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await page.waitForTimeout(300);
const after = await page.locator(".map-status").innerText();
step(`pinch: ${before.split("\n")[1]} -> ${after.split("\n")[1]}`);
assert.notEqual(before, after, "pinch changed the view");
assert.deepEqual(external, [], "no external requests");
assert.deepEqual(failed.filter((f) => !/__network/.test(f)), [], "no failed requests offline");
step("no external requests; no failed requests while offline");
await ctx.close();
console.log("PASS map offline acceptance");
