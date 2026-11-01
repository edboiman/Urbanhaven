export type PetProfile = {
  type: "pet-profile";
  name: string;
  species: string;
  dailyFoodGrams: number;
  dailyWaterLiters: number;
  medications: string;
  vet: string;
  contacts: string;
  transport: string;
  instructions: string;
};
export const blankPet = (): PetProfile => ({
  type: "pet-profile",
  name: "",
  species: "Dog",
  dailyFoodGrams: 0,
  dailyWaterLiters: 0,
  medications: "",
  vet: "",
  contacts: "",
  transport: "",
  instructions: "",
});
export function readPet(v: unknown): PetProfile {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Invalid pet profile.");
  const p = v as Record<string, unknown>;
  if (p.type !== "pet-profile") throw new Error("Invalid pet profile type.");
  for (const k of [
    "name",
    "species",
    "medications",
    "vet",
    "contacts",
    "transport",
    "instructions",
  ])
    if (
      typeof p[k] !== "string" ||
      (p[k] as string).length > (["name", "species"].includes(k) ? 120 : 4000)
    )
      throw new Error("Invalid pet profile text.");
  for (const k of ["dailyFoodGrams", "dailyWaterLiters"])
    if (
      typeof p[k] !== "number" ||
      !Number.isFinite(p[k]) ||
      p[k] < 0 ||
      p[k] > (k === "dailyFoodGrams" ? 100000 : 1000)
    )
      throw new Error("Enter a valid daily pet food / water amount.");
  return JSON.parse(JSON.stringify(p)) as PetProfile;
}
export function petTargets(p: PetProfile, days: number) {
  readPet(p);
  if (!Number.isInteger(days) || days < 1 || days > 365)
    throw new Error("Choose 1–365 planning days.");
  return {
    foodGrams: p.dailyFoodGrams * days,
    waterLiters: p.dailyWaterLiters * days,
  };
}

export function readPetKit(value: unknown): { checks: string[] } {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid pet kit.");
  const checks = (value as { checks: unknown }).checks;
  if (
    !Array.isArray(checks) ||
    checks.length > 100 ||
    checks.some((v) => typeof v !== "string" || v.length > 100) ||
    new Set(checks).size !== checks.length
  )
    throw new Error("Invalid pet kit checks.");
  return { checks: checks.slice() };
}
