import type { Guide } from "../types";
const synonyms: Record<string, string> = {
  "tap water": "municipal advisory water",
  "toilet stopped working": "sewer toilet sanitation",
  "no electricity": "power outage",
  "growing vegetables inside": "indoor farming containers",
  "no heat": "winter outage cold",
  blackout: "power outage",
  poop: "toilet sanitation",
  phone: "charging cellular communications",
  "no water": "water advisory conservation",
};
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ");
export function searchGuides(guides: Guide[], query: string, category = "all") {
  const raw = normalize(query).trim();
  const extra = Object.entries(synonyms)
    .filter(([key]) => raw.includes(key))
    .map(([, value]) => value)
    .join(" ");
  const tokens = normalize(raw + " " + extra)
    .split(/\s+/)
    .filter(Boolean);
  return guides
    .filter((g) => category === "all" || g.category === category)
    .map((g) => {
      const title = normalize(g.title);
      const tags = normalize(g.tags.join(" ") + " " + g.category);
      const body = normalize(
        [g.summary, g.when, ...g.steps, ...g.warnings, ...g.needs, ...g.mistakes, ...g.alternatives, ...g.quick, g.region].join(" "),
      );
      const score = tokens.reduce(
        (s, t) =>
          s +
          (title.includes(t) ? 8 : 0) +
          (tags.includes(t) ? 5 : 0) +
          (body.includes(t) ? 1 : 0),
        0,
      );
      return { guide: g, score };
    })
    .filter((x) => !tokens.length || x.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.guide.title.localeCompare(b.guide.title),
    )
    .map((x) => x.guide);
}
