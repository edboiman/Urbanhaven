import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLiveQuery } from "../storage/idb";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Bookmark,
  Check,
  ChevronRight,
  Clock,
  Search,
  ShieldCheck,
  Sprout,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  X,
  Droplets,
  Zap,
  Thermometer,
  HeartPulse,
  House,
  Backpack,
  MapPin,
  CookingPot,
} from "../components/icons";
import { useChecklist, StatusBadge } from "./Checklist";
import { gardenReminders } from "./Garden";
import { reminders, fmt, statusLabel } from "../checklist/model";
import { db, setPreferences } from "../storage/db";
import { water, food, power, fuel, LITERS_PER_GALLON } from "../calculators";
import { guides, labels } from "../content";
import { searchGuides } from "../search";
import { categories, type Guide, type Category } from "../types";
import {
  PageTitle,
  TopicIcon,
  SectionHeading,
  LinkButton,
  Callout,
  Field,
  Empty,
  Trail,
  useHaven,
  errorMessage,
} from "../components/shared";
import type { OfflineState } from "../services/offline";
const emergencyLinks = [
  { id: "water", label: "No water", icon: Droplets },
  { id: "power", label: "No power", icon: Zap },
  { id: "winter", label: "No heat", icon: Thermometer },
  { id: "medical", label: "Medical help", icon: HeartPulse },
  { id: "shelter", label: "Shelter in place", icon: House },
  { id: "evacuate", label: "Evacuate", icon: Backpack },
];
export function Urgent() {
  return (
    <>
      <PageTitle
        eyebrow="RIGHT NOW"
        title="Urgent help."
        description="Call 911 for life-threatening emergencies. These step-by-step checks work offline."
      />
      <div className="emergency-grid big">
        {emergencyLinks.map((x) => (
          <a
            key={x.id}
            href={"#/scenario/" + x.id}
            className={
              "emergency-card " + (x.id === "medical" ? "medical" : "")
            }
          >
            <x.icon size={26} />
            <span>{x.label}</span>
            <ChevronRight size={15} />
          </a>
        ))}
        <a href="#/water" className="emergency-card">
          <Droplets size={26} />
          <span>Water advisory?</span>
          <ChevronRight size={15} />
        </a>
        <a href="#/map" className="emergency-card">
          <MapPin size={26} />
          <span>My meeting places</span>
          <ChevronRight size={15} />
        </a>
      </div>
      <Callout danger>
        <strong>
          <AlertTriangle size={18} /> Carbon monoxide
        </strong>
        <p>
          If a CO alarm sounds or people feel dizzy, sick or confused — go
          outside to fresh air now and call 911 from outside. Never run a
          generator, grill or camp stove indoors or in a garage.
        </p>
      </Callout>
      <p className="small muted">
        This app has no live alerts, shelter status or emergency calling. Use a
        radio or official alerts for current instructions.
      </p>
    </>
  );
}
export function Home({ offline }: { offline: OfflineState }) {
  const { settings } = useHaven();
  const { rows, summary, supplies, today, household } = useChecklist();
  const favorites = useLiveQuery(() => db.favorites.toArray(), [], []) || [];
  const garden = useLiveQuery(() => db.garden.toArray(), [], []) || [];
  const due = [
    ...reminders(rows, supplies, today, 14),
    ...gardenReminders(garden, today),
  ].sort((a, b) => a.due.localeCompare(b.due));
  const next = rows
    .filter(
      (r) =>
        r.status === "needed" ||
        r.status === "inspect" ||
        r.status === "partial",
    )
    .slice(0, 4);
  const water = rows.find((r) => r.def.id === "water-drinking");
  const food = rows.find((r) => r.def.id === "food-calories");
  return (
    <>
      <section className="urgent-strip" aria-labelledby="urgent-h">
        <h2 id="urgent-h">Need help right now?</h2>
        <div className="emergency-grid">
          {emergencyLinks.map((x) => (
            <a
              key={x.id}
              href={"#/scenario/" + x.id}
              className={
                "emergency-card " + (x.id === "medical" ? "medical" : "")
              }
            >
              <x.icon size={22} />
              <span>{x.label}</span>
            </a>
          ))}
        </div>
      </section>
      <div className="home-intro">
        <div>
          <p className="eyebrow">TODAY · {today}</p>
          <h1>Your household plan.</h1>
          <p className="muted">
            {household.days}-day plan for {household.people}{" "}
            {household.people === 1 ? "person" : "people"}
            {household.pets
              ? ` and ${household.pets} pet${household.pets > 1 ? "s" : ""}`
              : ""}
            . Complete Offline setup and verify your files before relying on the
            app without a connection.
          </p>
        </div>
        <LinkButton to="offline" className="text-link">
          {offline.status === "ready"
            ? "Offline verified"
            : "Get ready to go offline"}
        </LinkButton>
      </div>
      <div className="preparedness-links">
        {[
          ["meals", "Pantry essentials"],
          ["cooking", "Outdoor recipes"],
          ["garden", "Choose a crop"],
          ["health", "Health concerns"],
          ["radio", "Radio frequencies"],
          ["pets", "Pet preparedness"],
        ].map(([p, l]) => (
          <a className="button secondary" key={p} href={"#/" + p}>
            {l}
          </a>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Checklist status</h2>
            <a className="text-link" href="#/checklist">
              Open <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="summary-counts compact">
            {(["ready", "partial", "needed", "inspect"] as const).map((s) => (
              <a key={s} className={"count-tile st-" + s} href="#/checklist">
                <strong>{summary[s]}</strong>
                <span>{statusLabel[s]}</span>
              </a>
            ))}
          </div>
          <p className="small">
            {summary.ready} of {summary.applicable} applicable items ready.{" "}
            {summary.na} marked not applicable.
          </p>
          {next.length > 0 && (
            <ul className="next-list">
              {next.map((r) => (
                <li key={r.def.id}>
                  <StatusBadge status={r.status} /> {r.name}
                  {r.gap > 0 ? (
                    <small> — need {fmt(r.gap, r.unit)}</small>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel supply-overview">
          <div className="section-heading">
            <h2>Water & food on hand</h2>
            <a className="text-link" href="#/supplies">
              Supplies <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="supply-metric">
            <span className="topic-icon water">
              <Droplets size={21} />
            </span>
            <div>
              <strong>{fmt(water?.owned || 0, "L")}</strong>
              <p>
                of {fmt(water?.required || 0, "L")} drinking water for this plan
              </p>
            </div>
          </div>
          <div className="supply-metric">
            <span className="topic-icon food">
              <TopicIcon category="food" />
            </span>
            <div>
              <strong>
                {Math.round(food?.owned || 0).toLocaleString()} kcal
              </strong>
              <p>
                of {Math.round(food?.required || 0).toLocaleString()} kcal at{" "}
                {settings.dailyCalories} kcal/person/day (app assumption)
              </p>
            </div>
          </div>
          <p className="small muted">
            Counts only Ready records within their label / review dates. Estimates are not a guaranteed
            survival time.
          </p>
        </section>
      </div>
      {due.length > 0 && (
        <section className="panel reminders">
          <h2>
            <Clock size={18} /> Due soon
          </h2>
          <ul>
            {due.slice(0, 5).map((r) => (
              <li key={r.id} className={r.due < today ? "overdue" : ""}>
                <a href={"#/" + r.link}>{r.text}</a>{" "}
                <small>
                  {r.due < today ? `overdue since ${r.due}` : `due ${r.due}`}
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="shortcut-grid">
        {[
          {
            to: "water",
            icon: Droplets,
            title: "Water safety",
            text: "Advisories, boiling, bleach tables, Michigan wells.",
          },
          {
            to: "map",
            icon: MapPin,
            title: "Offline Michigan map",
            text: "Search towns, save meeting places.",
          },
          {
            to: "meals",
            icon: CookingPot,
            title: "Pantry meals",
            text: "No-cook recipes and a 14-day plan.",
          },
          {
            to: "garden",
            icon: Sprout,
            title: "Grow food",
            text: "Michigan frost dates and hardy crops.",
          },
        ].map((x) => (
          <a key={x.to} href={"#/" + x.to} className="panel shortcut">
            <x.icon size={24} />
            <strong>{x.title}</strong>
            <span>{x.text}</span>
          </a>
        ))}
      </div>
      {favorites.length > 0 && (
        <>
          <SectionHeading title="Saved guides" />
          <div className="guide-grid">
            {guides
              .filter((g) => favorites.some((f) => f.id === g.id))
              .slice(0, 3)
              .map((g) => (
                <GuideCard guide={g} key={g.id} />
              ))}
          </div>
        </>
      )}
    </>
  );
}
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const escaped = words
    .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return (
    <>
      {text
        .split(new RegExp(`(${escaped})`, "ig"))
        .map((part, i) =>
          words.includes(part.toLowerCase()) ? (
            <mark key={i}>{part}</mark>
          ) : (
            part
          ),
        )}
    </>
  );
}
export function GuideCard({
  guide: g,
  query = "",
}: {
  guide: Guide;
  query?: string;
}) {
  return (
    <a href={"#/guide/" + g.id} className="guide-card">
      <div className="guide-card-top">
        <span className={"topic-icon " + g.category}>
          <TopicIcon category={g.category} />
        </span>
        <span className="eyebrow">{labels[g.category]}</span>
        <ArrowUpRight size={17} />
      </div>
      <h3>
        <Highlight text={g.title} query={query} />
      </h3>
      <p>
        <Highlight text={g.summary} query={query} />
      </p>
      <div className="guide-card-foot">
        <span>
          <Clock size={12} />
          {Math.max(
            1,
            Math.ceil(JSON.stringify(g).split(" ").length / 230),
          )}{" "}
          min read
        </span>
        <span>Essential guide</span>
      </div>
    </a>
  );
}
export function Library() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [onlySaved, setOnlySaved] = useState(false);
  const favorites = useLiveQuery(() => db.favorites.toArray(), []) || [];
  const recent =
    useLiveQuery(() => db.recents.byIndex("date", "prev", 4), []) || [];
  const results = useMemo(
    () =>
      searchGuides(guides, query, category).filter(
        (g) => !onlySaved || favorites.some((f) => f.id === g.id),
      ),
    [query, category, onlySaved, favorites],
  );
  return (
    <>
      <PageTitle
        eyebrow="KNOW A LITTLE. FEEL MORE READY."
        title="Your offline field guide."
        description={`${guides.length} practical guides for life when the everyday gets interrupted.`}
      />
      <div className="library-search">
        <Search size={23} />
        <input
          aria-label="Search survival guides"
          maxLength={200}
          placeholder="What do you need to know? Try “no electricity”…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="icon-button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X size={19} />
          </button>
        )}
      </div>
      <div className="suggestions">
        <span>Try:</span>
        {[
          "Tap water",
          "Toilet stopped working",
          "Growing vegetables inside",
        ].map((x) => (
          <button key={x} onClick={() => setQuery(x)}>
            {x}
          </button>
        ))}
      </div>
      <div className="filter-row">
        <button
          className={category === "all" ? "chip active" : "chip"}
          onClick={() => setCategory("all")}
        >
          All guides
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? "chip active" : "chip"}
            onClick={() => setCategory(c)}
          >
            <TopicIcon category={c} size={15} />
            {labels[c]}
          </button>
        ))}
      </div>
      <div className="section-heading">
        <p className="muted">
          {results.length} guide{results.length !== 1 ? "s" : ""}
          {query && ` matching “${query}”`}
        </p>
        <button
          className={"chip " + (onlySaved ? "active" : "")}
          aria-pressed={onlySaved}
          onClick={() => setOnlySaved(!onlySaved)}
        >
          <Bookmark size={15} />
          Saved only
        </button>
      </div>
      {results.length ? (
        <div className="guide-grid">
          {results.map((g) => (
            <GuideCard guide={g} query={query} key={g.id} />
          ))}
        </div>
      ) : (
        <Empty title="No guides found">
          Try a shorter search, another category, or turn off Saved only.
        </Empty>
      )}
      {!query && recent.length > 0 && (
        <>
          <SectionHeading title="Recently opened" />
          <div className="recent-list">
            {recent.map((r) => {
              const g = guides.find((x) => x.id === r.id);
              return (
                g && (
                  <a key={g.id} href={"#/guide/" + g.id}>
                    <Clock size={16} />
                    {g.title}
                    <ArrowRight size={16} />
                  </a>
                )
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
function List({
  items,
  ordered = false,
}: {
  items: string[];
  ordered?: boolean;
}) {
  return ordered ? (
    <ol className="steps">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ol>
  ) : (
    <ul className="article-list">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}
export function Article({ id }: { id: string }) {
  const { settings, toast } = useHaven();
  const g = guides.find((x) => x.id === id);
  const favorite = useLiveQuery(() => db.favorites.get(id), [id]);
  useEffect(() => {
    if (g)
      void db.recents
        .put({ id, date: Date.now() })
        .catch((e) => toast(errorMessage(e)));
  }, [id]);
  if (!g)
    return (
      <Empty title="Guide not found">
        Return to the field guide to choose an available article.
      </Empty>
    );
  const save = async () => {
    try {
      if (favorite) await db.favorites.delete(id);
      else await db.favorites.put({ id });
      toast(
        favorite ? "Guide removed from saved." : "Guide saved on this device.",
      );
    } catch (e) {
      toast(errorMessage(e));
    }
  };
  return (
    <>
      <Trail>{labels[g.category]}</Trail>
      <div className="article-head">
        <span className={"topic-icon " + g.category}>
          <TopicIcon category={g.category} size={25} />
        </span>
        <div>
          <p className="eyebrow">
            {labels[g.category]} · {g.region}
          </p>
          <h1>{g.title}</h1>
        </div>
        <button
          className={"button secondary " + (favorite ? "saved" : "")}
          onClick={save}
        >
          <Bookmark size={17} fill={favorite ? "currentColor" : "none"} />
          {favorite ? "Saved" : "Save guide"}
        </button>
      </div>
      <div className="article-layout">
        <article className="article panel">
          <p className="article-summary">{g.summary}</p>
          <Callout
            danger={g.category === "medical" && /bleed|warning/.test(g.id)}
          >
            <strong>
              <AlertTriangle size={18} />
              Safety first
            </strong>
            <List items={g.warnings} />
          </Callout>
          <section>
            <h2>Quick reference</h2>
            <List items={g.quick} />
          </section>
          <section>
            <h2>What to do</h2>
            <List items={g.steps} ordered />
          </section>
          {!settings.emergency && (
            <>
              <section>
                <h2>When to use this guide</h2>
                <p>{g.when}</p>
              </section>
              <section>
                <h2>What you need</h2>
                <List items={g.needs} />
              </section>
              <section>
                <h2>Common mistakes</h2>
                <List items={g.mistakes} />
              </section>
              <section>
                <h2>Other practical options</h2>
                <List items={g.alternatives} />
              </section>
            </>
          )}
          <section className="sources">
            <h2>Sources & review</h2>
            <p className="small">
              Content updated {g.updated}. Educational guidance, not individual
              medical advice. No claim of professional clinical or
              emergency-management review.
            </p>
            {g.sources.map((source, i) => (
              <div key={i}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.organization}: {source.title}
                  <ArrowUpRight size={13} />
                </a>
                <small>Reference record {source.verified} · opens online</small>
              </div>
            ))}
          </section>
        </article>
        <aside className="article-aside">
          <div className="panel">
            <p className="eyebrow">KEEP IT SIMPLE</p>
            <h3>One step at a time.</h3>
            <p>
              Read warnings first. Follow instructions from your local emergency
              officials when they differ from general guidance.
            </p>
            <button
              className="text-link"
              onClick={() =>
                void setPreferences({ emergency: !settings.emergency }).catch(
                  (e) => toast(errorMessage(e)),
                )
              }
            >
              {settings.emergency
                ? "Show full guide"
                : "Use emergency reading mode"}
              <ArrowRight size={14} />
            </button>
          </div>
          <h3>Keep learning</h3>
          {g.related.map((id) => {
            const r = guides.find((x) => x.id === id);
            return (
              r && (
                <a className="related" key={id} href={"#/guide/" + id}>
                  <TopicIcon category={r.category} size={18} />
                  {r.title}
                  <ChevronRight size={16} />
                </a>
              )
            );
          })}
          <LinkButton to="library" className="text-link">
            Back to all guides
          </LinkButton>
        </aside>
      </div>
    </>
  );
}
export function Tools() {
  const { settings } = useHaven();
  const { rows } = useChecklist();
  const drinking = rows.find((r) => r.def.id === "water-drinking");
  const hygiene = rows.find((r) => r.def.id === "water-hygiene");
  const foodRow = rows.find((r) => r.def.id === "food-calories");
  const [tab, setTab] = useState("water");
  const fromPlan = () => ({
    people: settings.people,
    days: settings.days,
    available: Math.round((drinking?.owned || 0) * 10) / 10,
    petWater: settings.petWaterLiters || 0,
    extra: hygiene?.rate ? hygiene.rate * settings.people : 0,
    baseline: drinking?.rate || LITERS_PER_GALLON,
    calories: Math.round(foodRow?.owned || 0),
    dailyCalories: settings.dailyCalories,
  });
  const [values, setValues] = useState({
    ...fromPlan(),
    capacity: 250,
    watts: 10,
    loss: 15,
    hours: 5,
    rate: 0,
    minutes: 30,
    fuelDays: 14,
  });
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) setValues((v) => ({ ...v, ...fromPlan() }));
  }, [
    drinking?.owned,
    drinking?.rate,
    hygiene?.rate,
    foodRow?.owned,
    settings.people,
    settings.days,
    settings.petWaterLiters,
    settings.dailyCalories,
  ]);
  const field = (label: string, key: keyof typeof values, hint?: string) => (
    <Field label={label} hint={hint}>
      <input
        type="number"
        min={0}
        step="any"
        value={values[key]}
        onChange={(e) => {
          setTouched(true);
          setValues((v) => ({
            ...v,
            [key]: e.target.value === "" ? 0 : Number(e.target.value),
          }));
        }}
      />
    </Field>
  );
  let result: ReactNode;
  try {
    if (tab === "water") {
      const r = water(
        values.people,
        values.days,
        values.available,
        values.petWater,
        values.extra,
        values.baseline,
      );
      result = (
        <>
          <strong>
            {r.needed.toFixed(1)}
            <small>
              liters to plan for ({(r.needed / LITERS_PER_GALLON).toFixed(1)}{" "}
              gal)
            </small>
          </strong>
          <dl>
            <div>
              <dt>Estimated coverage</dt>
              <dd>{r.coverage.toFixed(1)} days</dd>
            </div>
            <div>
              <dt>Remaining gap</dt>
              <dd>{r.gap.toFixed(1)} L</dd>
            </div>
            <div>
              <dt>Daily total</dt>
              <dd>{r.daily.toFixed(2)} L</dd>
            </div>
          </dl>
          <p className="small">
            Coverage is an estimate at these assumptions, not a guaranteed safe
            survival time.
          </p>
        </>
      );
    } else if (tab === "food") {
      const r = food(values.calories, values.people, values.dailyCalories);
      result = (
        <>
          <strong>
            {r.duration.toFixed(1)}
            <small>estimated days of calories</small>
          </strong>
          <p>
            {r.calories.toLocaleString()} kcal ÷ {values.people} people ÷{" "}
            {values.dailyCalories} kcal/day.
          </p>
        </>
      );
    } else if (tab === "power") {
      const r = power(values.capacity, values.watts, values.loss, values.hours);
      result = (
        <>
          <strong>
            {r.runtime.toFixed(1)}
            <small>estimated continuous hours</small>
          </strong>
          <dl>
            <div>
              <dt>Usable energy after losses</dt>
              <dd>{r.usable.toFixed(1)} Wh</dd>
            </div>
            <div>
              <dt>Energy for chosen daily use</dt>
              <dd>{r.daily.toFixed(1)} Wh</dd>
            </div>
            <div>
              <dt>Energy remaining after one day</dt>
              <dd>{r.remaining.toFixed(1)} Wh</dd>
            </div>
          </dl>
        </>
      );
    } else if (tab === "fuel")
      result = (
        <>
          <strong>
            {fuel(values.rate, values.minutes, values.fuelDays).toFixed(0)}
            <small>grams of fuel estimated</small>
          </strong>
          <p>
            Your appliance's published consumption × hours/day × days. Add a
            reserve for wind and cold, which raise consumption.
          </p>
        </>
      );
  } catch (e) {
    result = <p role="alert">{errorMessage(e)}</p>;
  }
  return (
    <>
      <PageTitle
        eyebrow="WHAT-IF ESTIMATES"
        title="Calculators."
        description="Start from your saved household plan, then try other numbers. Changes here are not saved; edit your plan on the Checklist."
      />
      <div className="tabs" role="tablist" aria-label="Calculator">
        {["water", "food", "power", "fuel"].map((x) => (
          <button
            role="tab"
            aria-selected={tab === x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x[0].toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>
      <div className="calculator-layout">
        <section className="panel">
          <h2>{tab[0].toUpperCase() + tab.slice(1)} calculator</h2>
          {touched && (
            <button
              className="text-link"
              onClick={() => {
                setTouched(false);
                setValues((v) => ({ ...v, ...fromPlan() }));
              }}
            >
              Reset to my saved plan
            </button>
          )}
          <div className="form-grid">
            {tab === "water" && (
              <>
                {field("People", "people")}
                {field("Days", "days")}
                {field(
                  "Usable drinking water on hand (L)",
                  "available",
                  "From your inventory.",
                )}
                {field(
                  "Drinking & basic use per person / day (L)",
                  "baseline",
                  "CDC/Ready.gov baseline: 1 US gallon ≈ 3.785 L.",
                )}
                {field(
                  "All pets combined / day (L)",
                  "petWater",
                  "Your pets' usual intake; no universal figure.",
                )}
                {field(
                  "Extra household water / day (L)",
                  "extra",
                  "Your hygiene allowance (people × checklist amount).",
                )}
              </>
            )}
            {tab === "food" && (
              <>
                {field("People", "people")}
                {field("Usable calories on hand (kcal)", "calories")}
                {field(
                  "Calories per person / day",
                  "dailyCalories",
                  "App planning assumption.",
                )}
              </>
            )}
            {tab === "power" && (
              <>
                {field(
                  "Rated battery energy (Wh)",
                  "capacity",
                  "Use Wh, not mAh.",
                )}
                {field("Device draw (W)", "watts")}
                {field("Total losses / reserve (%)", "loss")}
                {field("Device use per day (hours)", "hours")}
              </>
            )}
            {tab === "fuel" && (
              <>
                {field(
                  "Your appliance's published consumption (g/hour)",
                  "rate",
                  "From the stove or fuel manual. There is no universal burn rate.",
                )}
                {field("Minutes used per day", "minutes")}
                {field("Days", "fuelDays")}
              </>
            )}
          </div>
          {tab === "water" && (
            <p className="small muted">
              Same assumptions as the checklist and Water page.{" "}
              <a href="#/water">Water safety</a>
            </p>
          )}
          {tab === "power" && (
            <Callout>
              Runtime is approximate. Check voltage, connector and output
              ratings. Power banks do not run high-wattage appliances. Medical
              equipment needs an individual backup plan.
            </Callout>
          )}
          {tab === "fuel" && (
            <Callout danger>
              Outdoor camp stoves, grills and generators must never be used
              indoors or in garages. Opening a window does not make it safe.
            </Callout>
          )}
        </section>
        <div className="calculator-result" aria-live="polite">
          {result!}
          <span className="result-label">AN ESTIMATE FOR PLANNING</span>
        </div>
      </div>
    </>
  );
}
type Question = { id: string; label: string; options: string[] };
const scenarios: Record<
  string,
  {
    title: string;
    urgent: string;
    questions: Question[];
    steps: string[];
    links: string[];
  }
> = {
  water: {
    title: "The water stopped working.",
    urgent:
      "If officials suspect fuel, toxic chemicals or radiation, do not boil, filter or disinfect the water for drinking. Use an approved alternative supply. Follow the exact local advisory.",
    questions: [
      {
        id: "stored",
        label: "Do you have stored safe drinking water?",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "local",
        label: "Is only your home affected?",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "advisory",
        label: "What have local authorities said?",
        options: [
          "Boil water",
          "Do not drink",
          "Do not use",
          "No advisory / unsure",
        ],
      },
      {
        id: "drains",
        label: "Are toilets and drains functioning normally?",
        options: ["Yes", "No", "Unsure"],
      },
    ],
    steps: [
      "Reserve safe water for drinking, food preparation, medication needs and brushing teeth.",
      "Check utility messages or your battery radio when available. A lack of news does not prove the water is safe.",
      "Plan for at least 1 gallon per person each day, with extra for individual needs and pets.",
    ],
    links: ["water-storage", "water-advisories", "sanitation-sewer-failure"],
  },
  power: {
    title: "The power went out.",
    urgent:
      "Stay away from downed lines, floodwater near electrical equipment, sparks and burning smells. For a suspected gas leak, leave immediately and call emergency services from outside. Never operate a generator indoors or in a garage.",
    questions: [
      {
        id: "hazard",
        label: "Any sparks, burning smell, floodwater or downed lines?",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "medical",
        label: "Does someone depend on electrically powered medical equipment?",
        options: ["Yes", "No"],
      },
      {
        id: "temp",
        label: "How does the indoor temperature feel?",
        options: ["Comfortable", "Very hot", "Very cold", "Unsure"],
      },
      {
        id: "batteries",
        label: "Do you have working battery lights and a charged phone?",
        options: ["Yes", "No"],
      },
      {
        id: "local",
        label: "Is only your home affected?",
        options: ["Yes", "No", "Unsure"],
      },
    ],
    steps: [
      "Use a flashlight rather than candles. Keep refrigerator and freezer doors shut.",
      "Conserve phone power and check official outage information when possible.",
      "Use generators outdoors at least 20 feet from doors, windows and vents with exhaust directed away. Never backfeed a wall outlet.",
    ],
    links: ["power-generator", "food-refrigerator", "power-lighting"],
  },
  winter: {
    title: "You have no heat.",
    urgent:
      "Never heat a home with an oven, outdoor camp stove, charcoal grill or generator. If a CO alarm sounds or people feel ill, go outside immediately and call emergency services.",
    questions: [
      {
        id: "symptoms",
        label:
          "Confusion, slurred speech, severe drowsiness or persistent shivering?",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "shelter",
        label: "Do you have a safe heated place to relocate?",
        options: ["Yes", "No"],
      },
      {
        id: "vulnerable",
        label: "Infants, older adults or people with medical needs present?",
        options: ["Yes", "No"],
      },
    ],
    steps: [
      "Put on dry layers, a hat and socks; use blankets and safe sleeping insulation.",
      "Gather in one suitable room. Keep required ventilation and exits clear.",
      "Plan relocation before the indoor environment becomes unsafe; check neighbors when safe to do so.",
    ],
    links: [
      "climate-winter-outage",
      "climate-hypothermia",
      "climate-frostbite",
    ],
  },
  medical: {
    title: "Get medical help.",
    urgent:
      "Call 911 now for severe breathing trouble, unconsciousness, stroke symptoms, chest pressure, uncontrolled serious bleeding or heat stroke. If cellular service is unavailable, seek a working phone or safe route to help. This app cannot place emergency calls without available service.",
    questions: [
      {
        id: "danger",
        label:
          "Is the person unresponsive, struggling to breathe or severely bleeding?",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "safe",
        label: "Is the scene safe for you to approach?",
        options: ["Yes", "No", "Unsure"],
      },
    ],
    steps: [
      "Check scene safety before approaching. Follow emergency dispatcher instructions.",
      "For serious external bleeding, apply firm, continuous direct pressure with a clean dressing while help is called.",
      "Have medication names, allergies and the person’s location ready for responders. Follow current first-aid training for further care.",
    ],
    links: [
      "medical-warning-signs",
      "medical-severe-bleeding",
      "medical-first-aid-kit",
    ],
  },
  shelter: {
    title: "Shelter in place.",
    urgent:
      "Follow the hazard-specific instructions from local officials. A tornado shelter and a chemical-release shelter can require different locations and ventilation actions. If the building is on fire or unsafe, leave.",
    questions: [
      {
        id: "hazard",
        label: "What is the hazard?",
        options: [
          "Tornado / severe wind",
          "External chemical release",
          "Unknown / other",
        ],
      },
      {
        id: "official",
        label: "Have local officials directed you to shelter?",
        options: ["Yes", "No / unsure"],
      },
    ],
    steps: [
      "Bring people and pets inside when the building is safe. Use a radio or alerts for instructions.",
      "Keep your emergency supplies, medication, shoes, light and phone within reach.",
      "Keep exits usable and wait for official guidance before leaving shelter.",
    ],
    links: ["shelter-in-place", "shelter-tornado", "shelter-fire-safety"],
  },
  evacuate: {
    title: "Leave early, leave safely.",
    urgent:
      "Leave when officials direct you to evacuate. Do not drive or walk through floodwater. Never use an elevator during a fire. Do not delay to collect possessions when immediate danger is present.",
    questions: [
      {
        id: "mobility",
        label:
          "Does anyone need mobility, transport or communication assistance?",
        options: ["Yes", "No"],
      },
      {
        id: "route",
        label: "Do you have a safe route and destination?",
        options: ["Yes", "No / unsure"],
      },
    ],
    steps: [
      "Take critical medicines, IDs, phone, charger, keys and your ready bag if immediately accessible.",
      "Bring pets and needed assistance equipment. Tell a trusted contact where you are going when possible.",
      "Use official routes and instructions; return only when authorities say it is safe.",
    ],
    links: [
      "shelter-evacuation",
      "shelter-flooding",
      "communications-family-plan",
    ],
  },
};
export function Scenario({ id }: { id: string }) {
  const data = scenarios[id];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [people, setPeople] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  useEffect(() => {
    setAnswers({});
    setCompleted([]);
  }, [id]);
  if (!data)
    return (
      <Empty title="Scenario not found">
        Choose an emergency shortcut from the overview.
      </Empty>
    );
  const guidance: string[] = [];
  if (id === "water") {
    if (answers.stored === "No" || answers.stored === "Unsure")
      guidance.push(
        "Find unopened bottled water or a public distribution site announced by local authorities. Do not assume stored or collected water is safe.",
      );
    if (answers.advisory === "Boil water")
      guidance.push(
        "Follow the local boil advisory. For biologically unsafe water, CDC advises a rolling boil for 1 minute (3 minutes above 6,500 feet), then let it cool. This does not remove chemicals.",
      );
    if (answers.advisory === "Do not drink")
      guidance.push(
        "Use an approved alternative for drinking, cooking and brushing teeth. Ask your utility which other uses are allowed; boiling does not make a do-not-drink advisory safe.",
      );
    if (answers.advisory === "Do not use")
      guidance.push(
        "Do not use the water for any purpose until officials authorize it. Avoid contact and obtain an approved alternative.",
      );
    if (answers.drains === "No" || answers.drains === "Unsure")
      guidance.push(
        "Stop flushing or adding water to affected drains. Keep away from sewage. Contact the utility / building manager and use an emergency toilet arrangement approved locally.",
      );
    if (answers.local === "Yes")
      guidance.push(
        "Ask the building manager or utility whether a local valve or pipe problem is involved. Do not work on shared systems yourself.",
      );
  }
  if (id === "power") {
    if (answers.hazard === "Yes" || answers.hazard === "Unsure")
      guidance.push(
        "Treat possible electrical hazards as live. Leave the hazardous area, keep others away and contact the utility or emergency services from a safe place.",
      );
    if (answers.medical === "Yes")
      guidance.push(
        "Activate the person’s medical backup plan now. If essential equipment cannot run, seek emergency assistance or relocate promptly to an appropriate powered facility.",
      );
    if (answers.temp === "Very hot" || answers.temp === "Very cold")
      guidance.push(
        "Prioritize relocation to a safe heated / cooled location. Check for heat or cold illness; do not wait for an arbitrary indoor temperature threshold.",
      );
    if (answers.batteries === "No")
      guidance.push(
        "Preserve your phone for communication. Seek battery lighting safely; avoid open flames and do not charge equipment from an idling car in a garage.",
      );
    if (answers.local === "Yes")
      guidance.push(
        "Check whether neighbors have power. Only inspect a dry, undamaged panel from a safe position. Do not remove panel covers, repeatedly reset a tripping breaker or attempt wiring repairs.",
      );
  }
  if (id === "winter") {
    if (answers.symptoms === "Yes" || answers.symptoms === "Unsure")
      guidance.push(
        "Possible hypothermia needs urgent medical assessment. Call emergency services; move gently to a warm place if safe, remove wet clothing and warm the center of the body.",
      );
    if (answers.shelter === "No")
      guidance.push(
        "Use a radio, local government information or a working phone to locate a warming center. The app does not contain live shelter availability.",
      );
    if (answers.vulnerable === "Yes")
      guidance.push(
        "Arrange help and relocation early for people at greater risk. Do not leave children or a person needing care alone.",
      );
  }
  if (id === "medical") {
    if (answers.danger !== "No")
      guidance.push(
        "Call emergency services immediately if any listed danger sign is present or you are uncertain. Follow dispatcher guidance.",
      );
    if (answers.safe === "No" || answers.safe === "Unsure")
      guidance.push(
        "Do not enter a dangerous scene. Move yourself to safety and tell responders what hazard is present.",
      );
  }
  if (id === "shelter") {
    if (answers.hazard === "Tornado / severe wind")
      guidance.push(
        "Go to a basement or small interior room on the lowest level of a sturdy building, away from windows. Protect your head. Mobile homes are not safe tornado shelters.",
      );
    if (answers.hazard === "External chemical release")
      guidance.push(
        "Follow official instructions about room choice, doors, windows and HVAC. Do not improvise ventilation; the right action depends on the release.",
      );
    if (answers.hazard === "Unknown / other")
      guidance.push(
        "Use your radio or official alert messages to identify the hazard before choosing a shelter location or sealing ventilation.",
      );
  }
  if (id === "evacuate") {
    if (answers.mobility === "Yes")
      guidance.push(
        "Contact your planned helper / transport service promptly. If immediate danger blocks evacuation, call emergency services and state your exact location and assistance needs.",
      );
    if (answers.route === "No / unsure")
      guidance.push(
        "Seek official evacuation routes and destination information. An offline map can help orient you but will not show current closures.",
      );
  }
  return (
    <>
      <a href="#/" className="text-link">
        <ArrowLeft size={16} />
        Back to overview
      </a>
      <PageTitle
        eyebrow="RIGHT NOW · ONE STEP AT A TIME"
        title={data.title}
        description="Start with immediate hazards. This workflow uses your answers on this device."
      />
      <Callout danger>
        <strong>
          <AlertTriangle size={20} />
          Read this first
        </strong>
        <p>{data.urgent}</p>
      </Callout>
      <div className="scenario-layout">
        <section className="panel">
          <h2>A few quick checks</h2>
          {data.questions.map((q) => (
            <fieldset className="question" key={q.id}>
              <legend>{q.label}</legend>
              <div>
                {q.options.map((o) => (
                  <label
                    key={o}
                    className={
                      answers[q.id] === o ? "choice selected" : "choice"
                    }
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === o}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                    />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {id === "water" && (
            <Field label="People needing water">
              <input
                type="number"
                min="1"
                max="1000"
                value={people}
                onChange={(e) => setPeople(Math.max(1, Number(e.target.value)))}
              />
              <small>
                {(people * LITERS_PER_GALLON).toFixed(1)} L minimum daily for
                people; add pets and individual needs.
              </small>
            </Field>
          )}
          <p className="small muted">
            Answers are not sent anywhere. The app does not know current local
            alerts or shelter availability.
          </p>
        </section>
        <section className="panel">
          <p className="eyebrow">PRIORITIZED ACTIONS</p>
          <h2>Your next steps</h2>
          {guidance.length > 0 && (
            <div className="scenario-guidance" aria-live="polite">
              {guidance.map((x) => (
                <p key={x}>
                  <AlertTriangle size={16} />
                  {x}
                </p>
              ))}
            </div>
          )}
          <div className="action-list">
            {data.steps.map((step, i) => (
              <label className={completed.includes(i) ? "checked" : ""} key={i}>
                <input
                  type="checkbox"
                  checked={completed.includes(i)}
                  onChange={() =>
                    setCompleted((a) =>
                      a.includes(i) ? a.filter((x) => x !== i) : [...a, i],
                    )
                  }
                />
                <span>{step}</span>
              </label>
            ))}
          </div>
          <h3>Useful guides</h3>
          {data.links.map((id) => {
            const g =
              guides.find((g) => g.id === id) ||
              guides.find((g) =>
                g.id.includes(id.split("-").slice(1).join("-")),
              );
            return (
              g && (
                <a className="related" href={"#/guide/" + g.id} key={id}>
                  <BookOpen size={16} />
                  {g.title}
                  <ChevronRight size={16} />
                </a>
              )
            );
          })}
          <a className="text-link" href="#/notebook">
            Open your saved contacts & plans <ArrowRight size={15} />
          </a>
        </section>
      </div>
    </>
  );
}
