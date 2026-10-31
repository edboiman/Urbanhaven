import { useState } from "react";
import { PageTitle, Callout, useHaven } from "../components/shared";
import { useChecklist } from "./Checklist";
import { fmt } from "../checklist/model";
import { LITERS_PER_GALLON } from "../calculators";
import { AlertTriangle, Droplets, Flame, Snowflake, ShowerHead, Info } from "../components/icons";

type Advisory = "boil" | "no-drink" | "no-use" | "chemical" | "well" | "none";
const advisories: { id: Advisory; label: string }[] = [
  { id: "boil", label: "Boil water advisory" },
  { id: "no-drink", label: "Do NOT drink advisory" },
  { id: "no-use", label: "Do NOT use advisory" },
  { id: "chemical", label: "Fuel, chemical or flood contamination suspected" },
  { id: "well", label: "Private well flooded / lost power" },
  { id: "none", label: "No water at the tap / not sure" },
];

const sourcesReviewed = "2026-10-31";
export const waterSources = [
  { org: "CDC", title: "How to Create an Emergency Water Supply", url: "https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html", page: "last reviewed 2025-06-27" },
  { org: "CDC", title: "How to Make Water Safe in an Emergency", url: "https://www.cdc.gov/water-emergency/about/index.html", page: "last reviewed 2024-09-19" },
  { org: "EPA", title: "Emergency Disinfection of Drinking Water", url: "https://www.epa.gov/ground-water-and-drinking-water/emergency-disinfection-drinking-water", page: "updated 2026-02-24" },
  { org: "CDC", title: "Drinking Water Advisories: An Overview", url: "https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html", page: "last reviewed 2024-03-04" },
  { org: "CDC", title: "Water Treatment Options When Hiking, Camping or Traveling (filter pore sizes)", url: "https://www.cdc.gov/drinking-water/prevention/water-treatment-hiking-camping-traveling.html", page: "last reviewed 2025-01-30" },
  { org: "CDC", title: "Guidelines for Personal Hygiene During an Emergency", url: "https://www.cdc.gov/water-emergency/safety/guidelines-for-personal-hygiene-during-an-emergency.html", page: "last reviewed 2024-08-05" },
  { org: "CDC", title: "How to Disinfect Wells After an Emergency", url: "https://www.cdc.gov/water-emergency/about/how-to-disinfect-wells-after-an-emergency.html", page: "last reviewed 2025-05-29" },
  { org: "Michigan EGLE", title: "Protecting Your Private Water Supply in an Emergency", url: "https://www.michigan.gov/egle/-/media/Project/Websites/egle/Documents/Programs/DWEHD/Water-Well-Construction/Protecting-Your-Private-Water-Supply-in-an-Emergency.pdf", page: "fact sheet 04/2020" },
  { org: "EPA", title: "Basic Information about Lead in Drinking Water", url: "https://www.epa.gov/ground-water-and-drinking-water/basic-information-about-lead-drinking-water", page: "updated 2026-06-18" },
];

export function Water() {
  const { settings } = useHaven();
  const { rows } = useChecklist();
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [conc, setConc] = useState<"cdc" | "6" | "8.25">("cdc");
  const row = (id: string) => rows.find((r) => r.def.id === id);
  const drink = row("water-drinking");
  const hygiene = row("water-hygiene");
  const pets = row("water-pets");
  const dailyDrink = (drink?.rate || LITERS_PER_GALLON) * settings.people;
  const coverage = drink && dailyDrink > 0 ? drink.owned / dailyDrink : 0;
  return (
    <>
      <PageTitle
        eyebrow="WATER · MICHIGAN"
        title="Safe water, step by step."
        description="What the advisory means, what treatment can and cannot do, and how much to store. Read the limits first."
      />
      <section className="panel urgent-water" aria-labelledby="adv-h">
        <h2 id="adv-h">
          <AlertTriangle size={20} /> What is happening right now?
        </h2>
        <div className="choice-grid">
          {advisories.map((a) => (
            <button key={a.id} className={"choice-button " + (advisory === a.id ? "selected" : "")} aria-pressed={advisory === a.id} onClick={() => setAdvisory(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
        {advisory && <AdvisoryAnswer id={advisory} />}
        <p className="small muted">Your utility's or health department's exact instructions always come first. This app has no live advisory feed.</p>
      </section>

      <Callout danger>
        <strong>Critical limits — read before treating water</strong>
        <ul>
          <li>
            <b>Boiling and disinfection do not make water with fuel, toxic chemicals or radioactive material safe.</b> Use bottled water or
            another approved source and contact the health department.
          </li>
          <li>
            <b>Boiling does not remove lead</b> (EPA). If lead is a concern, use cold water only and a filter certified to remove lead, or bottled
            water.
          </li>
          <li>
            <b>Most portable filters do not remove viruses</b> and many do not remove all bacteria (CDC). Filter first, then disinfect.
          </li>
          <li>Bleach and iodine work poorly against parasites such as <i>Cryptosporidium</i>. Boiling is the most reliable home method for germs.</li>
          <li>Clear, odorless water can still be unsafe. Estimated storage coverage is not a guaranteed safe survival time.</li>
        </ul>
      </Callout>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>
            <Flame size={18} /> Boil (preferred for germs)
          </h2>
          <ol className="steps">
            <li>If cloudy, let it settle or filter through a clean cloth, paper towel or coffee filter. That alone does not disinfect.</li>
            <li>
              Bring to a <b>rolling boil for 1 minute</b>. (CDC uses 3 minutes above 6,500 ft; EPA above 5,000 ft. All of Michigan is below 2,000 ft,
              so 1 minute applies.)
            </li>
            <li>Let it cool without adding untreated water or ice. Store in a clean, covered container.</li>
            <li>Heat only with a safe appliance — never an outdoor stove or grill indoors.</li>
          </ol>
          <p className="small muted">
            Michigan EGLE's 2020 private-well sheet gives longer boil times (2–5 minutes). Following the longer local instruction is reasonable.
          </p>
        </section>
        <section className="panel">
          <h2>
            <Droplets size={18} /> Bleach (when boiling is impossible)
          </h2>
          <p>
            Use <b>regular, unscented</b> liquid chlorine bleach only — not splash-less, scented or “with cleaners”. If the label gives
            drinking-water directions, follow the label. Otherwise:
          </p>
          <div className="seg" role="group" aria-label="Bleach strength on label">
            <button className={conc === "cdc" ? "active" : ""} onClick={() => setConc("cdc")}>5–9% (CDC)</button>
            <button className={conc === "6" ? "active" : ""} onClick={() => setConc("6")}>6% (EPA)</button>
            <button className={conc === "8.25" ? "active" : ""} onClick={() => setConc("8.25")}>8.25% (EPA)</button>
          </div>
          <table className="dose-table">
            <thead>
              <tr>
                <th>Clear water</th>
                <th>Bleach to add</th>
              </tr>
            </thead>
            <tbody>
              {conc === "cdc" && (
                <>
                  <tr><td>1 quart or 1 liter</td><td>2 drops (0.1 mL)</td></tr>
                  <tr><td>1 gallon</td><td>8 drops (½ mL, a little less than ⅛ tsp)</td></tr>
                  <tr><td>5 gallons</td><td>40 drops (2½ mL, ½ tsp)</td></tr>
                </>
              )}
              {conc === "6" && (
                <>
                  <tr><td>1 quart/liter</td><td>2 drops</td></tr>
                  <tr><td>1 gallon</td><td>8 drops</td></tr>
                  <tr><td>2 gallons</td><td>16 drops (¼ tsp)</td></tr>
                  <tr><td>4 gallons</td><td>⅓ tsp</td></tr>
                  <tr><td>8 gallons</td><td>⅔ tsp</td></tr>
                </>
              )}
              {conc === "8.25" && (
                <>
                  <tr><td>1 quart/liter</td><td>2 drops</td></tr>
                  <tr><td>1 gallon</td><td>6 drops</td></tr>
                  <tr><td>2 gallons</td><td>12 drops (⅛ tsp)</td></tr>
                  <tr><td>4 gallons</td><td>¼ tsp</td></tr>
                  <tr><td>8 gallons</td><td>½ tsp</td></tr>
                </>
              )}
            </tbody>
          </table>
          <ul className="article-list">
            <li><b>Double</b> the amount if the water is cloudy, murky, colored or very cold.</li>
            <li>Stir and wait <b>at least 30 minutes</b>. It should smell slightly of chlorine; if not, repeat the dose and wait 15 more minutes (EPA).</li>
            <li>Never guess an unknown concentration and never use a surface-cleaning dilution.</li>
          </ul>
          <p className="small muted">
            Tables copied from CDC (5–9%) and EPA (6% / 8.25%); amounts are only shown for the strengths and volumes those agencies publish.
            EGLE's 2020 well sheet uses 10 drops/gal and a 4-hour wait for well water.
          </p>
        </section>
        <section className="panel">
          <h2>Tablets & filters</h2>
          <ul className="article-list">
            <li>Disinfection tablets: follow the package exactly; strengths differ. Chlorine dioxide tablets can kill <i>Cryptosporidium</i> when used as directed; iodine and standard chlorine tablets do not.</li>
            <li>Avoid iodine-treated water if pregnant, with thyroid problems or iodine sensitivity, and for more than a few weeks.</li>
            <li>Filter with absolute pore size <b>1 micron</b> or smaller (or NSF 53/58 cyst reduction): removes parasites, <b>not viruses or all bacteria</b>.</li>
            <li><b>0.3 micron</b> or smaller: removes bacteria and parasites, <b>not viruses</b>.</li>
            <li>Reverse osmosis removes parasites, bacteria and viruses (and salt), but needs pressure and often power.</li>
            <li>Ordinary membrane filters do not remove dissolved chemicals, fuel or most metals. Keep dirty and clean sides apart.</li>
          </ul>
        </section>
        <section className="panel">
          <h2>How much to store</h2>
          <dl className="water-dl">
            <div>
              <dt>Drinking & basic use</dt>
              <dd>
                {fmt(drink?.required || 0, "L")} for {settings.people} × {settings.days} days
                <small>CDC/Ready.gov baseline: 1 gal (3.785 L) per person per day. CDC: “Try to store a 2-week supply if possible.”</small>
              </dd>
            </div>
            <div>
              <dt>Extra hygiene</dt>
              <dd>
                {hygiene?.rate === null || !hygiene ? "not set" : fmt(hygiene.required, "L")}
                <small>App planning allowance you choose (Checklist → Water). Kept separate from drinking water.</small>
              </dd>
            </div>
            <div>
              <dt>Pets</dt>
              <dd>
                {settings.pets === 0 ? "no pets" : pets?.rate === null || !pets ? "set in Household" : fmt(pets.required, "L")}
                <small>Your pets' usual intake. FoodSafety.gov's general figure is 1 gallon per pet per day; small animals need far less — ask your vet.</small>
              </dd>
            </div>
            <div>
              <dt>Counted now</dt>
              <dd>
                {fmt(drink?.owned || 0, "L")} usable drinking water
                <small>
                  ≈ {coverage.toFixed(1)} days at the drinking baseline. This is an estimate, not a safe survival duration; heat, illness, nursing
                  and pets raise needs.
                </small>
              </dd>
            </div>
          </dl>
          <div className="action-row">
            <a className="button" href="#/checklist">Open checklist</a>
            <a className="button secondary" href="#/supplies?add=water-drinking">Record water</a>
          </div>
        </section>
        <section className="panel">
          <h2>Containers, labels & rotation</h2>
          <ul className="article-list">
            <li>Best: FDA-approved food-grade containers. Otherwise a tight lid, durable unbreakable material (not glass), narrow opening. Never a container that held chemicals.</li>
            <li>Sanitize reusable containers: 1 teaspoon unscented 5–9% bleach in 1 quart of water, coat all surfaces, wait 30 seconds, pour out, air-dry. This is a container solution — do not drink it.</li>
            <li>Label “drinking water” with the fill date. Replace self-filled water every 6 months; follow dates on commercial bottles.</li>
            <li>Store at 50–70°F, away from sunlight, fuel and chemicals, and above possible flood level.</li>
          </ul>
        </section>
        <section className="panel">
          <h2>
            <Snowflake size={18} /> Michigan specifics
          </h2>
          <ul className="article-list">
            <li><b>Winter:</b> keep stored water in heated living space. Garages and porches freeze; containers may split. Check jugs for leaks after a cold snap.</li>
            <li><b>Private wells:</b> an electric pump stops in a power outage. EGLE advises avoiding opening faucets, showering or flushing during extended outages so the system doesn't lose pressure, and testing for coliform bacteria if all pressure is lost.</li>
            <li><b>Flooded well:</b> stop drinking it immediately. Use bottled water. A licensed well contractor should disinfect it; EGLE considers it safe after two consecutive coliform-free samples taken 8 hours apart. Do not use a flooded dug well. Have flooded pump wiring checked before power is restored.</li>
            <li><b>Basement flooding / sewage backup:</b> keep stored water off the floor and away from floodwater. Discard any container that floodwater reached unless it can be cleaned and sanitized and the contents were sealed.</li>
            <li><b>Main breaks and pressure loss:</b> utilities often issue precautionary boil advisories. After an advisory is lifted, follow the utility's flushing instructions for taps, ice makers and water heaters.</li>
            <li><b>Lead service lines:</b> some Michigan homes still have them. Boiling does not remove lead; use cold water and a filter certified for lead, and ask your utility.</li>
          </ul>
        </section>
        <section className="panel">
          <h2>
            <ShowerHead size={18} /> Washing & toilets without normal service
          </h2>
          <ul className="article-list">
            <li><b>Handwashing:</b> make a station from a jug with a spigot, soap and a catch bucket. During a boil advisory CDC says tap water and soap are fine for handwashing. Hand sanitizer (≥60% alcohol) is a backup; it works poorly on dirty hands.</li>
            <li><b>Bathing:</b> under a boil advisory, shower or bathe but don't swallow water; sponge-bathe infants and young children with safe water. Under a do-not-use advisory, don't use tap water at all. Never bathe in water that may contain sewage or chemicals.</li>
            <li><b>Teeth:</b> brush with safe (bottled, boiled or disinfected) water only.</li>
            <li><b>Toilets:</b> if water is off but sewer works, a bucket of non-drinking water can flush. If drains back up or officials say so, stop flushing and use a bagged bucket toilet with absorbent; follow local disposal rules.</li>
          </ul>
          <a className="text-link" href="#/guide/sanitation-emergency-toilet">Emergency toilet guide</a>
        </section>
      </div>
      <section className="sources panel">
        <h2>Sources</h2>
        <p className="small">Checked {sourcesReviewed}. Links open online; all instructions above are stored in the app.</p>
        {waterSources.map((s) => (
          <div key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.org}: {s.title}
            </a>{" "}
            <small>({s.page})</small>
          </div>
        ))}
      </section>
    </>
  );
}

function AdvisoryAnswer({ id }: { id: Advisory }) {
  const content: Record<Advisory, { limit: string; steps: string[] }> = {
    boil: {
      limit: "Boiling kills germs. It does not remove chemicals or lead. Use the advisory's own instructions if they differ.",
      steps: [
        "Drink, cook, brush teeth, make ice and mix formula with bottled water or tap water boiled for 1 minute and cooled.",
        "You can wash hands with tap water and soap. Shower or bathe, but don't swallow water; sponge-bathe young children.",
        "Don't use refrigerator water dispensers or ice makers. Throw out ice made during the advisory.",
        "When the advisory ends, follow the utility's flushing instructions.",
      ],
    },
    "no-drink": {
      limit: "Boiling does NOT fix a do-not-drink advisory — the problem is usually a chemical or toxin. Do not boil and drink.",
      steps: [
        "Use commercially bottled water for drinking, cooking, brushing teeth, ice and formula.",
        "Ask the utility which other uses (bathing, handwashing, laundry) are allowed — it depends on the contaminant.",
        "Keep children and pets from drinking tap water.",
      ],
    },
    "no-use": {
      limit: "Do not use tap water for ANY purpose — skin contact or inhaled mist may be harmful.",
      steps: [
        "Use bottled water for drinking, cooking, hygiene and pets.",
        "Do not shower, bathe or wash dishes with tap water until officials lift the order.",
        "Use a handwashing station with stored water; follow official cleanup instructions afterward.",
      ],
    },
    chemical: {
      limit: "No home method — boiling, bleach, tablets or ordinary filters — makes water with fuel, solvents or toxic chemicals safe.",
      steps: [
        "Stop using the water. Use bottled water or another approved source.",
        "Contact your local health department or utility and tell them what you smell or see.",
        "If a private well was flooded or smells of fuel, see the well guidance below.",
      ],
    },
    well: {
      limit: "A flooded well may be contaminated with bacteria or chemicals. Don't drink it until it is disinfected and tested.",
      steps: [
        "Use bottled water for drinking and cooking. If you must use well water and only germs are suspected, boil it.",
        "Have a licensed well contractor disinfect the well and an electrician check flooded pump wiring before restoring power.",
        "Test with a certified lab: EGLE considers the water safe after two consecutive coliform-free samples taken 8 hours apart. CDC says wait 7–10 days after disinfection to test.",
        "Power outage only (no flooding): avoid opening taps, showering or flushing to keep pressure; test for coliform if pressure was lost.",
      ],
    },
    none: {
      limit: "Don't assume stored or collected water is safe if you're unsure how it was stored.",
      steps: [
        "Use your stored drinking water for drinking, food, medicine and teeth first.",
        "Check for an official advisory by radio or utility message. No news does not prove water is safe.",
        "If sewer/septic service may be affected, stop flushing and use an emergency toilet.",
        "If supplies will run short, look for official water distribution sites before you run out.",
      ],
    },
  };
  const c = content[id];
  return (
    <div className="advisory-answer" aria-live="polite">
      <p className="limit">
        <Info size={16} /> <b>Limit:</b> {c.limit}
      </p>
      <ol className="steps">
        {c.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
