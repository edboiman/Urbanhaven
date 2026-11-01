// Runs every browser test against a fresh production build.
// Usage: npm run test:e2e   (optionally V1_DIST=<path to the v1.0.0 dist> for the v1 upgrade test)
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const node = process.execPath;
const run = (args, env = {}) => {
  const r = spawnSync(node, args, { stdio: "inherit", env: { ...process.env, ...env }, timeout: 300000 });
  if (r.status !== 0) {
    console.error("FAILED:", args.join(" "));
    process.exit(r.status || 1);
  }
};
const distB = join(mkdtempSync(join(tmpdir(), "uh-distB-")), "dist");
run(["scripts/build.mjs"]);
run(["scripts/build.mjs"], { OUT_DIR: distB, BUILD_DATE: "update-test-B" });
const server = spawn(node, ["scripts/serve.mjs", "dist", "4315", "/urban-haven/"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));
const base = "http://127.0.0.1:4315/urban-haven/";
try {
  run(["e2e/checklist.e2e.mjs", base]);
  run(["e2e/map-offline.e2e.mjs", base]);
  run(["e2e/v21.e2e.mjs", base]);
} finally {
  server.kill();
}
run(["e2e/packs.e2e.mjs", "dist"]);
run(["e2e/offline-core.e2e.mjs", "dist"]);
run(["e2e/upgrade.e2e.mjs", "dist", distB, ...(process.env.V1_DIST ? [process.env.V1_DIST] : [])]);
run(["e2e/backup.e2e.mjs", "dist"]);
console.log("ALL BROWSER TESTS PASSED");
