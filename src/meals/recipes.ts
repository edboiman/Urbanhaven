// Original recipes built from ordinary U.S. grocery-store items.
// Amounts are per batch; "serves" is the number of adult-size servings per batch.
// No recipe needs refrigeration, running water or electricity. "Low-water"
// recipes that need heat say so and must use a safe, outdoor-only appliance or
// an indoor-rated electric appliance when power is available.
export type Ingredient = {
  tag: string;
  label: string;
  /** Packages used per batch (cans, jars, pouches…) — compared with inventory counts. */
  packages: number;
  size: string;
  group: "protein" | "grain" | "fruit-veg" | "dairy" | "fat" | "flavor";
  optional?: boolean;
  /** This package must be refrigerated (or finished) once opened. */
  refrigerateOpened?: boolean;
};
export type Recipe = {
  id: string;
  name: string;
  meal: "breakfast" | "lunch-dinner" | "snack";
  serves: number;
  cook: "none" | "heat-water" | "heat-optional";
  waterMl: number;
  minutes: number;
  equipment: string[];
  ingredients: Ingredient[];
  steps: string[];
  leftovers: string;
  diet: (
    | "vegetarian"
    | "vegan"
    | "lower-sodium"
    | "gluten-free-option"
    | "nut-free"
    | "dairy-free"
  )[];
  sodiumTip?: string;
};

const NO_LEFTOVERS =
  "Without refrigeration, eat it within 2 hours of opening (1 hour above 90°F) and discard what is left. Open only as much as your household will finish.";

export const recipes: Recipe[] = [
  {
    id: "tuna-bean-salad",
    name: "Tuna & white bean salad with crackers",
    meal: "lunch-dinner",
    serves: 2,
    cook: "none",
    waterMl: 0,
    minutes: 10,
    equipment: [
      "Manual can opener",
      "Bowl",
      "Fork",
      "Strainer or the can lid to drain",
    ],
    ingredients: [
      {
        tag: "tuna",
        label: "Canned tuna or salmon",
        packages: 1,
        size: "5 oz can",
        group: "protein",
      },
      {
        tag: "white-beans",
        label: "Canned white or cannellini beans",
        packages: 1,
        size: "15 oz can",
        group: "protein",
      },
      {
        tag: "olive-oil",
        label: "Olive or vegetable oil",
        packages: 0,
        size: "2 tbsp",
        group: "fat",
      },
      {
        tag: "crackers",
        label: "Crackers or crispbread",
        packages: 0.5,
        size: "box",
        group: "grain",
      },
      {
        tag: "canned-vegetables",
        label: "Canned corn, peas or roasted peppers",
        packages: 1,
        size: "15 oz can",
        group: "fruit-veg",
        optional: true,
      },
    ],
    steps: [
      "Wash hands with soap and safe water for at least 20 seconds. Clean preparation surfaces, utensils and can lids before opening. Recipe water does not include hygiene water.",
      "Drain the beans and tuna. Drained bean liquid is not needed; do not use drinking water to rinse unless you have plenty.",
      "Mix beans, tuna, vegetables (if using) and oil. Season with pepper or a seasoning packet.",
      "Serve on crackers right away.",
    ],
    leftovers: NO_LEFTOVERS,
    diet: ["dairy-free", "nut-free"],
    sodiumTip:
      "Choose “no salt added” beans and tuna packed in water; use gluten-free crackers if needed.",
  },
  {
    id: "pb-wraps",
    name: "Peanut butter, honey & raisin wraps",
    meal: "breakfast",
    serves: 2,
    cook: "none",
    waterMl: 0,
    minutes: 5,
    equipment: ["Knife or spoon"],
    ingredients: [
      {
        tag: "tortillas",
        label: "Flour tortillas (shelf-stable)",
        packages: 0.25,
        size: "pack of 8",
        group: "grain",
      },
      {
        tag: "peanut-butter",
        label: "Peanut or sunflower-seed butter",
        packages: 0.15,
        size: "16 oz jar",
        group: "protein",
      },
      {
        tag: "honey",
        label: "Honey or jam",
        packages: 0.05,
        size: "jar",
        group: "flavor",
        optional: true,
      },
      {
        tag: "raisins",
        label: "Raisins or other dried fruit",
        packages: 0.1,
        size: "box/bag",
        group: "fruit-veg",
      },
    ],
    steps: [
      "Spread 2 tablespoons of nut or seed butter on each tortilla.",
      "Add a drizzle of honey and a small handful of raisins.",
      "Roll up and eat.",
    ],
    leftovers:
      "Follow every spread’s opened-storage label. Some nut or seed butters and jams require refrigeration; use single portions if cold storage is unavailable. Honey is not for infants under one year. Keep dry food sealed and dry.",
    diet: ["vegetarian", "dairy-free"],
    sodiumTip:
      "Natural (no-salt) peanut butter lowers sodium. Use sunflower-seed butter for nut allergies. Honey is not safe for infants under 1 year.",
  },
  {
    id: "black-bean-corn-bowl",
    name: "Black bean & corn salsa bowl",
    meal: "lunch-dinner",
    serves: 3,
    cook: "none",
    waterMl: 0,
    minutes: 10,
    equipment: ["Manual can opener", "Bowl", "Spoon"],
    ingredients: [
      {
        tag: "black-beans",
        label: "Canned black beans",
        packages: 1,
        size: "15 oz can",
        group: "protein",
      },
      {
        tag: "corn",
        label: "Canned corn",
        packages: 1,
        size: "15 oz can",
        group: "fruit-veg",
      },
      {
        tag: "salsa",
        label: "Jarred salsa (small jar)",
        packages: 1,
        size: "8–16 oz jar",
        group: "fruit-veg",
        refrigerateOpened: true,
      },
      {
        tag: "tortilla-chips",
        label: "Tortilla chips",
        packages: 0.5,
        size: "bag",
        group: "grain",
      },
    ],
    steps: [
      "Drain the beans and corn.",
      "Mix with salsa.",
      "Scoop with chips. Finish the opened salsa jar at this meal if you have no refrigeration.",
    ],
    leftovers: NO_LEFTOVERS + " Opened salsa jars need refrigeration.",
    diet: [
      "vegetarian",
      "vegan",
      "gluten-free-option",
      "nut-free",
      "dairy-free",
    ],
    sodiumTip:
      "Use “no salt added” beans and corn and unsalted chips; salsa is usually the saltiest part.",
  },
  {
    id: "chicken-salad-crackers",
    name: "Canned chicken salad on crackers",
    meal: "lunch-dinner",
    serves: 2,
    cook: "none",
    waterMl: 0,
    minutes: 10,
    equipment: ["Manual can opener", "Bowl", "Fork"],
    ingredients: [
      {
        tag: "chicken-canned",
        label: "Canned chicken",
        packages: 1,
        size: "10–12.5 oz can",
        group: "protein",
      },
      {
        tag: "mayo-packets",
        label: "Single-serve mayonnaise or mustard packets",
        packages: 4,
        size: "packet",
        group: "fat",
      },
      {
        tag: "relish-packets",
        label: "Relish packets or dried cranberries",
        packages: 2,
        size: "packet",
        group: "flavor",
        optional: true,
      },
      {
        tag: "crackers",
        label: "Crackers",
        packages: 0.5,
        size: "box",
        group: "grain",
      },
      {
        tag: "canned-fruit",
        label: "Fruit cup or canned fruit on the side",
        packages: 2,
        size: "4 oz cup",
        group: "fruit-veg",
      },
    ],
    steps: [
      "Drain the chicken and flake it with a fork.",
      "Stir in the packets.",
      "Serve on crackers with fruit on the side.",
    ],
    leftovers:
      NO_LEFTOVERS + " Single-serve packets avoid an opened mayonnaise jar.",
    diet: ["nut-free", "dairy-free"],
    sodiumTip:
      "Canned chicken is often high in sodium; look for lower-sodium versions and unsalted crackers.",
  },
  {
    id: "chickpea-smash",
    name: "Smashed chickpea sandwiches",
    meal: "lunch-dinner",
    serves: 3,
    cook: "none",
    waterMl: 0,
    minutes: 10,
    equipment: ["Manual can opener", "Bowl", "Fork"],
    ingredients: [
      {
        tag: "chickpeas",
        label: "Canned chickpeas",
        packages: 1,
        size: "15 oz can",
        group: "protein",
      },
      {
        tag: "olive-oil",
        label: "Olive oil or tahini",
        packages: 0,
        size: "2 tbsp",
        group: "fat",
      },
      {
        tag: "mustard-packets",
        label: "Mustard packets",
        packages: 2,
        size: "packet",
        group: "flavor",
        optional: true,
      },
      {
        tag: "bread",
        label: "Shelf-stable bread, pitas or crackers",
        packages: 0.5,
        size: "loaf/pack",
        group: "grain",
      },
      {
        tag: "canned-vegetables",
        label: "Canned carrots, peas or roasted peppers",
        packages: 1,
        size: "15 oz can",
        group: "fruit-veg",
        optional: true,
      },
    ],
    steps: [
      "Drain chickpeas and mash roughly with a fork.",
      "Stir in oil and mustard; season.",
      "Spread on bread or crackers; add drained vegetables.",
    ],
    leftovers: NO_LEFTOVERS,
    diet: ["vegetarian", "vegan", "nut-free", "dairy-free"],
    sodiumTip: "“No salt added” chickpeas are widely sold.",
  },
  {
    id: "soaked-oats",
    name: "Ready-to-eat oat cereal with milk & fruit",
    meal: "breakfast",
    serves: 2,
    cook: "none",
    waterMl: 0,
    minutes: 3,
    equipment: ["Bowl or jar", "Spoon"],
    ingredients: [
      {
        tag: "ready-oat-cereal",
        label: "Ready-to-eat oat cereal (not ordinary oats requiring cooking)",
        packages: 0.1,
        size: "box; check the label and portion size",
        group: "grain",
      },
      {
        tag: "shelf-stable-milk",
        label: "Single-serve shelf-stable milk or soy milk boxes",
        packages: 2,
        size: "8 oz box",
        group: "dairy",
        refrigerateOpened: true,
      },
      {
        tag: "canned-fruit",
        label: "Fruit cups or applesauce cups",
        packages: 2,
        size: "4 oz cup",
        group: "fruit-veg",
      },
      {
        tag: "nuts",
        label: "Nuts or seeds",
        packages: 0.1,
        size: "bag",
        group: "protein",
        optional: true,
      },
    ],
    steps: [
      "Use a cereal explicitly labeled ready to eat. Ordinary oats requiring cooking are not a no-cook substitute.",
      "Portion cereal and add the two single-serve milk boxes and fruit just before eating.",
      "Add suitable nuts if using, then eat promptly; the moist mixture is perishable.",
    ],
    leftovers:
      "Opened shelf-stable milk needs refrigeration — single-serve boxes avoid leftovers. " +
      NO_LEFTOVERS,
    diet: ["vegetarian", "gluten-free-option"],
    sodiumTip:
      "Naturally low in sodium. Use a cereal and milk alternative labeled suitable for the household’s gluten, dairy and other allergy needs.",
  },
  {
    id: "granola-fruit",
    name: "Granola, fruit cup & shelf-stable milk",
    meal: "breakfast",
    serves: 1,
    cook: "none",
    waterMl: 0,
    minutes: 3,
    equipment: ["Bowl", "Spoon"],
    ingredients: [
      {
        tag: "granola",
        label: "Granola or ready-to-eat cereal",
        packages: 0.1,
        size: "box/bag",
        group: "grain",
      },
      {
        tag: "shelf-stable-milk",
        label: "Single-serve shelf-stable milk box",
        packages: 1,
        size: "8 oz box",
        group: "dairy",
        refrigerateOpened: true,
      },
      {
        tag: "canned-fruit",
        label: "Fruit cup",
        packages: 1,
        size: "4 oz cup",
        group: "fruit-veg",
      },
    ],
    steps: ["Pour cereal into a bowl, add the milk box and fruit, and eat."],
    leftovers: "Use the whole milk box at once if you have no refrigeration.",
    diet: ["vegetarian"],
    sodiumTip:
      "Compare cereal labels; many granolas are low in sodium but high in sugar.",
  },
  {
    id: "snack-plate",
    name: "Protein snack plate (jerky, nuts, dried fruit, crackers)",
    meal: "snack",
    serves: 1,
    cook: "none",
    waterMl: 0,
    minutes: 2,
    equipment: [],
    ingredients: [
      {
        tag: "jerky",
        label: "Beef, turkey or plant-based jerky",
        packages: 0.33,
        size: "3 oz bag",
        group: "protein",
      },
      {
        tag: "nuts",
        label: "Nuts, seeds or trail mix",
        packages: 0.1,
        size: "bag",
        group: "protein",
      },
      {
        tag: "dried-fruit",
        label: "Dried fruit",
        packages: 0.1,
        size: "bag",
        group: "fruit-veg",
      },
      {
        tag: "crackers",
        label: "Crackers",
        packages: 0.2,
        size: "box",
        group: "grain",
        optional: true,
      },
    ],
    steps: [
      "Portion a handful of each onto a plate or napkin.",
      "Drink water with salty snacks.",
    ],
    leftovers: "Reseal bags tightly to keep out moisture and pests.",
    diet: ["dairy-free"],
    sodiumTip: "Jerky is usually very salty; unsalted nuts help balance it.",
  },
  {
    id: "cold-chili",
    name: "Canned chili or stew with crackers (heat optional)",
    meal: "lunch-dinner",
    serves: 2,
    cook: "heat-optional",
    waterMl: 0,
    minutes: 5,
    equipment: ["Manual can opener", "Bowl", "Spoon"],
    ingredients: [
      {
        tag: "canned-chili",
        label:
          "Canned chili, stew or hearty soup (ready-to-serve, not condensed)",
        packages: 1,
        size: "15–19 oz can",
        group: "protein",
      },
      {
        tag: "crackers",
        label: "Crackers",
        packages: 0.3,
        size: "box",
        group: "grain",
      },
      {
        tag: "canned-vegetables",
        label: "Canned vegetables on the side",
        packages: 1,
        size: "15 oz can",
        group: "fruit-veg",
        optional: true,
      },
    ],
    steps: [
      "Commercially canned ready-to-serve chili and stews are already cooked; they can be eaten unheated if the can is undamaged.",
      "Discard bulging, leaking or deeply dented cans, or any that spurt when opened.",
      "If you warm it, use a safe method only: an electric appliance while power is on, or an outdoor-only stove used outdoors.",
    ],
    leftovers: NO_LEFTOVERS,
    diet: ["nut-free"],
    sodiumTip:
      "Canned chili and soups are among the highest-sodium pantry foods; look for “reduced sodium” labels.",
  },
  {
    id: "couscous-chickpea",
    name: "Couscous with chickpeas & tomatoes (low water, needs heat)",
    meal: "lunch-dinner",
    serves: 3,
    cook: "heat-water",
    waterMl: 300,
    minutes: 10,
    equipment: [
      "Pot with lid",
      "Safe heat source (see warnings)",
      "Manual can opener",
      "Spoon",
    ],
    ingredients: [
      {
        tag: "couscous",
        label: "Plain instant couscous, about 170 g per batch",
        packages: 0.6,
        size: "10 oz / 283.5 g box",
        group: "grain",
      },
      {
        tag: "chickpeas",
        label: "Canned chickpeas",
        packages: 1,
        size: "15 oz can",
        group: "protein",
      },
      {
        tag: "canned-tomatoes",
        label: "Canned diced tomatoes",
        packages: 1,
        size: "14.5 oz can",
        group: "fruit-veg",
      },
      {
        tag: "olive-oil",
        label: "Olive oil",
        packages: 0,
        size: "1 tbsp",
        group: "fat",
        optional: true,
      },
    ],
    steps: [
      "Measure 170 g plain instant couscous. Boil the potable-water amount its package requires; 300 mL is a planning estimate, not a universal ratio. Reserve extra water if the label needs more.",
      "Remove from heat, stir in the measured instant couscous, cover and stand for the package time, typically around 5 minutes. Pearl couscous needing simmering is not a direct substitute.",
      "Fluff, then stir in drained chickpeas and the tomatoes with their juice.",
    ],
    leftovers: NO_LEFTOVERS,
    diet: ["vegetarian", "vegan", "nut-free", "dairy-free"],
    sodiumTip:
      "Use “no salt added” tomatoes and chickpeas. Couscous contains wheat; it is not gluten-free.",
  },
  {
    id: "instant-potato-salmon",
    name: "Instant mashed potatoes with canned salmon & peas (needs heat)",
    meal: "lunch-dinner",
    serves: 2,
    cook: "heat-water",
    waterMl: 350,
    minutes: 10,
    equipment: [
      "Pot",
      "Safe heat source (see warnings)",
      "Manual can opener",
      "Fork",
    ],
    ingredients: [
      {
        tag: "instant-potatoes",
        label: "Instant mashed potato flakes",
        packages: 0.25,
        size: "box",
        group: "grain",
      },
      {
        tag: "salmon-canned",
        label: "Canned salmon or tuna",
        packages: 1,
        size: "5–6 oz can",
        group: "protein",
      },
      {
        tag: "canned-vegetables",
        label: "Canned peas or green beans",
        packages: 1,
        size: "15 oz can",
        group: "fruit-veg",
      },
      {
        tag: "shelf-stable-milk",
        label: "Shelf-stable milk box (optional, replaces some water)",
        packages: 1,
        size: "8 oz box",
        group: "dairy",
        optional: true,
        refrigerateOpened: true,
      },
    ],
    steps: [
      "Heat the amount of water the potato box lists for 2 servings (about 350 mL) using a safe heat source.",
      "Stir in the flakes until thick.",
      "Fold in the drained salmon and vegetables.",
    ],
    leftovers: NO_LEFTOVERS,
    diet: ["nut-free", "gluten-free-option"],
    sodiumTip:
      "Many instant potatoes are salted; check the label. Salmon with bones adds calcium.",
  },
  {
    id: "rice-cakes-applesauce",
    name: "Rice cakes, nut butter & applesauce",
    meal: "breakfast",
    serves: 1,
    cook: "none",
    waterMl: 0,
    minutes: 3,
    equipment: ["Knife or spoon"],
    ingredients: [
      {
        tag: "rice-cakes",
        label: "Plain rice cakes",
        packages: 0.2,
        size: "pack",
        group: "grain",
      },
      {
        tag: "peanut-butter",
        label: "Peanut or seed butter",
        packages: 0.08,
        size: "16 oz jar",
        group: "protein",
      },
      {
        tag: "applesauce",
        label: "Applesauce cup",
        packages: 1,
        size: "4 oz cup",
        group: "fruit-veg",
      },
    ],
    steps: [
      "Spread nut or seed butter on 2–3 rice cakes.",
      "Eat with an applesauce cup.",
    ],
    leftovers:
      "Nut butter jars are fine at room temperature after opening unless the label says otherwise.",
    diet: [
      "vegetarian",
      "vegan",
      "gluten-free-option",
      "lower-sodium",
      "dairy-free",
    ],
    sodiumTip:
      "Unsalted rice cakes and natural nut butter keep this low in sodium.",
  },
  {
    id: "three-bean-salad",
    name: "Three-bean salad with canned vegetables",
    meal: "lunch-dinner",
    serves: 4,
    cook: "none",
    waterMl: 0,
    minutes: 10,
    equipment: ["Manual can opener", "Bowl", "Spoon"],
    ingredients: [
      {
        tag: "kidney-beans",
        label: "Canned kidney beans",
        packages: 1,
        size: "15 oz can",
        group: "protein",
      },
      {
        tag: "chickpeas",
        label: "Canned chickpeas",
        packages: 1,
        size: "15 oz can",
        group: "protein",
      },
      {
        tag: "green-beans",
        label: "Canned cut green beans",
        packages: 1,
        size: "14.5 oz can",
        group: "fruit-veg",
      },
      {
        tag: "olive-oil",
        label: "Oil + vinegar (shelf-stable bottles)",
        packages: 0,
        size: "3 tbsp",
        group: "fat",
      },
      {
        tag: "crackers",
        label: "Crackers or bread",
        packages: 0.5,
        size: "box",
        group: "grain",
      },
    ],
    steps: [
      "Drain all cans.",
      "Toss with oil and vinegar; season with pepper or dried herbs.",
      "Serve with crackers or bread.",
    ],
    leftovers: NO_LEFTOVERS,
    diet: ["vegetarian", "vegan", "nut-free", "dairy-free", "lower-sodium"],
    sodiumTip:
      "With “no salt added” cans this is one of the lowest-sodium meals here.",
  },
];

export const pantryTags = [
  ...new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.tag))),
].sort();
export const tagLabel = (tag: string) => {
  for (const r of recipes)
    for (const i of r.ingredients) if (i.tag === tag) return i.label;
  return tag;
};
