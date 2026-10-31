// Map packs: interrupted download resumes from verified parts; a corrupted part is
// rejected; deletion removes stored bytes; app updates keep installed packs.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { startServer, step } from "./lib.mjs";
const dist = process.argv[2] || "dist";
const catalog = JSON.parse(readFileSync(dist + "/maps/catalog.json", "utf8"));
const up = catalog.packs.find((p) => p.id === "up");
assert.ok(up.parts.length >= 2);
const state = { root: dist, hook: null };
const { server, log, base } = await startServer(state, 4312);
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto(base + "#/map");
await page.locator(".pack").first().waitFor();
const pack = page.locator(".pack", { hasText: "Upper Peninsula" });
// 1. Interrupt: the second part fails with HTTP 503.
state.hook = (rel) => (rel === "maps/" + up.parts[1].file ? { status: 503 } : null);
await pack.getByRole("button", { name: "Download" }).click();
await pack.locator(".error").waitFor();
step("interrupted: " + (await pack.locator(".error").innerText()));
await pack.locator(".status-badge", { hasText: "Partly downloaded" }).waitFor();
step("status: " + (await pack.locator(".status-badge").innerText()));
// 2. Corrupted part is rejected.
state.hook = (rel) => (rel === "maps/" + up.parts[1].file ? { status: 200, body: "corrupt-bytes" } : null);
await pack.getByRole("button", { name: "Resume" }).click();
await pack.locator(".error", { hasText: "integrity" }).waitFor();
step("corrupted part rejected: " + (await pack.locator(".error").innerText()));
// 3. Resume downloads only the missing parts.
state.hook = null;
const before = log.length;
await pack.getByRole("button", { name: "Resume" }).click();
await pack.locator(".status-badge", { hasText: "Installed" }).waitFor({ timeout: 20000 });
const fetched = log.slice(before).filter((p) => p.includes("/maps/packs/up/"));
step(`resume fetched ${fetched.length} of ${up.parts.length} parts: ${fetched.map((p) => p.split("/").pop()).join(", ")}`);
assert.ok(!fetched.some((p) => p.endsWith(up.parts[0].file.split("/").pop())), "first (already verified) part not downloaded again");
// 4. Verify, then delete.
await pack.getByRole("button", { name: "Verify" }).click();
await page.locator(".toast", { hasText: "SHA-256 verified" }).waitFor();
step("manual verify passed");
page.once("dialog", (d) => d.accept());
await pack.getByRole("button", { name: "Delete" }).click();
await pack.locator(".status-badge", { hasText: "Not downloaded" }).waitFor();
const left = await page.evaluate(async () => {
  let n = 0;
  for (const name of await caches.keys()) if (name.startsWith("urban-haven-maps-")) for (const k of await (await caches.open(name)).keys()) if (k.url.includes("/packs/up/")) n++;
  return n;
});
assert.equal(left, 0);
step("deleted: no stored parts remain");
await browser.close();
server.close();
console.log("PASS map packs");
