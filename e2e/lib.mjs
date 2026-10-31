// Shared helpers for browser tests: a switchable static server and a step logger.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf", ".wasm": "application/wasm", ".gz": "application/octet-stream", ".bin": "application/octet-stream" };
/** Serves `state.root` under `prefix`; `state.hook(path)` may return {status, body} to simulate failures. */
export function startServer(state, port, prefix = "/urban-haven/") {
  const log = [];
  const server = http.createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    log.push(path);
    if (!path.startsWith(prefix)) { res.writeHead(404); return res.end(); }
    let rel = path.slice(prefix.length) || "index.html";
    if (rel.endsWith("/")) rel += "index.html";
    const forced = state.hook?.(rel);
    if (forced) { res.writeHead(forced.status, { "Content-Type": "application/octet-stream" }); return res.end(forced.body || ""); }
    try {
      const file = join(state.root, normalize("/" + rel));
      await stat(file);
      res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
      res.end(await readFile(file));
    } catch { res.writeHead(404); res.end("not found"); }
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve({ server, log, base: `http://127.0.0.1:${port}${prefix}` })));
}
export const step = (s) => console.log("•", s);
