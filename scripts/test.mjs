// Unit tests: bundle tests/*.test.ts with esbuild and run them with Node's built-in test runner.
import { build } from "esbuild";
import { readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const out = ".test-build";
await rm(out, { recursive: true, force: true });
const entries = (await readdir("tests")).filter((f) => f.endsWith(".test.ts")).map((f) => "tests/" + f);
await build({
  entryPoints: entries, bundle: true, platform: "node", format: "esm", target: "node20", outdir: out,
  outExtension: { ".js": ".mjs" }, logLevel: "warning", jsx: "automatic",
  define: { "import.meta.env.BASE_URL": '"./"', "import.meta.env.DEV": "false", __PDF_WORKER__: '"./pdf.worker.mjs"', __BUILD_DATE__: '"test"' },
});
const files = (await readdir(out)).filter((f) => f.endsWith(".mjs")).map((f) => `${out}/${f}`);
const r = spawnSync(process.execPath, ["--test", "--test-reporter=spec", ...files], { stdio: "inherit" });
process.exit(r.status ?? 1);
