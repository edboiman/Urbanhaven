import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "../storage/idb";
import { db, setPreferences, todayISO, uid } from "../storage/db";
import { saveFile } from "../storage/backup";
import {
  computeChecklist,
  sections,
  sectionLabel,
  statusLabel,
  shoppingList,
  reminders,
  fmt,
  basisLabel,
  toCSV,
  v1CheckMap,
  type Row,
  type Status,
} from "../checklist/model";
import { checklistSources } from "../checklist/sources";
import { needsFlags, type Basis, type ChecklistDefinition, type ChecklistState, type ConsumptionEntry, type NeedFlag, type Supply } from "../types";
import { PageTitle, Field, Callout, useHaven, errorMessage } from "../components/shared";
import { go } from "../components/route";
import {
  Check,
  Plus,
  Minus,
  Printer,
  ShoppingCart,
  Download,
  Info,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Save,
  AlertTriangle,
  Calendar,
  ListChecks,
} from "../components/icons";
import { LITERS_PER_GALLON } from "../calculators";

export const needLabels: Record<NeedFlag, string> = {
  infant: "Infant / toddler",
  child: "Children",
  "older-adult": "Older adult",
  mobility: "Mobility aid or limited mobility",
  "power-medical": "Power-dependent medical equipment",
  prescriptions: "Daily prescription medicines",
  glasses: "Glasses / contacts",
  "hearing-vision": "Hearing or vision needs",
  dietary: "Special diet or allergies",
  "no-vehicle": "No vehicle / needs transport",
};

export function useChecklist() {
  const { settings } = useHaven();
  const supplies = useLiveQuery(() => db.supplies.toArray(), [], []) || [];
  const states = useLiveQuery(() => db.checklist.toArray(), [], []) || [];
  const today = todayISO();
  const result = useMemo(() => computeChecklist(settings, supplies, states, today), [settings, supplies, states, today]);
  return { ...result, supplies, states, today };
}

export async function saveState(id: string, patch: Partial<ChecklistState>) {
  const current = await db.checklist.get(id);
  await db.checklist.put({ ...(current || {}), ...patch, id, updated: new Date().toISOString() });
}

/** One-time carry-over of v1.0.0 self-report checks into checklist tasks. */
export async function migrateV1Checks(checks: string[]) {
  const today = todayISO();
  for (const check of checks)
    for (const id of v1CheckMap[check] || [])
      if (!(await db.checklist.get(id))?.lastDone)
        await saveState(id, { lastDone: today, notes: "Carried over from the v1 self-check. Review and re-confirm." });
  await setPreferences({ checklistMigrated: true });
}

const statusOrder: Status[] = ["needed", "partial", "inspect", "ready", "na"];
export function StatusBadge({ status }: { status: Status }) {
  return <span className={"status-badge st-" + status}>{statusLabel[status]}</span>;
}

export function Checklist() {
  const { settings, toast } = useHaven();
  const { rows, hidden, summary, household, supplies, today } = useChecklist();
  const [tab, setTab] = useState<"items" | "shopping" | "household">("items");
  const [status, setStatus] = useState<"all" | Status | "open">("open");
  const [section, setSection] = useState("all");
  const [kind, setKind] = useState<"all" | "quantity" | "task">("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    if (!settings.checklistMigrated && settings.checks.length) void migrateV1Checks(settings.checks).catch((e) => toast(errorMessage(e)));
  }, [settings.checklistMigrated, settings.checks.length]);
  const shown = rows.filter(
    (r) =>
      (status === "all" || (status === "open" ? r.status !== "ready" && r.status !== "na" : r.status === status)) &&
      (section === "all" || r.def.section === section) &&
      (kind === "all" || r.def.kind === kind) &&
      (!query || (r.name + " " + r.def.why).toLowerCase().includes(query.toLowerCase())),
  );
  const due = reminders(rows, supplies, today, 14);
  const blockers = rows.filter((r) => r.status === "needed" || r.status === "inspect" || r.status === "partial");
  return (
    <>
      <PageTitle
        eyebrow={`${household.days}-DAY HOUSEHOLD PLAN · ${household.people} ${household.people === 1 ? "PERSON" : "PEOPLE"}${household.pets ? ` · ${household.pets} PET${household.pets > 1 ? "S" : ""}` : ""}`}
        title="Your living checklist."
        description="Quantities come straight from your inventory, so there is one number to keep up to date. Change the household and every requirement and gap recalculates."
        action={
          <div className="action-row">
            <button className="button secondary" onClick={() => go("checklist/print")}>
              <Printer size={16} /> Print
            </button>
          </div>
        }
      />
      <section className="panel checklist-summary" aria-live="polite">
        <div className="summary-counts">
          {(["ready", "partial", "needed", "inspect", "na"] as Status[]).map((s) => (
            <button key={s} className={"count-tile st-" + s + (status === s ? " active" : "")} onClick={() => setStatus(status === s ? "open" : s)}>
              <strong>{summary[s]}</strong>
              <span>{statusLabel[s]}</span>
            </button>
          ))}
        </div>
        <p>
          <strong>
            {summary.ready} of {summary.applicable} applicable items are ready.
          </strong>{" "}
          “Ready” means the counted, unexpired, checked inventory meets the requirement shown on the item, or a task was done within its
          repeat interval. Nothing is scored or weighted.
        </p>
        {blockers.length > 0 && (
          <p className="small muted">
            Not ready yet: {blockers.slice(0, 4).map((r) => `${r.name} (${statusLabel[r.status].toLowerCase()})`).join("; ")}
            {blockers.length > 4 ? `; and ${blockers.length - 4} more.` : "."}
          </p>
        )}
        <p className="small muted">
          The 14-day target is this app's extended planning assumption. Ready.gov asks for “several days” of water and food; CDC suggests
          trying for a 2-week water supply. Items are labeled <span className="origin official">Official</span>,{" "}
          <span className="origin app">App assumption</span> or <span className="origin household">Your amount</span>.
        </p>
      </section>
      {household.days < 14 && (
        <div className="callout">
          Your plan is set to {household.days} days. This app's extended planning target is 14 days (CDC suggests trying for a 2-week water
          supply).{" "}
          <button className="text-link" onClick={() => void setPreferences({ days: 14 }).catch((e) => toast(errorMessage(e)))}>
            Switch to 14 days
          </button>
        </div>
      )}
      {due.length > 0 && (
        <section className="panel reminders" aria-label="Maintenance reminders">
          <h2>
            <Calendar size={18} /> Maintenance due in the next 14 days
          </h2>
          <ul>
            {due.slice(0, 8).map((r) => (
              <li key={r.id} className={r.due < today ? "overdue" : ""}>
                <a href={"#/" + r.link}>{r.text}</a> <small>{r.due < today ? `overdue since ${r.due}` : `due ${r.due}`}</small>
              </li>
            ))}
          </ul>
          <p className="small muted">Reminders appear only inside this app. There are no background notifications.</p>
        </section>
      )}
      <div className="tabs" role="tablist" aria-label="Checklist views">
        {[
          ["items", "Checklist"],
          ["shopping", "Shopping list"],
          ["household", "Household"],
        ].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id as typeof tab)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "household" && <HouseholdPanel />}
      {tab === "shopping" && <Shopping rows={rows} />}
      {tab === "items" && (
        <>
          <div className="toolbar checklist-toolbar">
            <input aria-label="Search checklist" placeholder="Search items…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="open">Not ready (open)</option>
              <option value="all">All statuses</option>
              {statusOrder.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
            <select aria-label="Filter by section" value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="all">All sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select aria-label="Supplies or tasks" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="all">Supplies & tasks</option>
              <option value="quantity">Supplies (quantities)</option>
              <option value="task">Tasks</option>
            </select>
          </div>
          <p className="small muted">
            Showing {shown.length} of {rows.length} items.{" "}
            {status === "open" && summary.ready > 0 && (
              <button className="text-link" onClick={() => setStatus("all")}>
                Show ready items too
              </button>
            )}
          </p>
          {sections
            .filter((s) => shown.some((r) => r.def.section === s.id))
            .map((s) => (
              <section key={s.id} className="checklist-section">
                <h2>{s.label}</h2>
                <div className="panel checklist-list">
                  {shown
                    .filter((r) => r.def.section === s.id)
                    .map((r) => (
                      <ChecklistRow key={r.def.id} row={r} />
                    ))}
                </div>
              </section>
            ))}
          {!shown.length && (
            <div className="empty">
              <ListChecks size={30} />
              <h3>{rows.length ? "Nothing matches these filters." : "No items."}</h3>
              <p>Try “All statuses” or another section.</p>
            </div>
          )}
          <div className="action-row">
            <button className="button" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add your own item
            </button>
            <button
              className="button secondary"
              onClick={() => saveFile(new Blob([toCSV(rows)], { type: "text/csv" }), `urban-haven-checklist-${today}.csv`)}
            >
              <Download size={16} /> Export CSV
            </button>
            <a className="button secondary" href="#/settings">
              Backup & import
            </a>
          </div>
          {adding && <CustomItemForm onClose={() => setAdding(false)} />}
          {hidden.length > 0 && (
            <details className="panel">
              <summary>Removed items ({hidden.length})</summary>
              {hidden.map((d) => (
                <div className="hidden-row" key={d.id}>
                  <span>{d.name}</span>
                  <button className="button secondary" onClick={() => void saveState(d.id, { hidden: false }).catch((e) => toast(errorMessage(e)))}>
                    <RotateCcw size={15} /> Restore
                  </button>
                </div>
              ))}
            </details>
          )}
        </>
      )}
    </>
  );
}

function SourceLine({ def }: { def: ChecklistDefinition }) {
  const s = def.source ? checklistSources[def.source] : undefined;
  return (
    <p className="small source-line">
      <span className={"origin " + def.origin}>
        {def.origin === "official" ? "Official recommendation" : def.origin === "app" ? "App assumption" : "Your amount"}
      </span>{" "}
      {s && (
        <>
          {s.org}:{" "}
          <a href={s.url} target="_blank" rel="noreferrer">
            {s.title}
          </a>{" "}
          <small>(reviewed {s.reviewed}; link opens online)</small>
          {s.note && <span className="muted"> — {s.note}</span>}
        </>
      )}
    </p>
  );
}

function ChecklistRow({ row: r }: { row: Row }) {
  const { toast, settings } = useHaven();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const today = todayISO();
  const act = (p: Promise<unknown>, done?: string) => void p.then(() => done && toast(done)).catch((e) => toast(errorMessage(e)));
  const adjust = async (s: Supply, delta: number) => {
    const quantity = Math.max(0, Math.round((s.quantity + delta) * 1000) / 1000);
    await db.transaction("rw", ["supplies", "consumption"], async (t) => {
      await t<Supply>("supplies").put({ ...s, quantity });
      await t<ConsumptionEntry>("consumption").put({
        id: uid(), supplyId: s.id, supplyName: s.name, date: today, amount: Math.abs(delta), unit: s.unit,
        reason: delta < 0 ? "used" : "restocked", note: "Adjusted from checklist",
      });
    });
  };
  const percentText =
    r.def.kind === "quantity" && r.rate !== null && r.status !== "na"
      ? `${fmt(r.owned, r.unit)} of ${fmt(r.required, r.unit)}`
      : r.def.kind === "task"
        ? r.state?.lastDone
          ? `Done ${r.state.lastDone}`
          : "Not done"
        : r.status === "na"
          ? ""
          : "Amount not set";
  return (
    <div className={"check-row st-" + r.status}>
      <div className="check-main">
        {r.def.kind === "task" && r.status !== "na" ? (
          <input
            type="checkbox"
            className="big-check"
            aria-label={`Mark “${r.name}” done`}
            checked={!!r.state?.lastDone && r.status === "ready"}
            onChange={(e) => act(saveState(r.def.id, { lastDone: e.target.checked ? today : "" }), e.target.checked ? "Marked done today." : "Marked not done.")}
          />
        ) : (
          <span className={"status-dot st-" + r.status} aria-hidden="true" />
        )}
        <button className="check-title" aria-expanded={open} onClick={() => setOpen(!open)}>
          <strong>{r.name}</strong>
          <small>
            {percentText}
            {r.gap > 0 && r.status !== "na" ? ` · need ${fmt(r.gap, r.unit)} more` : ""}
            {r.locations.length ? ` · ${r.locations.join(", ")}` : ""}
            {r.nextExpiry ? ` · next date ${r.nextExpiry}` : ""}
            {r.dueDate ? ` · repeat by ${r.dueDate}` : ""}
          </small>
        </button>
        <StatusBadge status={r.status} />
      </div>
      {open && (
        <div className="check-detail">
          {r.reasons.length > 0 && (
            <ul className="reasons">
              {r.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
          {r.explanation && <p className="explain">{r.explanation}</p>}
          <p>{r.def.why}</p>
          <SourceLine def={r.def} />
          {r.def.kind === "quantity" && r.status !== "na" && (
            <div className="linked">
              <h4>Counted inventory</h4>
              {r.linked.length ? (
                r.linked.map((s) => (
                  <div className="linked-row" key={s.id}>
                    <span>
                      {s.name} · {s.quantity} {s.unit}
                      {s.condition !== "ready" ? ` · ${s.condition === "damaged" ? "damaged (not counted)" : "needs checking (not counted)"}` : ""}
                      {s.expires && s.expires < today ? " · expired (not counted)" : ""}
                      {s.location ? ` · ${s.location}` : ""}
                    </span>
                    <span className="stepper">
                      <button className="icon-button" aria-label={`Use one ${s.unit} of ${s.name}`} onClick={() => act(adjust(s, -1), "Used one; requirement rechecked.")} disabled={s.quantity <= 0}>
                        <Minus size={16} />
                      </button>
                      <button className="icon-button" aria-label={`Add one ${s.unit} of ${s.name}`} onClick={() => act(adjust(s, 1))}>
                        <Plus size={16} />
                      </button>
                      <a className="icon-button" aria-label={`Edit ${s.name}`} href={`#/supplies?edit=${encodeURIComponent(s.id)}`}>
                        <Pencil size={15} />
                      </a>
                    </span>
                  </div>
                ))
              ) : (
                <p className="small muted">No inventory records count toward this item yet.</p>
              )}
              <a className="button secondary" href={`#/supplies?add=${encodeURIComponent(r.def.id)}`}>
                <Plus size={15} /> Record this in inventory
              </a>
            </div>
          )}
          {editing ? (
            <ItemEditor row={r} onClose={() => setEditing(false)} />
          ) : (
            <div className="action-row">
              {r.def.kind === "quantity" && (
                <button className="button secondary" onClick={() => setEditing(true)}>
                  <Pencil size={15} /> {r.rate === null ? "Set amount" : "Edit amount / notes"}
                </button>
              )}
              {r.def.kind === "task" && (
                <button className="button secondary" onClick={() => setEditing(true)}>
                  <Pencil size={15} /> Notes & repeat interval
                </button>
              )}
              <button className="button secondary" aria-pressed={!!r.state?.na} onClick={() => act(saveState(r.def.id, { na: !r.state?.na }))}>
                {r.state?.na ? "Mark applicable" : "Not applicable"}
              </button>
              <button className="button secondary" aria-pressed={!!r.state?.inspect} onClick={() => act(saveState(r.def.id, { inspect: !r.state?.inspect }))}>
                <AlertTriangle size={15} /> {r.state?.inspect ? "Inspection done" : "Needs inspection"}
              </button>
              {r.def.origin === "household" && r.state?.custom ? (
                <button
                  className="button secondary"
                  onClick={() => {
                    if (confirm(`Delete “${r.name}”? Linked inventory stays in your supplies.`)) act(db.checklist.delete(r.def.id), "Custom item deleted.");
                  }}
                >
                  <Trash2 size={15} /> Delete
                </button>
              ) : (
                <button className="button secondary" onClick={() => act(saveState(r.def.id, { hidden: true }), "Item removed. Restore it from “Removed items”.")}>
                  <Trash2 size={15} /> Remove
                </button>
              )}
            </div>
          )}
          {r.state?.notes && !editing && <p className="note-body">Notes: {r.state.notes}</p>}
          {r.def.id === "water-pets" && settings.pets > 0 && !settings.petWaterLiters && (
            <p className="small">Set the pets' combined daily water under Household; it is shared with the water calculator.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ItemEditor({ row: r, onClose }: { row: Row; onClose: () => void }) {
  const { toast } = useHaven();
  const unitLabel = r.unit === "L" ? "liters" : r.unit;
  const [gal, setGal] = useState(r.unit === "L");
  return (
    <form
      className="inline-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const patch: Partial<ChecklistState> = { notes: String(f.get("notes") || "").slice(0, 4000) };
          const name = String(f.get("name") || "").trim();
          if (name && name !== r.def.name) patch.name = name.slice(0, 160);
          if (r.def.kind === "quantity") {
            const raw = String(f.get("rate") || "").trim();
            let v: number | undefined;
            if (raw !== "") {
              v = Number(raw);
              if (!Number.isFinite(v) || v < 0 || v > 1e7) throw new Error("Enter a valid nonnegative amount.");
              if (r.unit === "L" && gal) v = v * LITERS_PER_GALLON;
            }
            // Pet water and daily calories live in household settings so the
            // calculator, meal planner and checklist always share one value.
            if (r.def.id === "water-pets") {
              await setPreferences({ petWaterLiters: v ?? 0 });
              patch.rate = undefined;
            } else if (r.def.id === "food-calories") {
              if (v !== undefined && (v < 500 || v > 20000)) throw new Error("Enter 500–20,000 kcal per person per day.");
              await setPreferences({ dailyCalories: v ?? 2000 });
              patch.rate = undefined;
            } else patch.rate = v;
          } else {
            const interval = Number(f.get("interval") || 0);
            patch.intervalDays = interval > 0 ? Math.min(3650, Math.round(interval)) : undefined;
            const done = String(f.get("lastDone") || "");
            if (done && !/^\d{4}-\d{2}-\d{2}$/.test(done)) throw new Error("Enter a valid date.");
            patch.lastDone = done;
          }
          await saveState(r.def.id, patch);
          toast("Checklist item updated. Requirements recalculated.");
          onClose();
        } catch (err) {
          toast(errorMessage(err));
        }
      }}
    >
      <div className="form-grid">
        <Field label="Item name">
          <input name="name" defaultValue={r.name} maxLength={160} />
        </Field>
        {r.def.kind === "quantity" ? (
          <Field
            label={`Amount ${basisLabel[r.def.basis]} (${gal ? "gallons" : unitLabel})`}
            hint={r.def.origin === "official" ? "Changing an official baseline makes it your own assumption. Clear the box to restore the default." : "Clear the box to restore the default."}
          >
            <input
              name="rate"
              type="number"
              min="0"
              step="any"
              defaultValue={r.rate === null ? "" : r.unit === "L" && gal ? +(r.rate / LITERS_PER_GALLON).toFixed(3) : r.rate}
            />
            {r.unit === "L" && (
              <label className="check-label">
                <input type="checkbox" checked={gal} onChange={(e) => setGal(e.target.checked)} /> Enter in US gallons
              </label>
            )}
          </Field>
        ) : (
          <>
            <Field label="Last done">
              <input name="lastDone" type="date" defaultValue={r.state?.lastDone || ""} />
            </Field>
            <Field label="Repeat every (days)" hint="Leave empty for one-time tasks.">
              <input name="interval" type="number" min="0" max="3650" defaultValue={r.state?.intervalDays ?? r.def.intervalDays ?? ""} />
            </Field>
          </>
        )}
      </div>
      <Field label="Notes">
        <textarea name="notes" maxLength={4000} defaultValue={r.state?.notes || ""} />
      </Field>
      <div className="action-row">
        <button className="button">
          <Save size={15} /> Save
        </button>
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function CustomItemForm({ onClose }: { onClose: () => void }) {
  const { toast } = useHaven();
  return (
    <form
      className="panel edit-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const id = "custom-" + uid();
          const kind = f.get("kind") === "task" ? "task" : "quantity";
          const name = String(f.get("name") || "").trim();
          if (!name) throw new Error("Give the item a name.");
          const rateRaw = String(f.get("rate") || "");
          const rate = rateRaw === "" ? null : Number(rateRaw);
          if (rate !== null && (!Number.isFinite(rate) || rate < 0)) throw new Error("Enter a valid amount or leave it empty.");
          const unit = String(f.get("unit") || "item").trim().slice(0, 30) || "item";
          const def: ChecklistDefinition = {
            id, section: String(f.get("section")), name: name.slice(0, 160), kind,
            basis: kind === "task" ? "household" : (String(f.get("basis")) as Basis),
            rate: kind === "task" ? 1 : rate, unit: kind === "task" ? "task" : unit,
            measure: unit.toLowerCase() === "l" ? "liters" : "count", category: String(f.get("category") || "other"),
            origin: "household", why: String(f.get("why") || "Added by you.").slice(0, 2000),
            intervalDays: kind === "task" && Number(f.get("interval")) > 0 ? Number(f.get("interval")) : undefined,
          };
          await saveState(id, { custom: def });
          toast("Item added to your checklist.");
          onClose();
        } catch (err) {
          toast(errorMessage(err));
        }
      }}
    >
      <div className="section-heading">
        <h2>Add your own item</h2>
        <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="form-grid">
        <Field label="Name">
          <input name="name" required maxLength={160} autoFocus placeholder="e.g. Spare hearing-aid batteries" />
        </Field>
        <Field label="Section">
          <select name="section" defaultValue="plans">
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select name="kind" defaultValue="quantity">
            <option value="quantity">Supply with a quantity</option>
            <option value="task">Task to do / repeat</option>
          </select>
        </Field>
        <Field label="Amount (supplies)" hint="Leave empty if you'll decide later.">
          <input name="rate" type="number" min="0" step="any" />
        </Field>
        <Field label="Amount is…">
          <select name="basis" defaultValue="household">
            {(["household", "person", "personDay", "personWeek", "householdWeek", "pet", "petDay", "infantDay", "fixed"] as Basis[]).map((b) => (
              <option key={b} value={b}>
                {basisLabel[b]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unit" hint="Use L for liters to count water records.">
          <input name="unit" maxLength={30} placeholder="item, pack, L…" />
        </Field>
        <Field label="Inventory category">
          <select name="category" defaultValue="other">
            {["water", "food", "first aid", "medication", "batteries", "lighting", "cooking", "hygiene", "clothing", "shelter", "communication", "tools", "documents", "pets", "other"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Repeat every (days, tasks)">
          <input name="interval" type="number" min="0" max="3650" />
        </Field>
      </div>
      <Field label="Why / notes">
        <textarea name="why" maxLength={2000} />
      </Field>
      <button className="button">
        <Save size={15} /> Add item
      </button>
    </form>
  );
}

export function HouseholdPanel() {
  const { settings, toast } = useHaven();
  const set = (patch: Parameters<typeof setPreferences>[0]) => void setPreferences(patch).catch((e) => toast(errorMessage(e)));
  const num = (v: string, min: number, max: number) => {
    const x = Number(v);
    return Number.isFinite(x) && x >= min && x <= max ? x : null;
  };
  return (
    <section className="panel household-panel">
      <h2>Who is this plan for?</h2>
      <div className="form-grid">
        <Field label="People (including children)">
          <input type="number" min="1" max="100" value={settings.people} onChange={(e) => { const x = num(e.target.value, 1, 100); if (x !== null) set({ people: Math.round(x) }); }} />
        </Field>
        <Field label="Of whom infants / toddlers in diapers">
          <input type="number" min="0" max="20" value={settings.infants || 0} onChange={(e) => { const x = num(e.target.value, 0, 20); if (x !== null) set({ infants: Math.round(x) }); }} />
        </Field>
        <Field label="Pets">
          <input type="number" min="0" max="100" value={settings.pets} onChange={(e) => { const x = num(e.target.value, 0, 100); if (x !== null) set({ pets: Math.round(x) }); }} />
        </Field>
        <Field label="All pets combined: water per day (L)" hint="From your pets' usual intake / veterinarian. No universal figure.">
          <input type="number" min="0" max="1000" step="any" value={settings.petWaterLiters || ""} placeholder="not set" onChange={(e) => { const x = e.target.value === "" ? 0 : num(e.target.value, 0, 1000); if (x !== null) set({ petWaterLiters: x }); }} />
        </Field>
        <Field label="Planning duration" hint="14 days is this app's extended target; Ready.gov says “several days”.">
          <select value={[3, 7, 14, 30].includes(settings.days) ? settings.days : "custom"} onChange={(e) => e.target.value !== "custom" && set({ days: Number(e.target.value) })}>
            <option value={3}>3 days (72 hours)</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days (recommended in this app)</option>
            <option value={30}>30 days</option>
            <option value="custom">Custom…</option>
          </select>
        </Field>
        <Field label="Custom number of days">
          <input type="number" min="1" max="365" value={settings.days} onChange={(e) => { const x = num(e.target.value, 1, 365); if (x !== null) set({ days: Math.round(x) }); }} />
        </Field>
        <Field label="Food planning: kcal per person per day" hint="App planning assumption; adjust for children, older adults, activity and medical advice.">
          <input type="number" min="500" max="20000" value={settings.dailyCalories} onChange={(e) => { const x = num(e.target.value, 500, 20000); if (x !== null) set({ dailyCalories: x }); }} />
        </Field>
      </div>
      <fieldset className="needs">
        <legend>Accessibility and special needs (adds the matching items)</legend>
        {needsFlags.map((n) => (
          <label key={n} className="check-label">
            <input
              type="checkbox"
              checked={(settings.needs || []).includes(n)}
              onChange={(e) => set({ needs: e.target.checked ? [...(settings.needs || []), n] : (settings.needs || []).filter((x) => x !== n) })}
            />
            {needLabels[n]}
          </label>
        ))}
      </fieldset>
      <Callout>
        These answers stay on this device. They only change which checklist items apply and how much is required. They do not replace advice
        from your doctor, pharmacist, veterinarian or equipment supplier.
      </Callout>
    </section>
  );
}

function Shopping({ rows }: { rows: Row[] }) {
  const [section, setSection] = useState("all");
  const list = shoppingList(rows).filter((x) => section === "all" || x.section === section);
  const text = list.map((x) => `☐ ${x.name}: ${x.unset ? "set an amount" : fmt(x.gap, x.unit)}`).join("\n");
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>
          <ShoppingCart size={19} /> Shopping list — only what's missing
        </h2>
        <select aria-label="Shopping list section" value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="all">All sections</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {list.length ? (
        <ul className="shopping">
          {list.map((x) => (
            <li key={x.id}>
              <span>
                <strong>{x.name}</strong> <small className="muted">{sectionLabel(x.section)}</small>
              </span>
              <span>{x.unset ? <em>set an amount first</em> : fmt(x.gap, x.unit)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nothing to buy for the current filters. Supplies with a gap appear here automatically.</p>
      )}
      <p className="small muted">
        Gaps are in the item's unit. Food is shown as calories still needed; pick foods your household eats (the Meals page suggests no-cook
        options). Water gaps are shown in liters and gallons.
      </p>
      <div className="action-row">
        <button className="button secondary" onClick={() => void navigator.clipboard?.writeText(text)}>
          Copy as text
        </button>
        <button className="button secondary" onClick={() => go("checklist/print", { view: "shopping" })}>
          <Printer size={15} /> Print shopping list
        </button>
      </div>
    </section>
  );
}

export function ChecklistPrint({ view }: { view: string }) {
  const { rows, household, today } = useChecklist();
  const shopping = view === "shopping";
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="print-sheet">
      <div className="no-print action-row">
        <a className="button secondary" href="#/checklist">
          Back to checklist
        </a>
        <button className="button" onClick={() => window.print()}>
          <Printer size={15} /> Print
        </button>
      </div>
      <h1>{shopping ? "Shopping list" : "Household preparedness checklist"}</h1>
      <p>
        {household.days}-day plan · {household.people} {household.people === 1 ? "person" : "people"}
        {household.pets ? ` · ${household.pets} pets` : ""} · printed {today}. The 14-day target is an app planning assumption; official
        guidance asks for at least several days.
      </p>
      {shopping ? (
        <table>
          <thead>
            <tr><th>☐</th><th>Item</th><th>Still needed</th></tr>
          </thead>
          <tbody>
            {shoppingList(rows).map((x) => (
              <tr key={x.id}><td>☐</td><td>{x.name}</td><td>{x.unset ? "decide amount" : fmt(x.gap, x.unit)}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        sections
          .filter((s) => rows.some((r) => r.def.section === s.id && r.status !== "na"))
          .map((s) => (
            <section key={s.id}>
              <h2>{s.label}</h2>
              <table>
                <thead>
                  <tr><th>☐</th><th>Item</th><th>Need</th><th>Have</th><th>Status</th><th>Where / date</th></tr>
                </thead>
                <tbody>
                  {rows
                    .filter((r) => r.def.section === s.id && r.status !== "na")
                    .map((r) => (
                      <tr key={r.def.id}>
                        <td>{r.status === "ready" ? "☑" : "☐"}</td>
                        <td>{r.name}</td>
                        <td>{r.def.kind === "task" ? "task" : r.rate === null ? "set amount" : fmt(r.required, r.unit)}</td>
                        <td>{r.def.kind === "task" ? r.state?.lastDone || "" : fmt(r.owned, r.unit)}</td>
                        <td>{statusLabel[r.status]}</td>
                        <td>{[r.locations.join(", "), r.nextExpiry || r.dueDate].filter(Boolean).join(" · ")}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          ))
      )}
      <p className="small">
        <Info size={12} /> Sources: Ready.gov Build A Kit; CDC emergency water guidance. Quantities marked as app assumptions are planning
        estimates, not official requirements.
      </p>
    </div>
  );
}
