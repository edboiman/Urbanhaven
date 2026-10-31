// Production build: esbuild bundle + local PDF.js assets + offline manifest + service worker.
// Usage: node scripts/build.mjs [--watch]
import { build } from "esbuild";
import { cp, mkdir, readFile, readdir, rm, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

const watch = process.argv.includes("--watch");
const out = process.env.OUT_DIR || "dist";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function walk(dir, prefix = "") {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) files.push(...(await walk(join(dir, entry.name), path + "/")));
    else files.push(path);
  }
  return files;
}

async function once() {
  await rm(out, { recursive: true, force: true });
  await mkdir(join(out, "assets"), { recursive: true });
  await cp("public", out, { recursive: true });
  // PDF.js character maps, standard fonts and WASM decoders stay local.
  for (const folder of ["cmaps", "standard_fonts", "wasm"])
    await cp(`node_modules/pdfjs-dist/${folder}`, join(out, "pdfjs", folder), { recursive: true });
  await cp("node_modules/pdfjs-dist/LICENSE", join(out, "pdfjs", "LICENSE"));
  const worker = await readFile("node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
  const workerName = `assets/pdf.worker-${hash(worker).slice(0, 10)}.mjs`;
  await writeFile(join(out, workerName), worker);

  const result = await build({
    entryPoints: { app: "src/main.tsx" },
    bundle: true,
    splitting: true,
    format: "esm",
    target: "es2022",
    minify: true,
    sourcemap: false,
    outdir: join(out, "assets"),
    entryNames: "[name]-[hash]",
    chunkNames: "chunk-[hash]",
    assetNames: "[name]-[hash]",
    metafile: true,
    legalComments: "linked",
    jsx: "automatic",
    loader: { ".json": "json" },
    define: {
      "import.meta.env.BASE_URL": '"./"',
      "import.meta.env.DEV": "false",
      __PDF_WORKER__: JSON.stringify("./" + workerName),
      __BUILD_DATE__: JSON.stringify(process.env.BUILD_DATE || new Date().toISOString().slice(0, 10)),
    },
    logLevel: "warning",
  });
  const outputs = Object.entries(result.metafile.outputs);
  const entry = outputs.find(([, o]) => o.entryPoint === "src/main.tsx")?.[0];
  const css = outputs.find(([file]) => file.endsWith(".css"))?.[0];
  if (!entry || !css) throw new Error("Build did not produce the app entry and stylesheet.");
  const rel = (p) => "./" + relative(out, p).split("\\").join("/");
  const template = await readFile("index.html", "utf8");
  const html = template
    .replace("<!--STYLES-->", `<link rel="stylesheet" href="${rel(css)}"/>`)
    .replace("<!--SCRIPTS-->", `<script type="module" src="${rel(entry)}"></script>`);
  await writeFile(join(out, "index.html"), html);
  await writeOfflineManifest();
  const total = (await walk(out)).length;
  console.log(`Built ${total} files into ${out}/`);
}

// Map detail packs are optional downloads: they are listed in maps/catalog.json
// and are NOT part of the core precache.
const optional = (path) => /^maps\/packs\//.test(path);

async function writeOfflineManifest() {
  const paths = (await walk(out))
    .filter((p) => !/^(sw\.js|offline-manifest\.json)$/.test(p) && !p.endsWith(".map") && !optional(p))
    .sort();
  const files = [];
  for (const url of paths) {
    const bytes = await readFile(join(out, url));
    files.push({ url, sha256: hash(bytes), size: bytes.length });
  }
  const version = hash(JSON.stringify(files)).slice(0, 12);
  const manifest = { version, built: new Date().toISOString(), files };
  const body = JSON.stringify(manifest);
  await writeFile(join(out, "offline-manifest.json"), body);
  const sw = (await readFile("src/sw/sw.template.js", "utf8"))
    .replace("__VERSION__", version)
    .replace("__FILES__", JSON.stringify(files.map((f) => [f.url, f.sha256, f.size])))
    .replace("__MANIFEST_SHA__", hash(body));
  await writeFile(join(out, "sw.js"), sw);
  const mb = files.reduce((n, f) => n + f.size, 0) / 1024 / 1024;
  console.log(`Offline edition ${version}: ${files.length} core files, ${mb.toFixed(2)} MB precached (map detail packs excluded).`);
}

if (watch) {
  await once();
  const { watch: fsWatch } = await import("node:fs");
  let timer;
  fsWatch("src", { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => once().catch((e) => console.error(e.message)), 200);
  });
  console.log("Watching src/ for changes…");
} else {
  await once();
  await stat(join(out, "sw.js"));
}
