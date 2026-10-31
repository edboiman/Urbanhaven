import frost from "../content/frost-stations.json";
import type { Crop } from "../types";

export type Station = { name: string; region: "slp" | "nlp" | "up"; lake: boolean; first: string; p75: string; p50: string; p25: string; last: string };
export const stations = frost.stations as Station[];
export const frostSource = frost.source;
export const regionLabel = { slp: "Southern Lower Peninsula", nlp: "Northern Lower Peninsula", up: "Upper Peninsula" } as const;

export const addDays = (iso: string, days: number) => {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
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
  harvestFrom: string;
  harvestTo: string;
  note: string;
};
/**
 * Planning points (not guarantees). Spring dates are offsets from the chosen
 * last-frost date. Fall sowing = first fall frost − (longest maturity + 14 days),
 * and only for crops that tolerate frost or are recommended for fall.
 */
export function cropDates(c: Crop, lastFrost: string, firstFrost: string): CropDates {
  const outdoor = lastFrost ? addDays(lastFrost, c.springOffsetWeeks * 7) : "";
  const indoorStart = lastFrost && c.seedStartWeeks > 0 ? addDays(outdoor, -c.seedStartWeeks * 7) : "";
  const fallSow = firstFrost && c.fallWeeksBeforeFrost !== null ? addDays(firstFrost, -(c.harvestDays[1] + 14)) : "";
  const base = outdoor;
  return {
    indoorStart,
    outdoor,
    fallSow,
    harvestFrom: base ? addDays(base, c.harvestDays[0]) : "",
    harvestTo: base ? addDays(base, c.harvestDays[1]) : "",
    note: c.harvestFrom === "transplant" ? "Days counted from transplanting." : c.harvestFrom === "planting" ? "Days counted from planting." : "Days counted from sowing.",
  };
}
export const germinationRate = (sown: number, sprouted: number) => (sown > 0 ? Math.round((sprouted / sown) * 100) : 0);
export function sowingAdvice(rate: number) {
  if (rate >= 85) return "Good: sow at the packet rate.";
  if (rate > 70) return "Fair: sow a little more thickly than the packet suggests.";
  return "70% or less: Clemson Extension suggests replacing the packet for next season; sow thickly if you must use it.";
}
