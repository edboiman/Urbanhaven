export type Route = { path: string; params: URLSearchParams };
export function parseRoute(hash = location.hash): Route {
  const raw = hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  return { path: decodeURIComponent(path), params: new URLSearchParams(query) };
}
export function go(path: string, params?: Record<string, string>) {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  location.hash = "/" + path + q;
}
