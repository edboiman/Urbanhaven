import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useLiveQuery } from "../storage/idb";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Download,
  Upload,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Sprout,
  ArrowUpRight,
  RefreshCw,
  WifiOff,
  ShieldCheck,
  X,
  Save,
  HardDrive,
  ExternalLink,
} from "../components/icons";
import { db, uid, setPreferences, sha256 } from "../storage/db";
import {
  exportBackup,
  restoreBackup,
  deleteAllPersonalData,
  saveFile,
  validateBackup,
} from "../storage/backup";
import {
  supplyCategories,
  type Supply,
  type Note,
  type GardenEntry,
  type LocalDocument,
  type Crop,
} from "../types";
import { guides, crops } from "../content";
import {
  PageTitle,
  Field,
  Empty,
  Callout,
  SectionHeading,
  LinkButton,
  useHaven,
  s,
  n,
  errorMessage,
} from "../components/shared";
import {
  verifyOffline,
  storageInfo,
  type OfflineState,
} from "../services/offline";
const blankNote = (): Note => ({
  id: uid(),
  title: "",
  body: "",
  tags: "",
  sensitive: true,
  updated: new Date().toISOString(),
});
export function Notebook() {
  const { toast } = useHaven();
  const notes = useLiveQuery(() => db.notes.toArray(), []) || [];
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);
  const [error, setError] = useState("");
  const shown = notes.filter((x) =>
    (x.title + " " + x.body + " " + x.tags)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="YOUR PLAN, IN YOUR WORDS"
        title="Keep the important things close."
        description="Emergency contacts, meeting places, shutoff locations and observations. Private on this device."
        action={
          <button className="button" onClick={() => setEditing(blankNote())}>
            <Plus size={17} />
            New note
          </button>
        }
      />
      <div className="notebook-prompts">
        {[
          "Emergency contacts",
          "Home shutoffs",
          "Meeting places",
          "Medication plan",
          "Garden notes",
        ].map((x) => (
          <button
            className="chip"
            key={x}
            onClick={() =>
              setEditing({
                ...blankNote(),
                title: x,
                tags: x.toLowerCase(),
                body:
                  x === "Emergency contacts"
                    ? "Name:\nPhone:\nRelationship:\nOut-of-area contact:\nMeeting / check-in plan:"
                    : "",
              })
            }
          >
            <Plus size={14} />
            {x}
          </button>
        ))}
      </div>
      {editing && (
        <form
          className="panel edit-form"
          key={editing.id}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const f = new FormData(e.currentTarget);
              await db.notes.put({
                ...editing,
                title: s(f, "title"),
                body: s(f, "body"),
                tags: s(f, "tags"),
                sensitive: f.has("sensitive"),
                updated: new Date().toISOString(),
              });
              setEditing(null);
              setError("");
              toast("Note saved locally.");
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        >
          <SectionHeading title="Write a note">
            <button
              type="button"
              className="icon-button"
              onClick={() => setEditing(null)}
              aria-label="Cancel note"
            >
              <X />
            </button>
          </SectionHeading>
          <Field label="Title">
            <input
              name="title"
              maxLength={160}
              defaultValue={editing.title}
              required
              autoFocus
            />
          </Field>
          <Field label="Your note">
            <textarea
              name="body"
              maxLength={20000}
              rows={9}
              defaultValue={editing.body}
              required
            />
          </Field>
          <Field label="Tags (comma separated)">
            <input name="tags" maxLength={300} defaultValue={editing.tags} />
          </Field>
          <label className="check-label">
            <input
              name="sensitive"
              type="checkbox"
              defaultChecked={editing.sensitive}
            />
            Sensitive: omit from backups unless explicitly included
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="button">
              <Save size={16} />
              Save note
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="search-input">
        <Search size={18} />
        <input
          aria-label="Search notebook"
          placeholder="Search notes, tags, or contacts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {shown.length ? (
        <div className="notes-grid">
          {shown.map((note) => (
            <article className="panel note-card" key={note.id}>
              <div className="section-heading">
                <span className="eyebrow">
                  {note.sensitive ? (
                    <>
                      <LockKeyhole size={12} /> SENSITIVE
                    </>
                  ) : (
                    "PERSONAL NOTE"
                  )}
                </span>
                <button
                  className="icon-button"
                  aria-label={"Edit " + note.title}
                  onClick={() => setEditing(note)}
                >
                  <Pencil size={16} />
                </button>
              </div>
              <h2>{note.title}</h2>
              <p className="note-body">{note.body}</p>
              <div className="note-tags">
                {note.tags
                  .split(",")
                  .filter(Boolean)
                  .map((t, i) => (
                    <button
                      key={i}
                      className="chip"
                      onClick={() => setQuery(t.trim())}
                    >
                      {t.trim()}
                    </button>
                  ))}
              </div>
              <div className="section-heading">
                <small className="muted">
                  Updated {note.updated.slice(0, 10)}
                </small>
                <button
                  className="icon-button"
                  aria-label={"Delete " + note.title}
                  onClick={async () => {
                    if (confirm("Delete this note?"))
                      await db.notes
                        .delete(note.id)
                        .catch((e) => toast(errorMessage(e)));
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="A little planning, written down.">
          Keep phone numbers and essential plans here. Make a printed copy too.
        </Empty>
      )}
      <Callout>
        This notebook is not encrypted by the app. Protect your device and
        exported files. Notes are not an emergency messaging service.
      </Callout>
    </>
  );
}
export function Documents() {
  const { toast } = useHaven();
  const documents = useLiveQuery(() => db.documents.toArray(), []) || [];
  const [selected, setSelected] = useState<LocalDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error("Choose a PDF no larger than 20 MB.");
      const data = await file.arrayBuffer();
      if (!new TextDecoder().decode(data.slice(0, 1024)).includes("%PDF-"))
        throw new Error("This file does not have a valid PDF signature.");
      const hash = await sha256(data);
      if (documents.some((x) => x.sha256 === hash))
        throw new Error("This document is already saved.");
      await db.documents.put({
        id: uid(),
        name: file.name.slice(0, 180),
        bytes: new Blob([data], { type: "application/pdf" }),
        size: data.byteLength,
        added: new Date().toISOString(),
        sha256: hash,
      });
      toast("PDF saved in device storage. Open it to check rendering.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="REFERENCE MATERIAL, WITHIN REACH"
        title="A shelf that goes with you."
        description="Import a PDF from your device. The bundled PDF reader works without an online viewer."
        action={
          <label className="button upload-label">
            <Upload size={17} />
            {busy ? "Importing…" : "Import a PDF"}
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              onChange={(e) => {
                void importFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        }
      />
      <Callout>
        Essential instructions are searchable in the Field guide. Imported PDFs
        are optional and stored separately. They are not included in JSON
        backups; export each original to move it to another device. Only import
        trusted files. Availability is checked again when opening.
      </Callout>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="search-input">
        <Search size={18} />
        <input
          aria-label="Search documents"
          placeholder="Search document names…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <section className="panel bundled-doc">
        <FileText size={28} />
        <div>
          <h3>Household readiness workbook</h3>
          <p>
            A compact planning sheet: contacts, supply checklist and offline
            verification steps.
          </p>
        </div>
        <button
          className="button secondary"
          onClick={async () => {
            try {
              const res = await fetch(
                new URL(
                  "documents/readiness-workbook.pdf",
                  new URL(import.meta.env.BASE_URL, location.href),
                ),
              );
              if (!res.ok)
                throw new Error(
                  "Workbook is unavailable. Check offline setup.",
                );
              const bytes = await res.blob();
              setSelected({
                id: "bundled-workbook",
                name: "Household readiness workbook",
                bytes,
                size: bytes.size,
                added: "2026-10-31",
                sha256: "",
              });
            } catch (e) {
              toast(errorMessage(e));
            }
          }}
        >
          Read here
        </button>
        <a
          className="button secondary"
          href="./documents/readiness-workbook.pdf"
          download
        >
          <Download size={16} />
          Save PDF
        </a>
      </section>
      {documents.filter((d) =>
        d.name.toLowerCase().includes(query.toLowerCase()),
      ).length ? (
        <div className="notes-grid">
          {documents
            .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
            .map((d) => (
              <article className="panel document-card" key={d.id}>
                <FileText size={30} />
                <h3>{d.name}</h3>
                <p>
                  {(d.size / 1024 / 1024).toFixed(2)} MB · imported{" "}
                  {d.added.slice(0, 10)}
                </p>
                <span className="status-badge good">
                  <Check size={13} />
                  Stored locally · hash checked on open
                </span>
                <div className="form-actions">
                  <button
                    className="button"
                    onClick={async () => {
                      try {
                        const fresh = await db.documents.get(d.id);
                        if (!fresh)
                          throw new Error(
                            "This file is no longer present in device storage. Import it again.",
                          );
                        if (
                          (await sha256(await fresh.bytes.arrayBuffer())) !==
                          fresh.sha256
                        )
                          throw new Error(
                            "The document failed its integrity check. Reimport the original.",
                          );
                        setSelected(fresh);
                      } catch (e) {
                        toast(errorMessage(e));
                      }
                    }}
                  >
                    Open PDF
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Export " + d.name}
                    onClick={() => saveFile(d.bytes, d.name)}
                  >
                    <Download size={17} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Delete " + d.name}
                    onClick={async () => {
                      if (confirm("Delete this local PDF?"))
                        await db.documents
                          .delete(d.id)
                          .catch((e) => toast(errorMessage(e)));
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
        </div>
      ) : (
        <Empty title="Make room for trusted references.">
          Import a PDF while you have access to it, then open it here before an
          outage.
        </Empty>
      )}
      {selected && (
        <section className="panel pdf-section">
          <SectionHeading title={selected.name}>
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              <X size={16} />
              Close reader
            </button>
          </SectionHeading>
          <PDFReader document={selected} />
        </section>
      )}
    </>
  );
}
function PDFReader({ document: record }: { document: LocalDocument }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<import("pdfjs-dist").PDFDocumentProxy | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let disposed = false;
    let task: import("pdfjs-dist").PDFDocumentLoadingTask | undefined;
    setError("");
    setLoading(true);
    setDoc(null);
    setPage(1);
    void (async () => {
      try {
        const pdf = await import("pdfjs-dist");
        pdf.GlobalWorkerOptions.workerSrc = new URL(
          __PDF_WORKER__,
          new URL(import.meta.env.BASE_URL, location.href),
        ).href;
        const local = new URL(import.meta.env.BASE_URL, location.href);
        task = pdf.getDocument({
          data: new Uint8Array(await record.bytes.arrayBuffer()),
          cMapUrl: new URL("pdfjs/cmaps/", local).href,
          cMapPacked: true,
          standardFontDataUrl: new URL("pdfjs/standard_fonts/", local).href,
          wasmUrl: new URL("pdfjs/wasm/", local).href,
          enableXfa: false,
        });
        const result = await task.promise;
        if (!disposed) {
          setDoc(result);
          setLoading(false);
        }
      } catch (e) {
        if (!disposed) {
          setError(
            errorMessage(e) +
              " Password-protected or malformed PDFs may not be supported.",
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      disposed = true;
      void task?.destroy();
    };
  }, [record.id]);
  useEffect(() => {
    if (!doc || !canvas.current) return;
    let cancelled = false;
    let task: import("pdfjs-dist").RenderTask | undefined;
    void (async () => {
      try {
        const p = await doc.getPage(page);
        if (cancelled || !canvas.current) return;
        const viewport = p.getViewport({ scale: 1.25 * zoom });
        canvas.current.width = viewport.width;
        canvas.current.height = viewport.height;
        task = p.render({ canvas: canvas.current, viewport });
        await task.promise;
        const contents = await p.getTextContent();
        if (!cancelled)
          setText(
            contents.items.map((i) => ("str" in i ? i.str : "")).join(" "),
          );
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, zoom]);
  return (
    <>
      {loading && <p role="status">Opening the local PDF…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {doc && (
        <div className="pdf-toolbar">
          <button
            className="icon-button"
            disabled={page <= 1}
            aria-label="Previous PDF page"
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </button>
          <span>
            Page {page} of {doc.numPages}
          </span>
          <button
            className="icon-button"
            disabled={page >= doc.numPages}
            aria-label="Next PDF page"
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </button>
          <select
            aria-label="PDF zoom"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            <option value={1}>100%</option>
            <option value={1.5}>150%</option>
            <option value={2}>200%</option>
          </select>
        </div>
      )}
      <div className="pdf-canvas">
        <canvas ref={canvas} aria-label={`PDF page ${page}`} />
      </div>
      {doc && (
        <details className="pdf-text">
          <summary>Accessible text for this page</summary>
          <p>
            {text || "No extractable text. This page may be a scanned image."}
          </p>
        </details>
      )}
    </>
  );
}
export function Offline({
  state,
  setState,
}: {
  state: OfflineState;
  setState: Dispatch<SetStateAction<OfflineState>>;
}) {
  const { toast } = useHaven();
  const [info, setInfo] = useState<Awaited<
    ReturnType<typeof storageInfo>
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    void storageInfo()
      .then(setInfo)
      .catch((e) => toast(errorMessage(e)));
  }, [state.status]);
  const verify = async (repair: boolean) => {
    setBusy(true);
    controller.current = new AbortController();
    await verifyOffline(setState, repair, controller.current.signal);
    setBusy(false);
  };
  return (
    <>
      <PageTitle
        eyebrow="CONFIDENCE, BEFORE THE CONNECTION GOES"
        title="Ready when you’re offline."
        description="Check the actual files on this device. A green badge only appears after they pass verification."
      />
      <div
        className={
          "panel offline-hero " + (state.status === "ready" ? "ready" : "")
        }
      >
        <span className="offline-big-icon">
          {state.status === "ready" ? (
            <ShieldCheck size={42} />
          ) : (
            <Download size={42} />
          )}
        </span>
        <div>
          <p className="eyebrow">
            {state.status === "ready"
              ? "CORE FILES VERIFIED"
              : "OFFLINE READINESS CHECK"}
          </p>
          <h2>
            {state.status === "ready"
              ? "Your field guide is close at hand."
              : "Let’s make this device ready."}
          </h2>
          <p role="status">{state.message}</p>
          {state.total > 0 && (
            <>
              <progress
                max={state.total}
                value={state.progress}
                aria-label="Offline verification progress"
              />
              <small>
                {state.progress} / {state.total} files checked ·{" "}
                {(state.bytes / 1024 / 1024).toFixed(2)} MB verified
              </small>
            </>
          )}
          {state.checked && (
            <small>
              Last verified: {state.checked} · edition {state.version}
            </small>
          )}
          <div className="form-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => void verify(true)}
            >
              <Download size={16} />
              {busy ? "Checking files…" : "Download & verify"}
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void verify(false)}
            >
              <RefreshCw size={16} />
              Recheck local files
            </button>
            {busy && (
              <button
                className="button secondary"
                onClick={() => controller.current?.abort()}
              >
                Pause
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>What’s included</h2>
          <ul className="checked-list">
            <li>
              <Check size={17} />
              {guides.length} complete guides & local search
            </li>
            <li>
              <Check size={17} />
              14-day checklist, water guide, pantry meals, calculators &
              emergency workflows
            </li>
            <li>
              <Check size={17} />
              Michigan overview map, map catalog and {crops.length} crop
              profiles with frost-date table
            </li>
            <li>
              <Check size={17} />
              Interface, icons, workbook & PDF reader assets
            </li>
          </ul>
          <p>
            Personal records live in IndexedDB, separately from app caches.
            Optional regional map packs are verified separately on the Map page;
            imported PDFs on the Documents page.
          </p>
          <LinkButton to="documents" className="text-link">
            Manage your document pack
          </LinkButton>
        </section>
        <section className="panel">
          <h2>Device storage</h2>
          <div className="storage-meter">
            <HardDrive size={25} />
            <strong>
              {((info?.estimate?.usage || 0) / 1024 / 1024).toFixed(1)} MB
              <small>used by this site (browser estimate)</small>
            </strong>
          </div>
          <p>
            Estimated quota:{" "}
            {((info?.estimate?.quota || 0) / 1024 / 1024).toFixed(0)} MB ·
            Persistent storage:{" "}
            <strong>
              {info?.persistent ? "granted" : "not granted / unavailable"}
            </strong>
          </p>
          <button
            className="button secondary"
            onClick={async () => {
              try {
                const granted = await navigator.storage?.persist();
                setInfo(await storageInfo());
                toast(
                  granted
                    ? "Browser granted persistent storage. Backups are still important."
                    : "Persistent storage was not granted. Install the app and keep a backup.",
                );
              } catch (e) {
                toast(errorMessage(e));
              }
            }}
          >
            Request persistent storage
          </button>
        </section>
      </div>
      <Callout>
        <strong>Browser storage can still be removed.</strong>
        <p>
          No PWA can guarantee permanent offline storage. Android or the browser
          may clear site data, especially under storage pressure or after manual
          clearing. Use persistent storage when available, keep exported backups
          and recheck before travel or bad weather. This check records the files
          present now.
        </p>
      </Callout>
      <section className="panel">
        <h2>Install & do a real offline check</h2>
        <ol className="steps">
          <li>
            Open the published HTTPS app in Android Chrome. Wait for the initial
            setup and select Download & verify.
          </li>
          <li>
            Use Chrome’s menu → Add to home screen → Install. Wording varies by
            Chrome version.
          </li>
          <li>
            Turn on airplane mode, close the app completely and launch it from
            its icon.
          </li>
          <li>
            Open a guide, search, use a calculator, save a supply and open an
            imported PDF. Restart your phone and repeat before relying on it.
          </li>
          <li>
            Keep a printed plan. Local shelter availability, calls, source
            websites and new downloads need outside connectivity.
          </li>
        </ol>
        <p className="small muted">
          A website cannot control Android radio settings, system brightness or
          battery-saver settings. Physical Android installation and restart
          checks are required.
        </p>
      </section>
    </>
  );
}
export function Preferences() {
  const { settings, toast } = useHaven();
  const [sensitive, setSensitive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    supplies: number;
    notes: number;
    garden: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageTitle
        eyebrow="MAKE IT YOUR OWN"
        title="Settings & peace of mind."
        description="Reading preferences, portable backups and a clear explanation of your data."
      />
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Comfortable reading</h2>
          <Field label="Theme">
            <select
              value={settings.theme}
              onChange={(e) =>
                void setPreferences({
                  theme: e.target.value as "light" | "dark",
                }).catch((e) => toast(errorMessage(e)))
              }
            >
              <option value="light">Warm daylight</option>
              <option value="dark">Quiet night</option>
            </select>
          </Field>
          <label className="setting-toggle">
            <span>
              <strong>Large text</strong>
              <small>More space for every word.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={(e) =>
                void setPreferences({ largeText: e.target.checked }).catch(
                  (e) => toast(errorMessage(e)),
                )
              }
            />
          </label>
          <label className="setting-toggle">
            <span>
              <strong>Emergency reading mode</strong>
              <small>
                High contrast, larger controls, warnings and essential steps.
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.emergency}
              onChange={(e) =>
                void setPreferences({ emergency: e.target.checked }).catch(
                  (e) => toast(errorMessage(e)),
                )
              }
            />
          </label>
          <p className="small muted">
            Motion follows your system preference. No continuous animation or
            hardware-control claims.
          </p>
        </section>
        <section className="panel">
          <h2>Make a portable backup</h2>
          <p className="small">
            Backups include private marker photos, waypoint paths, radio presets
            and pet records. They are not encrypted. The sensitive checkbox
            below only filters notebook entries.
          </p>
          <p>
            Export supplies, checklist choices, usage history, map markers,
            garden, seed and harvest records, meal plan, saved guides, settings
            and selected notes as JSON. Move the file to another phone and
            restore it there.
          </p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={sensitive}
              onChange={(e) => setSensitive(e.target.checked)}
            />
            Include sensitive notebook entries
          </label>
          <p className="small muted">
            All inventory entries and supply notes are included. Imported PDFs
            (export them from Documents) and downloaded map packs (download them
            again on the new phone) are NOT included. Backup files are not
            encrypted.
          </p>
          <button
            className="button"
            onClick={async () => {
              try {
                saveFile(
                  new Blob(
                    [JSON.stringify(await exportBackup(sensitive), null, 2)],
                    { type: "application/json" },
                  ),
                  "urban-haven-backup-" +
                    new Date().toISOString().slice(0, 10) +
                    ".json",
                );
                toast("Backup exported. Store a copy somewhere safe.");
              } catch (e) {
                toast(errorMessage(e));
              }
            }}
          >
            <Download size={16} />
            Export backup
          </button>
        </section>
      </div>
      <section className="panel">
        <h2>Restore or transfer a backup</h2>
        <p>
          Import merges records by ID; matching IDs are replaced and other
          records stay. Preferences are restored. Backups from v1.0.0 (schema 1)
          and this version (schema 2) are accepted. PDFs, map packs and recent
          history are not included.
        </p>
        <label className="button secondary upload-label">
          <Upload size={16} />
          Choose JSON backup
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const selected = e.target.files?.[0];
              e.target.value = "";
              setPreview(null);
              setFile(null);
              setError("");
              if (!selected) return;
              try {
                if (selected.size > 30 * 1024 * 1024)
                  throw new Error("Choose a file smaller than 30 MB.");
                const data = validateBackup(JSON.parse(await selected.text()));
                setFile(selected);
                setPreview({
                  supplies: data.supplies.length,
                  notes: data.notes.length,
                  garden: data.garden.length,
                });
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          />
        </label>
        {preview && (
          <div className="restore-preview">
            <p>
              <strong>{file?.name}</strong>: {preview.supplies} supply records,{" "}
              {preview.notes} notes, {preview.garden} garden entries.
            </p>
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                if (!file) return;
                setBusy(true);
                try {
                  await restoreBackup(file);
                  setPreview(null);
                  setFile(null);
                  toast("Backup restored successfully.");
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Restoring…" : "Merge this backup"}
            </button>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <section className="panel privacy">
        <p className="eyebrow">A SIMPLE PRIVACY PROMISE</p>
        <h2>Your plans stay on your device.</h2>
        <p>
          The app has no accounts, advertising, analytics, cloud database or AI
          service. Your location is requested only when you tap the GPS button
          on the map; it is used on this device and saved only if you save it as
          a marker. Personal data is kept in your browser’s IndexedDB. Notes are
          rendered as text. Backups are checked for format, types, size and
          valid quantities before an atomic database merge.
        </p>
        <p>
          The app itself sends no personal records to a server. Your hosting
          provider still receives ordinary web requests when you load or update
          the app. Source links open outside the app and may have their own
          privacy practices.
        </p>
        <h3>Source standards</h3>
        <p>
          Core safety guides cite CDC, EPA, public health, USDA, weather
          services, first-aid organizations and university extension resources.
          Sources were checked on October 31, 2026. This is educational content;
          it has not had independent clinical, engineering or
          emergency-management review. Follow current local instructions and
          individual professional advice. No information is a guarantee of
          safety.
        </p>
        <h3>Map data licenses</h3>
        <p>
          Map geometry: Natural Earth (public domain). Place names: U.S. Census
          Bureau Gazetteer 2025 and USGS GNIS (public domain), obtained via the
          MIT-licensed us_geo project. No OpenStreetMap tiles are used. Icons:
          Lucide (ISC). Full notices are in THIRD_PARTY_NOTICES.md.
        </p>
        <h3>Updates & optional AI</h3>
        <p>
          App updates wait for your Update & reload action. Personal records are
          stored separately from versioned caches. No language model is included
          or downloaded; the core experience works without AI. A future Android
          package could bundle the essential files, with device tests required.
        </p>
        <h3>Remove local data</h3>
        <p>
          Export first. Clearing site data in Android Chrome removes app caches
          and personal records. The button below deletes personal records in
          this browser; the reference library stays installed.
        </p>
        <button
          className="button destructive"
          onClick={async () => {
            if (
              !confirm(
                "Delete all supplies, notes, garden records, imported PDFs, saved guides, history and settings from this browser? Export a backup first.",
              )
            )
              return;
            try {
              await deleteAllPersonalData();
              toast("Personal records deleted from this browser.");
            } catch (e) {
              toast(errorMessage(e));
            }
          }}
        >
          <Trash2 size={16} />
          Delete personal data
        </button>
      </section>
    </>
  );
}
