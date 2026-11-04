// Upgrades keep personal data:
//  (1) v1.0.0 (Dexie + Workbox build) → this version, using the original v1 dist if provided;
//  (2) an interrupted update (one file fails) leaves the installed edition working;
//  (3) a good update A → B activates only after "Update & reload", and records persist.
// Usage: node e2e/upgrade.e2e.mjs <distA> <distB> [v1-dist]
import { chromium } from "playwright";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { startServer, step } from "./lib.mjs";
const [distA, distB, v1] = process.argv.slice(2);
const state = { root: v1 || distA, hook: null };
const { server, base } = await startServer(state, 4313);
const profile = mkdtempSync(join(tmpdir(), "uh-upgrade-"));
const ctx = await chromium.launchPersistentContext(profile, {
  viewport: { width: 1280, height: 900 },
  acceptDownloads: true,
});
const page = ctx.pages()[0] || (await ctx.newPage());
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const consoleLog = [];
page.on("console", (m) => consoleLog.push(m.type() + ": " + m.text()));
page.on("requestfailed", (r) =>
  consoleLog.push("FAILED " + r.url() + " " + r.failure()?.errorText),
);
const verify = async (button = "Recheck local files") => {
  await page.goto(base + "#/offline");
  await page
    .getByRole("button", { name: button })
    .waitFor({ timeout: 15000 })
    .catch(async (e) => {
      console.log(
        "PAGE URL",
        page.url(),
        "MAIN:",
        (await page.locator("body").innerText()).slice(0, 300),
        consoleLog.slice(-15),
        errors,
      );
      throw e;
    });
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: button }).click();
  await page.waitForFunction(
    () =>
      /verified on this device|damaged|missing|error|unavailable/i.test(
        document.querySelector(".offline-hero [role=status]")?.textContent ||
          "",
      ),
    null,
    { timeout: 60000 },
  );
  return page.locator(".offline-hero [role=status]").innerText();
};
const edition = () =>
  page.evaluate(
    async () => (await (await fetch("offline-manifest.json")).json()).version,
  );
if (v1) {
  await page.goto(base);
  await page.waitForTimeout(2500);
  await page.goto(base + "#/offline");
  await page.getByRole("button", { name: "Download & verify" }).click();
  await page.waitForTimeout(6000);
  await page.goto(base + "#/supplies");
  await page.getByRole("button", { name: "Add a supply" }).click();
  await page.fill("input[name=name]", "v1 gallon jugs");
  await page.fill("input[name=quantity]", "6");
  await page.fill("input[name=waterLiters]", "3.785411784");
  await page.getByRole("button", { name: "Save supply" }).click();
  await page.waitForTimeout(400);
  await page.goto(base + "#/notebook");
  await page.getByRole("button", { name: "New note" }).click();
  await page.fill("input[name=title]", "v1 meeting place");
  await page.fill("textarea[name=body]", "<b>Library</b> lot");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.waitForTimeout(300);
  await page.goto(base + "#/tools");
  await page.locator(".plan-settings input").first().fill("3");
  await page.locator(".assessment input[type=checkbox]").first().click();
  await page.waitForTimeout(400);
  // Keep a real v1 backup file as a fixture for the restore test.
  await page.goto(base + "#/supplies");
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export" }).click(),
  ]);
  await dl.saveAs(join(tmpdir(), "urban-haven-v1-backup.json"));
  step("v1.0.0 build: data created, v1 backup exported");
  state.root = distA;
  await page.goto(base);
  await page.locator(".update-bar").waitFor({ timeout: 30000 });
  step("v1 → v2: update downloaded in background; old edition still running");
  await page.getByRole("button", { name: "Update & reload" }).click();
  await page.waitForLoadState("load");
  await page.waitForTimeout(2000);
  await page.goto(base + "#/supplies");
  await page
    .locator(".inventory-name", { hasText: "v1 gallon jugs" })
    .waitFor();
  await page.goto(base + "#/notebook");
  assert.equal(
    await page.locator(".note-card .note-body").first().innerText(),
    "<b>Library</b> lot",
  );
  await page.goto(base + "#/checklist");
  await page.getByRole("tab", { name: "Household" }).click();
  assert.equal(
    await page.getByLabel("People (including children)").inputValue(),
    "3",
  );
  await page.getByRole("tab", { name: "Checklist", exact: true }).click();

  const waterRow = page.locator('.check-row',{hasText:'Drinking & basic-use water'});
  await waterRow.getByRole('button',{name:/Details for/}).click();
  assert.match(await waterRow.locator('.check-detail').innerText(), /Counted 22\.7 L \(6\.0 gal\)/);
  const db = await page.evaluate(async () => {
    const r = indexedDB.open("urban-haven-personal");
    const d = await new Promise((ok) => (r.onsuccess = () => ok(r.result)));
    const v = d.version;
    d.close();
    return v;
  });
  assert.equal(db, 20);
  const legacy = await page.evaluate(async () =>
    (await caches.keys()).filter((k) => k.startsWith("urban-haven-precache")),
  );
  assert.deepEqual(legacy, [], "old Workbox caches removed after activation");
  step(
    `v1 data intact after upgrade (supplies, note markup as text, 3-person household, water counted: ${water.split(" ·")[0]}); DB native version ${db}`,
  );
} else {
  await page.goto(base);
  await page.waitForTimeout(2000);
  step("no v1 dist given: starting from edition A");
}
assert.match(await verify("Download & verify"), /verified on this device/);
const a = await edition();
await page.goto(base + "#/map");
await page.getByRole("button", { name: /At map center/ }).click();
await page.fill("input[name=name]", "Persisting marker");
await page.getByRole("button", { name: "Save marker" }).click();
await page
  .locator(".marker-list li", { hasText: "Persisting marker" })
  .waitFor();
step("edition A verified: " + a + "; marker saved");
// Interrupted update: edition B with one asset failing.
state.root = distB;
state.hook = (rel) =>
  rel.startsWith("assets/app-") && rel.endsWith(".js") ? { status: 500 } : null;
await page.goto(base);
await page.waitForTimeout(5000);
assert.equal(
  await page.locator(".update-bar").count(),
  0,
  "no update offered after a failed install",
);
assert.equal(await edition(), a);
assert.match(await verify(), /verified on this device/);
step(
  "interrupted update: install failed safely; edition A still verified and running",
);
// Good update.
state.hook = null;
await page.goto(base + "#/");
await page.reload();
await page.locator(".update-bar").waitFor({ timeout: 30000 });
await page.getByRole("button", { name: "Update & reload" }).click();
await page.waitForLoadState("load");
await page.waitForTimeout(2000);
const b = await edition();
assert.notEqual(a, b);
assert.match(await verify(), /verified on this device/);
await page.goto(base + "#/map");
await page
  .locator(".marker-list li", { hasText: "Persisting marker" })
  .waitFor();
step(`update A → B activated by the user (${a} → ${b}); marker and data kept`);
assert.deepEqual(errors, []);
await ctx.close();
server.close();
console.log("PASS upgrades");
