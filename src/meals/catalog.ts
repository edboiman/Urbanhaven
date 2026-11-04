import pack from "../content/emergency-recipes.json";
import stove from "../content/stove-recipes.json";
import { recipes } from "./recipes";
export type CookingRecipe = {
  id: string;
  name: string;
  servings: string;
  minutes: string;
  fuel: string;
  water: string;
  equipment: string[];
  ingredients: string[];
  steps: string[];
  notes: string[];
  heat: boolean;
  fridge: boolean;
  source: string;
  tags: string[];
};
export const cookingRecipes: CookingRecipe[] = [
  ...pack,
  ...stove.map((r) => ({
    id: "stove-" + r.id,
    name: r.name,
    servings: String(r.servings),
    minutes: String(r.minutes) + " min",
    fuel: r.fuel,
    water: r.water,
    equipment: r.equipment,
    ingredients: r.ingredients,
    steps: r.steps,
    notes: [...r.safety, r.leftovers],
    heat: true,
    fridge: false,
    source: "Original Urban Haven stove collection",
    tags: r.tags,
  })),
  ...recipes.map((r) => ({
    id: "pantry-" + r.id,
    name: r.name,
    servings: String(r.serves),
    minutes: String(r.minutes) + " min",
    fuel:
      r.cook === "heat-water"
        ? "Heat water"
        : "No fuel; heating optional where labeled",
    water: r.waterMl
      ? `${r.waterMl} mL potable water`
      : "No added cooking water; drinking and cleaning water are additional.",
    equipment: r.equipment,
    ingredients: r.ingredients.map(
      (i) =>
        `${i.packages > 0 ? i.packages + " × " : ""}${i.size} ${i.label}${i.optional ? " (optional)" : ""}`,
    ),
    steps: r.steps,
    notes: [r.leftovers, ...(r.sodiumTip ? [r.sodiumTip] : [])],
    heat: r.cook === "heat-water",
    fridge: false,
    source: "Original Urban Haven pantry collection",
    tags: r.diet,
  })),
];
export function filterCookingRecipes(
  query: string,
  heat: string,
  fridge: boolean,
) {
  const q = query.trim().toLowerCase();
  return cookingRecipes.filter(
    (r) =>
      (fridge || !r.fridge) &&
      (heat !== "none" || !r.heat) &&
      (heat !== "quick" ||
        (!r.fridge &&
          Math.max(...(r.minutes.match(/\d+/g) || ["999"]).map(Number)) <=
            15)) &&
      (!q ||
        [r.name, ...r.ingredients, ...r.tags]
          .join(" ")
          .toLowerCase()
          .includes(q)),
  );
}
