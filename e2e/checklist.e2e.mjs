// ACCEPTANCE (checklist, through the real UI): record supplies for one person,
// switch to two people for 14 days, confirm required quantities and shopping gaps
// update; consume a supply and confirm its completion status changes.
import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.argv[2];
const browser = await chromium.launch();
const page = await (
  await browser.newContext({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
  })
).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const step = (s) => console.log("•", s);
await page.goto(base + "#/checklist");
await page.getByRole("tab", { name: "Household" }).click();
await page.getByLabel("People (including children)").fill("1");
await page.getByLabel("Planning duration").selectOption("14");
step("household: 1 person, 14 days");
// Record 14 one-gallon jugs through the checklist deep link.
await page.goto(base + "#/supplies?add=water-drinking");
await page.fill("input[name=name]", "1-gallon water jugs");
await page.fill("input[name=quantity]", "14");
await page.fill("input[name=unit]", "jug");
await page.selectOption("select[name=waterUnit]", "gal");
await page.fill("input[name=waterLiters]", "1");
await page.fill("input[name=location]", "Basement shelf");
await page.getByRole("button", { name: "Save supply" }).click();
await page
  .locator(".inventory-name", { hasText: "1-gallon water jugs" })
  .waitFor();
step("recorded 14 gallons in inventory");
const waterRow = async () => {
  await page.goto(base + "#/checklist");
  await page.getByRole("tab", { name: "Checklist", exact: true }).click();
  const row = page.locator(".check-row", {
    hasText: "Drinking & basic-use water",
  });
  await row.getByRole("button", { name: /Details for/ }).click();
  return {
    text: await row.locator(".check-detail").innerText(),
    cls: await row.getAttribute("class"),
  };
};
let r = await waterRow();
assert.match(r.cls, /st-ready/, "1 person: ready");
assert.match(r.text, /Counted 53\.0 L \(14\.0 gal\)/);
step("1 person × 14 days: " + r.text);
await page.getByRole("tab", { name: "Household" }).click();
await page.getByLabel("People (including children)").fill("2");
r = await waterRow();
assert.match(r.cls, /st-partial/, "2 people: partially stocked");
assert.match(r.text, /Required 106\.0 L \(28\.0 gal\)/);
step("2 people × 14 days: " + r.text);
await page.getByRole("tab", { name: "Shopping list" }).click();
const shop = await page
  .locator(".shopping li", { hasText: "Drinking & basic-use water" })
  .innerText();
assert.match(shop, /53\.0 L \(14\.0 gal\)/);
const food = await page
  .locator(".shopping li", { hasText: "Shelf-stable food energy" })
  .innerText();
assert.match(food, /56,000 kcal/);
step("shopping list shows the doubled gaps: water 14 gal, food 56,000 kcal");
// Back to 1 person; then consume one jug and watch the status change.
await page.getByRole("tab", { name: "Household" }).click();
await page.getByLabel("People (including children)").fill("1");
r = await waterRow();
assert.match(r.cls, /st-ready/);
await page.goto(base + "#/supplies");
await page
  .getByRole("button", { name: "Use or discard 1-gallon water jugs" })
  .click();
await page.fill("input[name=amount]", "1");
await page.getByRole("button", { name: "Record" }).click();
await page.locator(".inventory-quantity", { hasText: "13 jug" }).waitFor();
r = await waterRow();
assert.match(
  r.cls,
  /st-partial/,
  "consuming a jug drops the status to partial",
);
assert.match(r.text, /Short by 3\.8 L \(1\.0 gal\)/);
step("used 1 jug → " + r.text);
// Damaged and expired supplies stop counting.
await page.goto(base + "#/supplies");
await page.getByRole("button", { name: "Edit 1-gallon water jugs" }).click();
await page.selectOption("select[name=condition]", "needs-check");
await page.getByRole("button", { name: "Save supply" }).click();
r = await waterRow();
assert.match(r.cls, /st-inspect/);
step("marked 'needs checking' → status Needs inspection; not counted");
// Direct quantity confirmation, reload persistence, undo; no inventory mutation.
const water = page
  .locator(".check-row")
  .filter({ hasText: "Drinking & basic-use water" });
await water.getByRole("checkbox").check();
await page.reload();
await page
  .getByRole("checkbox", {
    name: "Mark Drinking & basic-use water ready",
    exact: true,
  })
  .waitFor();
assert.equal(
  await page
    .getByRole("checkbox", {
      name: "Mark Drinking & basic-use water ready",
      exact: true,
    })
    .isChecked(),
  true,
);
await page
  .getByRole("checkbox", {
    name: "Mark Drinking & basic-use water ready",
    exact: true,
  })
  .uncheck();
// Tasks and print view.

const task = page.locator(".check-row", {
  hasText: "Test smoke and carbon monoxide alarms",
});
await task.locator("input[type=checkbox]").click();
await page
  .locator(".check-row.st-ready", {
    hasText: "Test smoke and carbon monoxide alarms",
  })
  .waitFor({ timeout: 5000 });
step("task marked done today → Ready");
await page.goto(base + "#/checklist/print");
await page.locator(".print-sheet h1").waitFor();
assert.ok((await page.locator(".print-sheet tr").count()) > 30);
step("printable checklist renders");
assert.deepEqual(errors, []);
await browser.close();
console.log("PASS checklist acceptance");
