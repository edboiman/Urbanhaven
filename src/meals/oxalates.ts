import data from "../content/oxalates.json";
export function ingredientOxalates(ingredients: string[]) {
  const text = ingredients.join(" ").toLowerCase();
  const keys = [
    ["lentil", "LENTILS"],
    ["peanut butter", "PEANUT BUTTER"],
    ["navy", "BEANS, NAVY"],
    ["black bean", "BEANS, BLACK"],
    ["kidney", "BEANS, RED KIDNEY"],
    ["brown rice", "RICE, BROWN"],
    ["white rice", "RICE, WHITE"],
    ["long-grain rice", "RICE, WHITE"],
    ["couscous", "COUSCOUS"],
    ["salmon", "SALMON"],
    ["tuna", "TUNA"],
    ["almond", "ALMONDS"],
    ["spinach", "SPINACH"],
    ["kale", "KALE"],
    ["cabbage", "CABBAGE"],
    ["broccoli", "BROCCOLI"],
    ["carrot", "CARROTS"],
    ["canned peas", "PEAS, GREEN"],
    ["can peas", "PEAS, GREEN"],
    ["green peas", "PEAS, GREEN"],
    ["corn", "CORN KERNELS"],
    ["tomato paste", "TOMATO PRODUCTS"],
  ];
  const prefixes = keys
    .filter(([word]) => text.includes(word))
    .map(([, prefix]) => prefix);
  return data.filter((r) => prefixes.some((p) => r.food.startsWith(p)));
}
