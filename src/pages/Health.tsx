import { useState } from "react";
import data from "../content/medical-prolonged.json";
import type { Guide } from "../types";
import { PageTitle, Callout, Field } from "../components/shared";
const concerns = data as Guide[];
export function Health() {
  const [id, setId] = useState(concerns[0]?.id || "");
  const g = concerns.find((g) => g.id === id)!;
  return (
    <>
      <PageTitle
        eyebrow="HEALTH WHEN ACCESS IS DISRUPTED"
        title="Know what needs help. Know what you can do."
        description="Common concerns during outages and prolonged disruption. Conservative first aid, prevention, monitoring and clear reasons to seek urgent care."
      />
      <Callout danger>
        <strong>Call 911 for life-threatening symptoms.</strong>
        <p>
          Severe breathing difficulty, chest pain, stroke signs,
          unconsciousness, uncontrolled bleeding, new severe confusion or
          suspected carbon monoxide poisoning need emergency help now. Seek
          another safe way to contact emergency services if the first attempt
          fails. These guides cannot make delayed care safe.
        </p>
        <p>
          <a href="#/urgent">Open urgent first-aid checks</a>
        </p>
      </Callout>
      <section className="panel">
        <Field label="Main health concern">
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {concerns.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </Field>
        <h2>{g.title}</h2>
        <p>{g.summary}</p>
        <p>
          <strong>When this applies:</strong> {g.when}
        </p>
        <Callout danger>
          <strong>Get medical help if…</strong>
          <ul className="article-list">
            {g.warnings.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </Callout>
        <h3>First actions</h3>
        <ul className="article-list">
          {g.quick.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        <h3>Care while arranging help</h3>
        <ol className="article-list">
          {g.steps.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
        <details>
          <summary>Supplies, common mistakes & alternatives</summary>
          <h3>Supplies</h3>
          <ul className="article-list">
            {g.needs.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <h3>Avoid</h3>
          <ul className="article-list">
            {g.mistakes.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <h3>Alternatives</h3>
          <ul className="article-list">
            {g.alternatives.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </details>
        <p className="small muted">
          Content updated {g.updated}. References (open online):{" "}
          {g.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 ? "; " : ""}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.organization}: {s.title}
              </a>
            </span>
          ))}
        </p>
      </section>
      <p>
        <a href="#/notebook">Keep a symptom / medication log in Notebook</a>.
        Save your own clinician’s plan and emergency contacts before an outage.
      </p>
    </>
  );
}
