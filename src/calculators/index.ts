export const LITERS_PER_GALLON = 3.785411784;
function finite(n: number, min = 0) {
  if (!Number.isFinite(n) || n < min)
    throw new Error("Enter a valid nonnegative number.");
  return n;
}
export function water(
  people: number,
  days: number,
  liters: number,
  petLiters = 0,
  extraLiters = 0,
  baseline = LITERS_PER_GALLON,
) {
  finite(people, 1);
  finite(days, 1);
  if (!Number.isInteger(people))
    throw new Error("People must be a whole number.");
  [liters, petLiters, extraLiters].forEach((n) => finite(n));
  finite(baseline, 0.1);
  const daily = people * baseline + petLiters + extraLiters;
  const needed = daily * days;
  return {
    daily,
    needed,
    gap: Math.max(0, needed - liters),
    coverage: liters / daily,
  };
}
export function food(calories: number, people: number, dailyCalories: number) {
  finite(calories);
  finite(people, 1);
  finite(dailyCalories, 1);
  return { calories, duration: calories / (people * dailyCalories) };
}
export function power(
  capacity: number,
  watts: number,
  loss: number,
  hours: number,
) {
  finite(capacity);
  finite(watts, 0.001);
  finite(hours);
  if (hours > 24) throw new Error("Daily use cannot exceed 24 hours.");
  if (!Number.isFinite(loss) || loss < 0 || loss >= 100)
    throw new Error("Losses must be from 0 to less than 100%.");
  const usable = capacity * (1 - loss / 100);
  return {
    usable,
    runtime: usable / watts,
    daily: watts * hours,
    remaining: Math.max(0, usable - watts * hours),
  };
}
export function fuel(rate: number, minutes: number, days: number) {
  finite(rate, 0.001);
  finite(minutes);
  finite(days, 1);
  if (minutes > 1440) throw new Error("Daily use cannot exceed 1,440 minutes.");
  return rate * (minutes / 60) * days;
}
