import frost from "../content/frost-stations.json";
import type { Crop } from "../types";

export type Station = {
  name: string;
  region: "slp" | "nlp" | "up";
  lake: boolean;
  first: string;
  p75: string;
  p50: string;
  p25: string;
  last: string;
};
export const stations = frost.stations as Station[];
export const frostSource = frost.source;
export const regionLabel = {
  slp: "Southern Lower Peninsula",
  nlp: "Northern Lower Peninsula",
  up: "Upper Peninsula",
} as const;

export const addDays = (iso: string, days: number) => {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
/** The spring season the household is planning for: this year until mid-June, otherwise next year. */
export function seasonYear(today: string) {
  const [y, m] = today.split("-").map(Number);
  return m >= 7 ? y + 1 : y;
}
export function stationDate(s: Station, p: "p50" | "p25", year: number) {
  return `${year}-${s[p]}`;
}
export type CropDates = {
  indoorStart: string;
  outdoor: string;
  fallSow: string;
  fallOutdoor: string;
  harvestFrom: string;
  harvestTo: string;
  note: string;
};
/**
 * Planning points (not guarantees). Spring dates are offsets from the chosen
 * last-frost date. Fall outdoor target = first fall frost − (fall maturity + a 14-day app buffer);
 * transplant crops need their indoor seedling interval before that target,
 * and only for crops that tolerate frost or are recommended for fall.
 */
export function cropDates(
  c: Crop,
  lastFrost: string,
  firstFrost: string,
): CropDates {
  const outdoor = lastFrost ? addDays(lastFrost, c.springOffsetWeeks * 7) : "";
  const indoorStart =
    lastFrost && c.seedStartWeeks > 0
      ? addDays(outdoor, -c.seedStartWeeks * 7)
      : "";
  const fallMaturity = (c.fallHarvestDays || c.harvestDays)[1];
  const fallOutdoor =
    firstFrost && c.fallWeeksBeforeFrost !== null
      ? addDays(firstFrost, -(fallMaturity + 14))
      : "";
  const fallSow =
    fallOutdoor && c.harvestFrom === "transplant"
      ? addDays(fallOutdoor, -c.seedStartWeeks * 7)
      : fallOutdoor;
  const base = outdoor;
  return {
    indoorStart,
    outdoor,
    fallSow,
    fallOutdoor,
    harvestFrom: base ? addDays(base, c.harvestDays[0]) : "",
    harvestTo: base ? addDays(base, c.harvestDays[1]) : "",
    note:
      c.harvestFrom === "transplant"
        ? "Days counted from transplanting."
        : c.harvestFrom === "planting"
          ? "Days counted from planting."
          : "Days counted from sowing.",
  };
}
export const germinationRate = (sown: number, sprouted: number) =>
  sown > 0 ? Math.round((sprouted / sown) * 100) : 0;
export function sowingAdvice(rate: number) {
  if (rate >= 90)
    return "Very good for many species; compare with the packet’s original rate.";
  if (rate > 50)
    return "Some species remain useful at 70–80%; compare with the packet and test more seed before relying on a small sample.";
  return "Around 50% or less: usually replace with fresher seed. A small test is only an estimate; follow species-specific advice.";
}
