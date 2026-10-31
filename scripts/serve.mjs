// Static file server with HTTP Range support for local previews and browser tests.
// Usage: node scripts/serve.mjs <dir> [port] [/path-prefix/]
import http from "node:http"; import { readFile, stat } from "node:fs/promises"; import { join, extname, normalize } from "node:path";
const root = process.argv[2] || "dist"; const port = Number(process.argv[3] || 4173); const prefix = process.argv[4] || "/";
const types = {".html":"text/html; charset=utf-8",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".png":"image/png",".pdf":"application/pdf",".wasm":"application/wasm",".bcmap":"application/octet-stream",".pfb":"application/octet-stream",".ttf":"font/ttf",".bin":"application/octet-stream",".map":"application/json"};
http.createServer(async (req, res) => {
  try {
    let url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (!url.startsWith(prefix)) { res.writeHead(404); return res.end("outside prefix"); }
    url = url.slice(prefix.length - 1); if (url.endsWith("/")) url += "index.html";
    const file = join(root, normalize(url)); const s = await stat(file);
    const type = types[extname(file)] || "application/octet-stream";
    const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    const data = await readFile(file);
    if (range) { const a = range[1] ? +range[1] : s.size - +range[2]; const b = range[1] && range[2] ? +range[2] : s.size - 1;
      res.writeHead(206, { ...headers, "Content-Range": `bytes ${a}-${b}/${s.size}`, "Content-Length": b - a + 1 }); return res.end(data.subarray(a, b + 1)); }
    res.writeHead(200, { ...headers, "Content-Length": s.size }); res.end(req.method === "HEAD" ? undefined : data);
  } catch { res.writeHead(404); res.end("not found"); }
}).listen(port, process.env.HOST || "127.0.0.1", () => console.log(`Serving ${root} at http://localhost:${port}${prefix}`));
