import { useMemo, useState } from "react";
import { useLiveQuery } from "../storage/idb";
import { db, todayISO } from "../storage/db";
import { recipes, type Recipe } from "../meals/recipes";
import {
  buildPlan,
  matchRecipe,
  pantryCounts,
  planNeeds,
  allowed,
  refrigerateAfterOpening,
  type MealPlan,
  type PlanFilters,
  type Diet,
} from "../meals/planner";
import {
  PageTitle,
  Callout,
  Field,
  useHaven,
  errorMessage,
} from "../components/shared";
import { parseRoute, go } from "../components/route";
import {
  AlertTriangle,
  Check,
  CookingPot,
  Droplets,
  Flame,
  Printer,
  ArrowLeft,
  Snowflake,
} from "../components/icons";

import { CookingDetail } from "./Cooking";
import { cookingRecipes } from "../meals/catalog";
import { PantryReference } from "./PantryReference";

const dietLabels: Record<Diet, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "lower-sodium": "Lower sodium as written",
  "gluten-free-option": "Gluten-free possible",
  "nut-free": "Nut-free",
  "dairy-free": "Dairy-free",
};
const mealLabel: Record<Recipe["meal"], string> = {
  breakfast: "Breakfast",
  "lunch-dinner": "Lunch / dinner",
  snack: "Snack",
};
const cookLabel: Record<Recipe["cook"], string> = {
  none: "No cooking",
  "heat-optional": "No cooking (heating optional)",
  "heat-water": "Needs hot water",
};

export function Meals() {
  const { path, params } = parseRoute();
  const id = params.get("recipe");
  if (path === "meals" && id) {
    const r = recipes.find((x) => x.id === id);
    if (r)
      return (
        <CookingDetail
          key={r.id}
          r={cookingRecipes.find((x) => x.id === "pantry-" + r.id)!}
        />
      );
  }
  return <MealsHome />;
}

function SafetyStrip() {
  return (
    <Callout danger>
      <strong>
        <AlertTriangle size={18} /> Before you cook
      </strong>
      <p>
        These meals assume{" "}
        <b>no refrigeration, no running water and no electricity</b>. Outdoor
        camp stoves, grills, charcoal and generators must never be used indoors,
        in a garage, or near doors, windows and vents — opening a window does
        not make it safe. Never use a stove or oven to heat your home. If you
        cannot cook safely, choose a no-cook meal.
      </p>
    </Callout>
  );
}

function MealsHome() {
  const { settings, toast } = useHaven();
  const supplies = useLiveQuery(() => db.supplies.toArray(), [], []) || [];
  const saved = useLiveQuery(() => db.plans.get("meal-plan"), []);
  const today = todayISO();
  const [tab, setTab] = useState<
    "pantry" | "now" | "plan" | "recipes" | "safety"
  >("pantry");
  const [filters, setFilters] = useState<PlanFilters>({
    noCookOnly: true,
    diets: [],
    avoidTags: [],
  });
  const counts = useMemo(
    () => pantryCounts(supplies, today),
    [supplies, today],
  );
  const matches = recipes
    .filter((r) => allowed(r, filters))
    .map((r) => matchRecipe(r, counts));
  const plan = saved?.data as MealPlan | undefined;
  const tagged = supplies.filter(
    (s) => s.category === "food" && (s.pantryTags || []).length,
  ).length;
  const untagged = supplies.filter(
    (s) => s.category === "food" && !(s.pantryTags || []).length,
  ).length;
  const fridge = refrigerateAfterOpening(supplies);
  const filterBar = (
    <div className="panel filter-panel">
      <label className="check-label">
        <input
          type="checkbox"
          checked={filters.noCookOnly}
          onChange={(e) =>
            setFilters({ ...filters, noCookOnly: e.target.checked })
          }
        />{" "}
        No-cook meals only
      </label>
      {(Object.keys(dietLabels) as Diet[]).map((d) => (
        <label className="check-label" key={d}>
          <input
            type="checkbox"
            checked={filters.diets.includes(d)}
            onChange={(e) =>
              setFilters({
                ...filters,
                diets: e.target.checked
                  ? [...filters.diets, d]
                  : filters.diets.filter((x) => x !== d),
              })
            }
          />
          {dietLabels[d]}
        </label>
      ))}
      <p className="small muted">
        Filters are a convenience, not an allergy guarantee — always read every
        label. “Lower sodium” recipes rely on choosing no-salt-added cans; each
        recipe lists a sodium tip.
      </p>
    </div>
  );
  return (
    <>
      <PageTitle
        eyebrow="PANTRY TO PLATE"
        title="A pantry you can actually use."
        description="Start with everyday essentials. Keep shelf life, water and cooking needs in view."
      />
      <div className="food-nav">
        <a href="#/cooking">Recipes & cooking basics</a>
        <a href="#/nutrition">Daily nutrition</a>
        <a href="#/oxalates">Oxalates</a>
      </div>
      {tab === "pantry" && <PantryReference />}
      <details className="panel meal-tools">
        <summary>Meal planner & food safety</summary>
        <div className="tabs" role="tablist" aria-label="Meals views">
          {[
            ["pantry", "Essentials"],
            ["now", "Make now"],
            ["plan", "14-day plan"],
            ["recipes", "Recipe library"],
            ["safety", "Food safety"],
          ].map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              className={tab === k ? "active" : ""}
              onClick={() => setTab(k as typeof tab)}
            >
              {label}
            </button>
          ))}
        </div>
      </details>
      {tab === "now" && (
        <>
          {filterBar}
          {tagged === 0 && (
            <Callout>
              Suggestions use <b>meal-planner tags</b> on your food records (for
              example <i>tuna</i>, <i>black-beans</i>, <i>crackers</i>).{" "}
              {untagged > 0
                ? `${untagged} food record${untagged > 1 ? "s have" : " has"} no tags yet. `
                : ""}
              <a href="#/supplies">Add tags in Supplies</a> to see which recipes
              you can make.
            </Callout>
          )}
          <div className="recipe-grid">
            {matches
              .sort(
                (a, b) =>
                  Number(b.ready) - Number(a.ready) ||
                  b.have / b.of - a.have / a.of,
              )
              .map((m) => (
                <a
                  key={m.recipe.id}
                  className={"panel recipe-card " + (m.ready ? "ready" : "")}
                  href={`#/meals?recipe=${m.recipe.id}`}
                >
                  <p className="eyebrow">
                    {mealLabel[m.recipe.meal]} · {cookLabel[m.recipe.cook]}
                  </p>
                  <h3>{m.recipe.name}</h3>
                  <p className="small">
                    {m.ready ? (
                      <span className="status-badge st-ready">
                        <Check size={12} /> Listed packages available
                      </span>
                    ) : (
                      <>Missing: {m.missing.map((i) => i.label).join(", ")}</>
                    )}
                  </p>
                  <p className="small muted">
                    Serves {m.recipe.serves} · {m.recipe.minutes} min
                    {m.recipe.waterMl
                      ? ` · ${m.recipe.waterMl} mL water`
                      : " · no extra water"}
                  </p>
                </a>
              ))}
          </div>
          {fridge.length > 0 && (
            <Callout>
              <Snowflake size={16} /> These pantry items need refrigeration once
              opened: {fridge.map((s) => s.name).join(", ")}. Without power,
              open the smallest package and finish it at one meal.
            </Callout>
          )}
        </>
      )}
      {tab === "plan" && (
        <>
          {filterBar}
          <div className="action-row">
            <button
              className="button"
              onClick={async () => {
                try {
                  const p = buildPlan(
                    Math.min(30, settings.days || 14),
                    settings.people,
                    filters,
                    supplies,
                    today,
                  );
                  await db.plans.put({
                    id: "meal-plan",
                    data: p,
                    updated: new Date().toISOString(),
                  });
                  toast(
                    `Built a ${p.days}-day plan for ${p.people} ${p.people === 1 ? "person" : "people"}.`,
                  );
                } catch (e) {
                  toast(errorMessage(e));
                }
              }}
            >
              <CookingPot size={16} /> {plan ? "Rebuild plan" : "Build my plan"}{" "}
              ({Math.min(30, settings.days || 14)} days, {settings.people}{" "}
              {settings.people === 1 ? "person" : "people"})
            </button>
            {plan && (
              <button
                className="button secondary"
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print
              </button>
            )}
          </div>
          {plan ? (
            <PlanView plan={plan} />
          ) : (
            <p className="muted">
              Build a plan to see daily meals, pantry gaps and extra water
              needs.
            </p>
          )}
        </>
      )}
      {tab === "recipes" && (
        <section className="panel">
          <h2>One recipe library</h2>
          <p>
            Browse all pantry, stove and new emergency recipes with consistent
            ingredients and step-by-step cooking.
          </p>
          <a className="button" href="#/cooking">
            Browse recipes
          </a>
        </section>
      )}
      {tab === "safety" && <FoodSafety />}
    </>
  );
}

function PlanView({ plan }: { plan: MealPlan }) {
  const supplies = useLiveQuery(() => db.supplies.toArray(), [], []) || [];
  const needs = planNeeds(plan, supplies, todayISO());
  const name = (id?: string) => recipes.find((r) => r.id === id)?.name || "—";
  const gaps = needs.rows.filter((r) => r.gap > 0);
  return (
    <>
      <section className="panel">
        <h2>Plan check</h2>
        <ul className="article-list plan-check">
          <li>
            <Droplets size={16} /> Recipe water:{" "}
            <b>{needs.waterL.toFixed(1)} L</b> over {needs.days} days (
            {needs.heatMeals} meals need hot water). This comes from your stored
            water — the 1-gallon-per-person daily baseline is meant to cover
            basic food preparation, but count it.
          </li>
          <li>
            <Check size={16} /> Fruit or vegetable included on{" "}
            {needs.daysWithFruitVeg} of {needs.days} days; protein on{" "}
            {needs.daysWithProtein} of {needs.days} days.
          </li>
          <li>
            <Flame size={16} /> Fuel: only estimate from your appliance's
            published consumption in <a href="#/tools">Calculators → Fuel</a>.
          </li>
        </ul>
        <p className="small muted">
          Package estimates assume the listed recipe package sizes; compare your
          actual labels and unmeasured staples. Avoid assigning interchangeable
          tags to one package as if it were multiple foods. Water estimates need
          adjustment for the actual product directions; handwashing, dishwashing
          and drinking water are additional. The planner rotates recipes for
          variety. It does not count calories per recipe — your checklist tracks
          total food energy from label values in Supplies.
        </p>
      </section>
      <section className="panel">
        <h2>Pantry gaps for this plan</h2>
        {gaps.length ? (
          <ul className="shopping">
            {gaps.map((g) => (
              <li key={g.tag}>
                <span>
                  <strong>{g.label}</strong>{" "}
                  <small className="muted">({g.size})</small>
                </span>
                <span>
                  need {g.packages}, have {g.have} → buy {g.gap}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Your tagged pantry covers every required ingredient in this plan.
          </p>
        )}
        <p className="small muted">
          Matched by meal-planner tag and package count. Check that your package
          sizes match the sizes shown.
        </p>
      </section>
      <div className="plan-table-wrap">
        <table className="plan-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Breakfast</th>
              <th>Meal 1</th>
              <th>Meal 2</th>
              <th>Snack</th>
            </tr>
          </thead>
          <tbody>
            {plan.slots.map((d, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {(["breakfast", "main1", "main2", "snack"] as const).map(
                  (k) => (
                    <td key={k}>
                      {d[k] ? (
                        <a href={`#/meals?recipe=${d[k]!.recipeId}`}>
                          {name(d[k]!.recipeId)}
                          {d[k]!.batches > 1 ? ` ×${d[k]!.batches}` : ""}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function FoodSafety() {
  return (
    <div className="dashboard-grid">
      <section className="panel">
        <h2>
          <Snowflake size={18} /> Refrigerator & freezer during an outage
        </h2>
        <ul className="article-list">
          <li>
            Keep doors closed. A closed refrigerator keeps food safe for up to{" "}
            <b>4 hours</b>.
          </li>
          <li>
            A full freezer holds a safe temperature for about <b>48 hours</b>; a
            half-full freezer about <b>24 hours</b>, if the door stays closed.
          </li>
          <li>
            Discard perishable food (meat, poultry, fish, eggs, leftovers) that
            has been above <b>40°F for 2 hours or more</b> — or 1 hour when the
            ambient temperature is above 90°F/32°C.
          </li>
          <li>
            Frozen food that still has ice crystals or is at 40°F or below may
            be refrozen (quality may suffer).
          </li>
          <li>
            Never taste food to decide whether it is safe. When in doubt, throw
            it out.
          </li>
          <li>
            Hard cheeses, butter, mustard, ketchup and jelly usually keep;
            opened mayonnaise is discarded if above 50°F for more than 8 hours.
          </li>
        </ul>
        <p className="small muted">
          References reviewed 2026-11-01:{" "}
          <a
            href="https://www.foodsafety.gov/food-safety-charts/food-safety-during-power-outage"
            target="_blank"
            rel="noreferrer"
          >
            FoodSafety.gov outage chart
          </a>{" "}
          and{" "}
          <a
            href="https://www.foodsafety.gov/keep-food-safe/food-safety-in-disaster-or-emergency"
            target="_blank"
            rel="noreferrer"
          >
            emergency food safety
          </a>
          .
        </p>
      </section>
      <section className="panel">
        <h2>Opened vs. unopened packages</h2>
        <ul className="article-list">
          <li>
            Best-quality rotation examples for intact commercial cans stored
            cool and dry: low-acid foods such as beans, corn and meat about 2–5
            years; high-acid tomatoes and fruit about 12–18 months. Tomato-based
            soups can follow the shorter category. These are not safety expiry
            dates; follow the exact product and storage conditions.
          </li>
          <li>
            Once opened, canned food needs refrigeration (low-acid 3–4 days;
            high-acid 5–7 days). Without refrigeration, finish it at one meal.
          </li>
          <li>
            Labels that say “refrigerate after opening” (salsa, shelf-stable
            milk, some sauces) mean the unopened package is shelf-stable but the
            opened one is not.
          </li>
          <li>
            Do not use cans that bulge, leak, are deeply dented (especially on a
            seam), heavily rusted, or spurt when opened.
          </li>
          <li>
            Discard flood-exposed food in damaged packages, cartons, screw-cap
            or snap-lid containers and home-canned jars. Eligible intact
            commercial all-metal cans and retort pouches require the complete
            FDA cleaning and sanitation procedure, not a quick wipe. If it
            cannot be completed, discard them.{" "}
            <a
              href="https://www.fda.gov/food/food-safety-during-emergencies/floods-key-tips-consumers-about-food-and-water-safety"
              target="_blank"
              rel="noreferrer"
            >
              Full FDA procedure (opens online)
            </a>
            .
          </li>
        </ul>
        <p className="small muted">
          References reviewed 2026-11-01:{" "}
          <a
            href="https://ask.fsis.usda.gov/article/How-long-can-you-keep-canned-goods"
            target="_blank"
            rel="noreferrer"
          >
            USDA canned-food guidance
          </a>{" "}
          and{" "}
          <a
            href="https://www.fda.gov/food/food-safety-during-emergencies/floods-key-tips-consumers-about-food-and-water-safety"
            target="_blank"
            rel="noreferrer"
          >
            FDA flood guidance
          </a>
          .
        </p>
      </section>
      <section className="panel">
        <h2>
          <Flame size={18} /> Cooking & fuel
        </h2>
        <ul className="article-list">
          <li>
            Outdoor-only stoves, grills, charcoal and generators: outdoors only,
            away from doors, windows and vents. Never in a home, garage, tent or
            porch enclosure.
          </li>
          <li>
            Indoor-rated electric appliances are fine while power works. Don't
            run them from an extension cord rated below their wattage.
          </li>
          <li>
            Fuel needs: use your stove's published consumption and the Fuel
            calculator. There is no universal burn rate.
          </li>
          <li>
            Low-water cooking: couscous, instant potatoes and similar foods
            absorb all their water — nothing is drained away.
          </li>
        </ul>
        <a className="button secondary" href="#/tools">
          Open the fuel calculator
        </a>
      </section>
      <section className="panel">
        <h2>Infants and special diets</h2>
        <p>
          Ready-to-feed infant formula needs no water. Powdered formula must be
          mixed with safe water; ask your pediatrician what to store. Honey is
          not safe for infants under 1 year. For medical diets, ask your
          clinician what to keep.
        </p>
      </section>
    </div>
  );
}
