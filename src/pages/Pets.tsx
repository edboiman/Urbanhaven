import { useEffect, useState } from "react";
import content from "../content/pet-preparedness.json";
import { useLiveQuery } from "../storage/idb";
import { db, uid } from "../storage/db";
import { blankPet, readPet, petTargets, type PetProfile } from "../pets/model";
import {
  PageTitle,
  Field,
  Callout,
  useHaven,
  errorMessage,
} from "../components/shared";
export function Pets() {
  const { settings, toast } = useHaven();
  const plans = useLiveQuery(() => db.plans.toArray(), [], []) || [];
  const profiles = plans.filter((p) => p.id.startsWith("pet-profile-"));
  const kit = (plans.find((p) => p.id === "pet-kit")?.data || {
    checks: [],
  }) as { checks: string[] };
  const [kitChecks, setKitChecks] = useState<string[]>([]),
    [kitBusy, setKitBusy] = useState(false);
  useEffect(() => setKitChecks(kit.checks), [JSON.stringify(kit.checks)]);
  const [id, setId] = useState("pet-profile-primary"),
    [section, setSection] = useState(content.sections[0]?.id || "");
  const record = profiles.find((p) => p.id === id),
    g = content.sections.find((s) => s.id === section)!;
  return (
    <>
      <PageTitle
        eyebrow="PET PREPAREDNESS"
        title="Include every animal in the plan."
        description="Food, water, medicines, safe shelter and an evacuation plan tailored to your pet. Store written veterinary instructions and contacts before services are disrupted."
      />
      <Callout danger>
        <strong>Use your veterinarian’s plan for treatment.</strong>
        <p>
          Do not give human medicines or another animal’s prescription unless
          your veterinarian specifically directs their use for this animal.
          Breathing difficulty, collapse, seizures, uncontrolled bleeding,
          suspected poisoning, heat illness or inability to urinate require
          urgent veterinary help. Plan transport and backup clinics in advance.
        </p>
      </Callout>
      <section className="panel">
        <h2>Your pet kit</h2>
        <p>
          {
            kitChecks.filter((id) => content.kit.some((k) => k.id === id))
              .length
          }{" "}
          of {content.kit.length} preparation steps checked. Mark ready only
          after checking quantities, expiry dates and the needs of every pet.
        </p>
        <div className="pet-kit">
          {content.kit.map((k) => (
            <label className="check-label" key={k.id}>
              <input
                type="checkbox"
                checked={kitChecks.includes(k.id)}
                disabled={kitBusy}
                onChange={async (e) => {
                  const previous = kitChecks;
                  const checks = e.target.checked
                    ? [...kitChecks, k.id]
                    : kitChecks.filter((id) => id !== k.id);
                  setKitChecks(checks);
                  setKitBusy(true);
                  try {
                    await db.plans.put({
                      id: "pet-kit",
                      data: { checks },
                      updated: new Date().toISOString(),
                    });
                  } catch (e) {
                    setKitChecks(previous);
                    toast(errorMessage(e));
                  } finally {
                    setKitBusy(false);
                  }
                }}
              />
              <span>
                <strong>{k.name}</strong>
                <small className="block">{k.detail}</small>
              </span>
            </label>
          ))}
        </div>
        <p>
          <a href="#/checklist">
            Set household pet count and check the main 14-day supplies list
          </a>
          . Pet food and water are additional to human supplies.
        </p>
      </section>
      <section className="panel">
        <h2>Offline pet records & quantities</h2>
        <div className="action-row">
          <Field label="Pet record">
            <select value={id} onChange={(e) => setId(e.target.value)}>
              <option value="pet-profile-primary">Primary pet</option>
              {id !== "pet-profile-primary" &&
                !profiles.some((p) => p.id === id) && (
                  <option value={id}>New pet (unsaved)</option>
                )}
              {profiles
                .filter((p) => p.id !== "pet-profile-primary")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.data as PetProfile).name || "Pet record"}
                  </option>
                ))}
            </select>
          </Field>
          <button
            className="button secondary"
            onClick={() => setId("pet-profile-" + uid())}
          >
            Add another pet
          </button>
        </div>
        <PetForm
          key={id + (record?.updated || "new")}
          id={id}
          initial={record ? readPet(record.data) : blankPet()}
          days={Math.max(1, Math.min(365, Math.round(settings.days || 14)))}
        />
      </section>
      <section className="panel">
        <Field label="Pet care topic">
          <select value={section} onChange={(e) => setSection(e.target.value)}>
            {content.sections.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </Field>
        <h2>{g.title}</h2>
        <p>{g.summary}</p>
        <ol className="article-list">
          {g.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <Callout danger>
          <ul className="article-list">
            {g.warnings.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Callout>
        <p className="small muted">
          <a href={g.sourceUrl} target="_blank" rel="noreferrer">
            Reference (opens online)
          </a>{" "}
          · content updated {content.reviewed}
        </p>
      </section>
    </>
  );
}
function PetForm({
  id,
  initial,
  days,
}: {
  id: string;
  initial: PetProfile;
  days: number;
}) {
  const { toast } = useHaven();
  const [pet, setPet] = useState(initial),
    [busy, setBusy] = useState(false);
  const totals = petTargets(pet, days);
  const text = (key: keyof PetProfile, value: string) =>
    setPet({ ...pet, [key]: value });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          if (!pet.name.trim()) throw new Error("Name this pet.");
          await db.plans.put({
            id,
            data: readPet(pet),
            updated: new Date().toISOString(),
          });
          toast("Pet record saved on this device.");
        } catch (e) {
          toast(errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <Field label="Pet name">
          <input
            required
            maxLength={120}
            value={pet.name}
            onChange={(e) => text("name", e.target.value)}
          />
        </Field>
        <Field label="Species / breed">
          <input
            maxLength={120}
            value={pet.species}
            onChange={(e) => text("species", e.target.value)}
          />
        </Field>
        <Field
          label="Usual food per day (grams)"
          hint="Your pet’s normal ration / vet plan, not a generic weight formula."
        >
          <input
            type="number"
            min={0}
            max={100000}
            step="any"
            value={pet.dailyFoodGrams}
            onChange={(e) =>
              setPet({
                ...pet,
                dailyFoodGrams: Math.min(
                  100000,
                  Math.max(0, Number(e.target.value) || 0),
                ),
              })
            }
          />
        </Field>
        <Field
          label="Planned drinking water per day (liters)"
          hint="Set with your vet; species, diet, health, heat and activity change needs."
        >
          <input
            type="number"
            min={0}
            max={1000}
            step="any"
            value={pet.dailyWaterLiters}
            onChange={(e) =>
              setPet({
                ...pet,
                dailyWaterLiters: Math.min(
                  1000,
                  Math.max(0, Number(e.target.value) || 0),
                ),
              })
            }
          />
        </Field>
      </div>
      <p>
        <strong>{days}-day amount for this pet:</strong>{" "}
        {(totals.foodGrams / 1000).toFixed(2)} kg food;{" "}
        {totals.waterLiters.toFixed(2)} L drinking water.{" "}
        {(!pet.dailyFoodGrams || !pet.dailyWaterLiters) &&
          "Set both daily amounts before relying on this plan."}{" "}
        Add separate cleaning water, safe storage and a practical reserve.
      </p>
      {(
        [
          ["medications", "Medicines, dose label, storage & refill plan"],
          ["vet", "Regular vet and backup clinic contacts"],
          ["contacts", "Identification, microchip & trusted caregiver"],
          ["transport", "Carrier / leash, destination & evacuation transport"],
          [
            "instructions",
            "Diet, behavior, medical needs & written veterinary instructions",
          ],
        ] as const
      ).map(([k, l]) => (
        <Field key={k} label={l}>
          <textarea
            maxLength={4000}
            value={pet[k]}
            onChange={(e) => text(k, e.target.value)}
          />
        </Field>
      ))}
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : "Save pet record"}
      </button>
      <p className="small muted">
        These records and pet kit checks are included in backups. They are
        stored locally and are not encrypted. Sensitive-notebook filtering does
        not exclude pet records. Import copies of vaccination documents through
        Documents for offline reference; PDF originals must be transferred
        separately.
      </p>
    </form>
  );
}
