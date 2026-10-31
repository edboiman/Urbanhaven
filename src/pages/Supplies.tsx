import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "../storage/idb";
import { db, uid, todayISO } from "../storage/db";
import { exportBackup, saveFile } from "../storage/backup";
import { supplyCategories, type Supply, type ConsumptionEntry, type SupplyCategory } from "../types";
import { allDefinitions, isUsable, supplyMeasure, fmt } from "../checklist/model";
import { addDays } from "../garden/plan";
import { pantryTagOptions } from "../meals/planner";
import { PageTitle, Field, Empty, Callout, SectionHeading, useHaven, s, n, errorMessage } from "../components/shared";
import { parseRoute } from "../components/route";
import { Plus, Search, Trash2, Pencil, Download, Save, X, Minus } from "../components/icons";

const blankSupply = (p: Partial<Supply> = {}): Supply => ({
  id: uid(), name: "", category: "water", quantity: 1, unit: "item", location: "", expires: "", acquired: todayISO(),
  condition: "ready", notes: "", lowStock: 0, waterLiters: 0, servings: 0, calories: 0, checklistId: "", perUnit: 1, ...p,
});

export function Supplies() {
  const { toast } = useHaven();
  const items = useLiveQuery(() => db.supplies.toArray(), [], []) || [];
  const states = useLiveQuery(() => db.checklist.toArray(), [], []) || [];
  const log = useLiveQuery(() => db.consumption.byIndex("date", "prev", 30), [], []) || [];
  const defs = useMemo(() => allDefinitions(states).filter((d) => d.kind === "quantity"), [states]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Supply | null>(null);
  const [using, setUsing] = useState<Supply | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const today = todayISO();
  const soon = addDays(today, 30);
  // Deep links from the checklist: #/supplies?add=<checklistId> or ?edit=<supplyId>
  useEffect(() => {
    const apply = () => {
      const { path, params } = parseRoute();
      if (path !== "supplies") return;
      const add = params.get("add");
      const edit = params.get("edit");
      if (add) {
        const def = allDefinitions(states).find((d) => d.id === add);
        if (def)
          setEditing(
            blankSupply({
              checklistId: def.id,
              name: def.name.replace(/\s*\(.*\)$/, ""),
              category: (supplyCategories as readonly string[]).includes(def.category) ? (def.category as SupplyCategory) : "other",
              unit: def.unit === "L" ? "container" : def.unit === "kcal" ? "can" : def.unit,
              quantity: 1,
            }),
          );
      } else if (edit) {
        const item = items.find((x) => x.id === edit);
        if (item) setEditing({ perUnit: 1, checklistId: "", ...item });
      }
    };
    apply();
  }, [states.length, items.length]);
  const status = (x: Supply) =>
    x.expires && x.expires < today
      ? "Expired"
      : x.condition === "damaged"
        ? "Damaged"
        : x.condition !== "ready"
          ? "Needs checking"
          : x.quantity <= 0
            ? "Used up"
            : x.quantity <= x.lowStock
              ? "Low stock"
              : x.expires && x.expires <= soon
                ? "Rotate soon"
                : "Ready";
  const shown = items
    .filter((x) => (filter === "all" || x.category === filter) && `${x.name} ${x.location} ${x.notes}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  const linkName = (x: Supply) => {
    const d = x.checklistId ? defs.find((d) => d.id === x.checklistId) : defs.find((d) => d.autoCategory === x.category);
    return d?.name;
  };
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const tags = s(f, "pantryTags").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12);
      const record: Supply = {
        ...editing,
        name: s(f, "name"),
        category: s(f, "category") as Supply["category"],
        quantity: n(f, "quantity"),
        unit: s(f, "unit") || "item",
        location: s(f, "location"),
        expires: s(f, "expires"),
        acquired: s(f, "acquired"),
        condition: s(f, "condition"),
        notes: s(f, "notes"),
        lowStock: n(f, "lowStock"),
        waterLiters: f.has("waterLiters") ? n(f, "waterLiters") * (f.get("waterUnit") === "gal" ? 3.785411784 : 1) : editing.waterLiters,
        servings: f.has("servings") ? n(f, "servings") : editing.servings,
        calories: f.has("calories") ? n(f, "calories") : editing.calories,
        checklistId: s(f, "checklistId"),
        perUnit: f.has("perUnit") ? Math.max(0, n(f, "perUnit")) || 1 : editing.perUnit,
        pantryTags: f.has("pantryTags") ? tags : editing.pantryTags,
        sodiumMg: f.has("sodiumMg") && s(f, "sodiumMg") !== "" ? n(f, "sodiumMg") : editing.sodiumMg,
        proteinG: f.has("proteinG") && s(f, "proteinG") !== "" ? n(f, "proteinG") : editing.proteinG,
        refrigerateAfterOpening: f.has("refrigerate") ? f.get("refrigerate") === "on" : editing.refrigerateAfterOpening,
      };
      const nums = [record.quantity, record.lowStock, record.waterLiters, record.servings, record.calories, record.perUnit || 1];
      if (!record.name || nums.some((x) => !Number.isFinite(x) || x < 0 || x > 1e7)) throw new Error("Enter a name and valid nonnegative quantities.");
      if (record.category === "water" && record.waterLiters <= 0 && (!record.checklistId || record.checklistId.startsWith("water")))
        throw new Error("Enter the liters (or gallons) in each unit so water can be counted.");
      const prev = items.find((x) => x.id === record.id);
      await db.transaction("rw", ["supplies", "consumption"], async (t) => {
        await t<Supply>("supplies").put(record);
        if (prev && prev.quantity !== record.quantity)
          await t<ConsumptionEntry>("consumption").put({
            id: uid(), supplyId: record.id, supplyName: record.name, date: today, amount: Math.abs(prev.quantity - record.quantity),
            unit: record.unit, reason: "corrected", note: `Quantity edited ${prev.quantity} → ${record.quantity}`,
          });
      });
      setEditing(null);
      if (location.hash.includes("?")) history.replaceState(null, "", "#/supplies");
      toast("Saved on this device. Checklist recalculated.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  const usable = items.filter((x) => isUsable(x, today));
  const water = usable.filter((x) => x.category === "water" && !x.checklistId).reduce((a, x) => a + supplyMeasure(x, "liters"), 0);
  const kcal = usable.filter((x) => x.category === "food").reduce((a, x) => a + supplyMeasure(x, "kcal"), 0);
  return (
    <>
      <PageTitle
        eyebrow="KNOW WHAT YOU HAVE"
        title="Supplies & inventory."
        description="Every quantity on your checklist is counted from these records. Record what you use, and the checklist and shopping list update."
        action={
          <button className="button" onClick={() => { setEditing(blankSupply()); setError(""); }}>
            <Plus size={17} /> Add a supply
          </button>
        }
      />
      <div className="mini-stats">
        <div><strong>{items.length}</strong><span>Records</span></div>
        <div><strong>{fmt(water, "L").split(" (")[0]}</strong><span>Usable drinking water</span></div>
        <div><strong>{Math.round(kcal).toLocaleString()}</strong><span>Usable pantry kcal</span></div>
        <div><strong>{items.filter((x) => x.expires && x.expires <= soon && x.quantity > 0).length}</strong><span>Expired / due within 30 days</span></div>
      </div>
      {editing && (
        <form className="panel edit-form" onSubmit={save} key={editing.id}>
          <SectionHeading title={items.some((x) => x.id === editing.id) ? "Edit supply" : "Add a supply"}>
            <button type="button" className="icon-button" onClick={() => setEditing(null)} aria-label="Cancel editing"><X /></button>
          </SectionHeading>
          <div className="form-grid">
            <Field label="Item name">
              <input name="name" required maxLength={120} defaultValue={editing.name} autoFocus placeholder="e.g. 1-gallon water jugs" />
            </Field>
            <Field label="Category">
              <select name="category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as Supply["category"] })}>
                {supplyCategories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Quantity on hand">
              <input name="quantity" type="number" min="0" max="10000000" step="any" required defaultValue={editing.quantity} />
            </Field>
            <Field label="Unit">
              <input name="unit" maxLength={30} defaultValue={editing.unit} placeholder="jugs, cans, packs…" />
            </Field>
            <Field label="Counts toward checklist item" hint="Automatic: water → drinking water; food → food energy.">
              <select name="checklistId" defaultValue={editing.checklistId || ""}>
                <option value="">Automatic by category</option>
                {defs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            {editing.category !== "water" && editing.category !== "food" && (
              <Field label="Checklist units in EACH unit" hint="e.g. a 4-pack of battery sets = 4. Usually 1.">
                <input name="perUnit" type="number" min="0" step="any" defaultValue={editing.perUnit ?? 1} />
              </Field>
            )}
            <Field label="Storage location">
              <input name="location" maxLength={120} defaultValue={editing.location} placeholder="Basement shelf, car trunk…" />
            </Field>
            <Field label="Condition">
              <select name="condition" defaultValue={editing.condition}>
                <option value="ready">Ready (checked)</option>
                <option value="needs-check">Needs checking (not counted)</option>
                <option value="damaged">Damaged / unusable (not counted)</option>
              </select>
            </Field>
            <Field label="Expiration / rotation date">
              <input type="date" name="expires" defaultValue={editing.expires} />
            </Field>
            <Field label="Date acquired / filled">
              <input type="date" name="acquired" defaultValue={editing.acquired} />
            </Field>
            <Field label="Warn at quantity or below">
              <input type="number" name="lowStock" min="0" step="any" defaultValue={editing.lowStock} />
            </Field>
            {editing.category === "water" && (
              <WaterVolumeField liters={editing.waterLiters} />
            )}
            {editing.category === "food" && (
              <>
                <Field label="Servings in EACH unit" hint="From the Nutrition Facts label.">
                  <input name="servings" type="number" min="0" max="100000" step="any" defaultValue={editing.servings} />
                </Field>
                <Field label="Calories per serving (kcal)">
                  <input name="calories" type="number" min="0" max="100000" step="any" defaultValue={editing.calories} />
                </Field>
                <Field label="Sodium per serving (mg, optional)">
                  <input name="sodiumMg" type="number" min="0" max="100000" step="any" defaultValue={editing.sodiumMg ?? ""} />
                </Field>
                <Field label="Protein per serving (g, optional)">
                  <input name="proteinG" type="number" min="0" max="1000" step="any" defaultValue={editing.proteinG ?? ""} />
                </Field>
                <Field label="Meal-planner tags" hint={`Comma separated, e.g. ${pantryTagOptions.slice(0, 6).join(", ")}`}>
                  <input name="pantryTags" maxLength={300} list="pantry-tags" defaultValue={(editing.pantryTags || []).join(", ")} />
                  <datalist id="pantry-tags">{pantryTagOptions.map((t) => <option key={t} value={t} />)}</datalist>
                </Field>
                <label className="check-label">
                  <input type="checkbox" name="refrigerate" defaultChecked={editing.refrigerateAfterOpening ?? false} />
                  Label says refrigerate after opening
                </label>
              </>
            )}
          </div>
          <Field label="Notes">
            <textarea name="notes" maxLength={4000} defaultValue={editing.notes} placeholder="Inspection, refill needs, special instructions…" />
          </Field>
          {editing.category === "medication" && (
            <p className="small muted">Reminders appear inside this app only. Follow your pharmacist's storage instructions; the app sets no doses.</p>
          )}
          {error && <p role="alert" className="error">{error}</p>}
          <div className="form-actions">
            <button className="button" disabled={busy}><Save size={16} />{busy ? "Saving…" : "Save supply"}</button>
            <button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
      {using && <UseForm item={using} onClose={() => setUsing(null)} />}
      <div className="toolbar">
        <div className="search-input">
          <Search size={18} />
          <input aria-label="Search supplies" placeholder="Search items or locations…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Filter supply category" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All supplies</option>
          {supplyCategories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button
          className="button secondary"
          onClick={async () => {
            try {
              saveFile(new Blob([JSON.stringify(await exportBackup(false), null, 2)], { type: "application/json" }), `urban-haven-backup-${today}.json`);
              toast("Backup exported (sensitive notebook entries left out). Keep a copy off this phone.");
            } catch (e) {
              toast(errorMessage(e));
            }
          }}
        >
          <Download size={16} /> Export
        </button>
      </div>
      {shown.length ? (
        <div className="panel inventory-list">
          {shown.map((item) => {
            const st = status(item);
            return (
              <div className="inventory-row" key={item.id}>
                <span className={"inventory-dot " + (st === "Ready" ? "good" : "warn")} />
                <div className="inventory-name">
                  <strong>{item.name}</strong>
                  <small>
                    {item.category} · {item.location || "No location set"}
                    {linkName(item) ? ` · counts toward: ${linkName(item)}` : ""}
                  </small>
                </div>
                <div className="inventory-quantity">
                  <strong>{item.quantity} {item.unit}</strong>
                  {item.category === "water" && item.waterLiters > 0 && <small>{fmt(item.quantity * item.waterLiters, "L")}</small>}
                  {item.category === "food" && <small>{(item.quantity * item.servings * item.calories).toLocaleString()} kcal</small>}
                </div>
                <div className="inventory-status">
                  <span className={"status-badge " + (st === "Ready" ? "good" : "warn")}>{st}</span>
                  <small>{item.expires || "No date set"}</small>
                </div>
                <div className="row-actions">
                  <button className="button secondary compact" onClick={() => setUsing(item)} disabled={item.quantity <= 0} aria-label={`Use or discard ${item.name}`}>
                    <Minus size={15} /> Use
                  </button>
                  <button className="icon-button" aria-label={"Edit " + item.name} onClick={() => { setEditing({ perUnit: 1, checklistId: "", ...item }); setError(""); window.scrollTo({ top: 0 }); }}>
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Delete " + item.name}
                    onClick={async () => {
                      if (confirm(`Delete ${item.name}? Use “Use” instead if you consumed it, so the history is kept.`))
                        await db.supplies.delete(item.id).then(() => toast("Supply deleted.")).catch((e) => toast(errorMessage(e)));
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty title={items.length ? "Nothing matches this search." : "Your next step starts here."}>
          {items.length ? "Try another category or search." : "Add the water you already have, then build up the rest a little at a time."}
        </Empty>
      )}
      {log.length > 0 && (
        <details className="panel">
          <summary>Recent use & changes ({log.length})</summary>
          <ul className="usage-log">
            {log.map((x) => (
              <li key={x.id}>
                {x.date} · {x.supplyName}: {x.reason} {x.amount} {x.unit}
                {x.note ? ` — ${x.note}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
      <Callout>
        Only records marked Ready and not past their date are counted. Damaged, unchecked and expired records stay listed but are excluded from
        the checklist, water and calorie totals. This app cannot inspect the safety of your supplies.
      </Callout>
    </>
  );
}

function WaterVolumeField({ liters }: { liters: number }) {
  const [unit, setUnit] = useState<"L" | "gal">("L");
  return (
    <Field label="Volume of EACH unit" hint="24 half-liter bottles: quantity 24, volume 0.5 L. A 1-gallon jug: 1 gal.">
      <div className="inline-pair">
        <input name="waterLiters" type="number" min="0" max="100000" step="any" defaultValue={liters ? +(unit === "gal" ? liters / 3.785411784 : liters).toFixed(3) : ""} key={unit} />
        <select name="waterUnit" aria-label="Volume unit" value={unit} onChange={(e) => setUnit(e.target.value as "L" | "gal")}>
          <option value="L">liters</option>
          <option value="gal">US gallons</option>
        </select>
      </div>
    </Field>
  );
}

function UseForm({ item, onClose }: { item: Supply; onClose: () => void }) {
  const { toast } = useHaven();
  return (
    <form
      className="panel edit-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const amount = Number(f.get("amount"));
        const reason = String(f.get("reason")) as ConsumptionEntry["reason"];
        try {
          if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
          if (amount > item.quantity) throw new Error(`You only have ${item.quantity} ${item.unit}.`);
          await db.transaction("rw", ["supplies", "consumption"], async (t) => {
            const fresh = (await t<Supply>("supplies").get(item.id)) || item;
            await t<Supply>("supplies").put({ ...fresh, quantity: Math.round((fresh.quantity - amount) * 1000) / 1000 });
            await t<ConsumptionEntry>("consumption").put({
              id: uid(), supplyId: item.id, supplyName: item.name, date: todayISO(), amount, unit: item.unit, reason,
              note: String(f.get("note") || "").slice(0, 500),
            });
          });
          toast(`Recorded: ${reason} ${amount} ${item.unit}. Checklist and shopping list updated.`);
          onClose();
        } catch (err) {
          toast(errorMessage(err));
        }
      }}
    >
      <SectionHeading title={`Use or remove: ${item.name}`}>
        <button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X /></button>
      </SectionHeading>
      <div className="form-grid">
        <Field label={`Amount (${item.unit}) — you have ${item.quantity}`}>
          <input name="amount" type="number" min="0" step="any" defaultValue={1} autoFocus />
        </Field>
        <Field label="Why">
          <select name="reason" defaultValue="used">
            <option value="used">Used / eaten / drunk</option>
            <option value="damaged">Damaged</option>
            <option value="expired">Expired</option>
            <option value="discarded">Discarded (e.g. flood-exposed)</option>
          </select>
        </Field>
        <Field label="Note (optional)">
          <input name="note" maxLength={500} />
        </Field>
      </div>
      <button className="button"><Minus size={15} /> Record</button>
    </form>
  );
}
