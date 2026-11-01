import type { Crop } from "../types";
export const growContexts = [
  {
    id: "suburban",
    name: "Suburban yard / raised bed",
    crops: [
      "potato",
      "dry-bean",
      "winter-squash",
      "pea",
      "kale",
      "cabbage",
      "spinach",
      "radish",
      "carrot",
      "beet",
      "lettuce",
      "green-bean",
      "tomato",
      "chard",
      "onion",
      "pepper",
      "basil",
      "parsley",
      "chives",
    ],
    advice:
      "Use an existing sunny bed or clean raised bed. Test soil before using a former industrial, roadside or unknown urban site; use clean growing medium if contamination is possible. Put water access, fencing and manageable bed size before expanding.",
  },
  {
    id: "urban",
    name: "Urban patio / balcony / containers",
    crops: [
      "lettuce",
      "radish",
      "kale",
      "pea",
      "green-bean",
      "beet",
      "carrot",
      "tomato",
      "potato",
      "basil",
      "chives",
    ],
    advice:
      "Use food-safe containers with drainage and commercial potting mix. Choose compact varieties and match depth to the crop. Check landlord permission and balcony load limits before filling large pots. Containers dry faster; reserve irrigation water separately from drinking water.",
  },
  {
    id: "indoor",
    name: "Indoors with reliable light & heat",
    crops: ["lettuce", "basil", "parsley", "chives", "onion"],
    advice:
      "Choose a small tray or pot, drainage and a waterproof catch tray. Use clean growing medium, potable water and suitable light. Keep plants away from pets and food-preparation surfaces. Follow the lamp maker’s distance and electrical instructions; avoid wet outlets, mold and standing water. Leafy growth is a supplement, not a calorie supply.",
  },
  {
    id: "outage",
    name: "Indoors during a power / heat outage",
    crops: [],
    advice:
      "Do not budget food from a new indoor crop during a Michigan winter outage. Cold windows, short days and lost heat or grow lights can stop growth. Preserve existing plants only if safe and water is spare. Never bring a grill, camp stove or fuel heater indoors to warm plants. Use stored food now and save seed for a viable season.",
  },
] as const;
export type GrowGoal = "all" | "cold" | "calories";
export function cropChoices(crops: Crop[], context: string, goal: GrowGoal) {
  const c = growContexts.find((c) => c.id === context) || growContexts[0];
  return crops.filter(
    (p) =>
      (c.crops as readonly string[]).includes(p.id) &&
      (goal !== "cold" || p.frost !== "tender") &&
      (goal !== "calories" || p.calorieClass !== "low"),
  );
}
export const seedGroups = [
  {
    id: "cool",
    name: "Cool-season greens & roots",
    ids: [
      "kale",
      "cabbage",
      "pea",
      "radish",
      "carrot",
      "beet",
      "spinach",
      "lettuce",
    ],
    why: "A mix of leafy greens and roots supports dietary variety. Peas add some protein; these crops still do not replace staple calories. Sow in the right spring or fall window, not frozen soil.",
  },
  {
    id: "warm",
    name: "Warm-season calories & protein",
    ids: ["dry-bean", "winter-squash", "green-bean"],
    why: "Dry beans contribute protein and calories; winter squash adds storable flesh. Choose early varieties that mature before your local frost. Dry beans need full maturity, drying and safe cooking; frost kills these plants. Potatoes are useful but require certified seed tubers, not an ordinary stored seed packet.",
  },
  {
    id: "small",
    name: "Small spaces / indoor supplements",
    ids: ["lettuce", "radish", "basil", "parsley", "chives"],
    why: "Choose leaf lettuce, compact radishes and herbs for usable small-space harvests. Radishes need adequate light and container depth outdoors; indoor herbs and greens need stable warmth and light. These are fresh supplements, not survival calories.",
  },
];
