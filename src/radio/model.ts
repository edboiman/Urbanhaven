export type RadioLog = { saved: string[]; heard: Record<string, string> };
export function readRadioLog(value: unknown): RadioLog {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid radio log.");
  const v = value as Record<string, unknown>;
  if (
    !Array.isArray(v.saved) ||
    v.saved.length > 1000 ||
    v.saved.some((s) => typeof s !== "string" || s.length > 100) ||
    new Set(v.saved).size !== v.saved.length ||
    !v.heard ||
    typeof v.heard !== "object" ||
    Array.isArray(v.heard)
  )
    throw new Error("Invalid saved radio stations.");
  const entries = Object.entries(v.heard);
  if (
    entries.length > 1000 ||
    entries.some(
      ([id, date]) =>
        id.length > 100 ||
        ["__proto__", "constructor", "prototype"].includes(id) ||
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date),
    )
  )
    throw new Error("Invalid radio reception dates.");
  return {
    saved: [...v.saved] as string[],
    heard: Object.fromEntries(entries) as Record<string, string>,
  };
}
