import { useState } from "react";
import { PageTitle, Callout, Field } from "../components/shared";
import { PantryReference } from "./PantryReference";
import { crops } from "../content";

export function StorageDates() {
  const [topic, setTopic] = useState("water"),
    [seed, setSeed] = useState("pea");
  const crop = crops.find((c) => c.id === seed)!;
  return (
    <>
      <PageTitle
        eyebrow="STORAGE & DATES · REVIEWED 2026-11-01"
        title="A date needs a meaning."
        description="Food quality, medicine expiry, seed viability and water rotation are different. These references assume the stated storage conditions; a calendar cannot certify safety."
      />
      <Callout>
        <strong>Keep the label, lot number and storage history.</strong>
        <p>
          Best-quality dates usually describe flavor or quality, not a safety
          cutoff. Infant formula must not be used after its use-by date, and
          medicines must follow their expiry. A damaged, recalled, contaminated
          or temperature-abused product can be unsafe before any printed date.
          Never taste food or water to test safety.
        </p>
      </Callout>
      <Field label="Storage topic">
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="water">Water & water-treatment bleach</option>
          <option value="food">Pantry food shelf lives</option>
          <option value="seeds">Seed storage & germination</option>
          <option value="medical-pets">Medicines & pet food</option>
        </select>
      </Field>
      {topic === "food" && <PantryReference />}
      {topic === "water" && (
        <section className="panel">
          <h2>Water: rotation is not one universal expiry</h2>
          <dl className="reference-facts">
            <div>
              <dt>Self-filled drinking-water containers</dt>
              <dd>
                Replace the water every six months. Label the fill date, use a
                sanitized food-grade container, and keep it cool, shaded and
                separate from chemicals.
              </dd>
            </div>
            <div>
              <dt>Unopened commercial bottled water</dt>
              <dd>
                Follow the manufacturer’s date and storage instructions. Do not
                impose the self-filled six-month rule or promise a universal
                number of years.
              </dd>
            </div>
            <div>
              <dt>Opened or emergency-treated water</dt>
              <dd>
                No fixed safe storage duration is promised here. Use clean
                covered containers, avoid touching the water or container
                interior, and follow the current advisory. Opening, handling and
                contamination can change suitability.
              </dd>
            </div>
            <div>
              <dt>Bleach for emergency drinking-water disinfection</dt>
              <dd>
                Use suitable fresh unscented liquid household bleach stored at
                room temperature for less than one year, with a readable
                concentration and product instructions. Heat and age reduce
                strength. Never guess a dose for old or unknown bleach.
              </dd>
            </div>
          </dl>
          <Callout danger>
            <p>
              Discard water bottles if floodwater may have reached their screw
              caps; sealing does not make a closure flood-proof. Boiling or
              disinfecting does not remove fuel, heavy metals or other chemical
              contamination. Use an approved alternate supply.
            </p>
          </Callout>
          <p>
            <a href="#/water">
              Water advisories, exact treatment tables & container-sanitizing
              steps
            </a>
          </p>
          <p className="small muted">
            Sources:{" "}
            <a
              href="https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html"
              target="_blank"
              rel="noreferrer"
            >
              CDC water storage
            </a>
            ;{" "}
            <a
              href="https://www.epa.gov/ground-water-and-drinking-water/emergency-disinfection-drinking-water"
              target="_blank"
              rel="noreferrer"
            >
              EPA emergency disinfection
            </a>
            ;{" "}
            <a
              href="https://www.fda.gov/food/food-safety-during-emergencies/floods-key-tips-consumers-about-food-and-water-safety"
              target="_blank"
              rel="noreferrer"
            >
              FDA flood guidance
            </a>
            . Links open online.
          </p>
        </section>
      )}
      {topic === "seeds" && (
        <section className="panel">
          <h2>Seed age predicts less than a germination test</h2>
          <Field label="Seed crop">
            <select value={seed} onChange={(e) => setSeed(e.target.value)}>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <h3>{crop.name}</h3>
          <p>{crop.seedLife}</p>
          <p>
            These estimates describe viability under favorable storage, not a
            food safety expiry or a guaranteed harvest. A packed-for year is not
            a germination guarantee. Primed or pelleted seed usually needs use
            within one growing season; follow its label rather than a multi-year
            table. Hot, damp or fluctuating storage can shorten useful life
            substantially.
          </p>
          <ol className="article-list">
            <li>
              Keep dry labeled packets in a sealed container, cool and dark,
              with appropriate desiccant. Refrigeration can extend life if
              reliable; let the sealed container warm before opening to reduce
              condensation.
            </li>
            <li>
              Before relying on older seed, test a counted sample using the
              packet’s temperature and germination period. Many vegetables need
              one to three weeks. Record the result in Seed inventory; slow
              species need their actual packet period.
            </li>
            <li>
              Rotate a small useful stock and practice growing it. Buy suitable
              short-season varieties; do not assume a large “survival”
              assortment matches Michigan or your available space.
            </li>
          </ol>
          <Callout danger>
            <p>
              Never eat chemically treated planting seed or use it for sprouts.
              Seeds intended for edible sprouts or microgreens can still carry
              pathogens. Check recalls by product and lot when online; never use
              recalled seed. Clean equipment and rinsing cannot guarantee safe
              raw sprouts or microgreens.
            </p>
          </Callout>
          <p>
            <a href="#/garden">Crop choices, planting dates & seed inventory</a>
          </p>
          <p className="small muted">
            Sources:{" "}
            <a
              href="https://yardandgarden.extension.iastate.edu/how-to/how-store-seeds-and-test-germination-rates"
              target="_blank"
              rel="noreferrer"
            >
              Iowa State seed storage
            </a>
            ;{" "}
            <a
              href="https://www.canr.msu.edu/news/a_simple_seed_germination_test_may_be_a_deal_breaker"
              target="_blank"
              rel="noreferrer"
            >
              MSU germination test
            </a>
            ;{" "}
            <a
              href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts"
              target="_blank"
              rel="noreferrer"
            >
              FDA recalls
            </a>
            . This offline app does not receive live recalls.
          </p>
        </section>
      )}
      {topic === "medical-pets" && (
        <section className="panel">
          <h2>Product-specific dates matter</h2>
          <h3>Medicines</h3>
          <p>
            Do not extend expiry dates yourself or rely on expired antibiotics.
            Follow the exact storage label; temperature exposure can make a
            medicine unsuitable before expiry. Ask a pharmacist or prescriber
            about a replacement, refrigeration failure or a missed dose. Do not
            share prescriptions or substitute someone else’s medicine.
          </p>
          <h3>Pet food</h3>
          <p>
            Keep the original food bag or labeled can information, including the
            lot and best-by date. Store dry food as directed, cool and dry;
            promptly refrigerate or discard unused opened wet food according to
            the label. Without reliable refrigeration, choose portions your pet
            can finish. Species, formulation, packaging and opening change
            storage limits, so no single shelf life is assigned to all pet
            foods.
          </p>
          <p>
            For prescribed diets or medicines, ask the veterinarian about a safe
            reserve and storage plan. Do not feed spoiled or recalled food, or
            give human medicines to an animal.
          </p>
          <p className="small muted">
            Sources:{" "}
            <a
              href="https://www.fda.gov/drugs/special-features/dont-be-tempted-use-expired-medicines"
              target="_blank"
              rel="noreferrer"
            >
              FDA expired medicines
            </a>
            ;{" "}
            <a
              href="https://www.fda.gov/animal-veterinary/animal-health-literacy/tips-safe-handling-pet-food-and-treats"
              target="_blank"
              rel="noreferrer"
            >
              FDA pet-food handling
            </a>
            . Links open online.
          </p>
          <p>
            <a href="#/health">Health concerns</a> ·{" "}
            <a href="#/pets">Pet preparedness</a>
          </p>
        </section>
      )}
      <p className="small muted">
        In Supplies, classify each entered date as quality, expiry or review.
        Past dates are conservatively excluded from readiness totals until
        reviewed; this is a planning rule, not a finding that food is unsafe.
      </p>
    </>
  );
}
