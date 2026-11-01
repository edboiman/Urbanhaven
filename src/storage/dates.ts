import type { Supply } from "../types";
export const dateKinds = ["quality", "expiry", "review"] as const;
export const waterTypes = ["commercial", "self-filled", "unknown"] as const;
export const dateKindLabel = (kind?: Supply["dateKind"]) =>
  kind === "quality"
    ? "Best-quality date"
    : kind === "expiry"
      ? "Expiry / strict deadline"
      : "Review / rotation date";
/** Civil calendar arithmetic, independent of the device's time zone. */
export function addCalendarMonths(iso: string, months: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isInteger(months)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  const original = new Date(Date.UTC(year, month - 1, day, 12));
  if (original.toISOString().slice(0, 10) !== iso) return "";
  const result = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const last = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, last));
  return result.toISOString().slice(0, 10);
}
/** Six-month rotation applies only to identified self-filled water; an earlier entered date wins. */
export function supplyReviewDate(s: Supply) {
  const rotation =
    s.category === "water" && s.waterType === "self-filled" && s.acquired
      ? addCalendarMonths(s.acquired, 6)
      : "";
  return s.expires && rotation
    ? s.expires < rotation
      ? s.expires
      : rotation
    : s.expires || rotation;
}
export function pastDateText(s: Supply) {
  if (
    s.waterType === "self-filled" &&
    (!s.expires || supplyReviewDate(s) !== s.expires)
  )
    return "Refill / rotation due";
  return s.dateKind === "quality"
    ? "Quality date passed — review"
    : s.dateKind === "expiry"
      ? "Expiry / deadline passed"
      : "Review / rotation due";
}
