import { useEffect, useState } from "react";
import { useLiveQuery, onLiveQueryError } from "./storage/idb";
import {
  House,
  BookOpen,
  Package,
  Calculator,
  Sprout,
  NotebookPen,
  Files,
  Download,
  Settings,
  ArrowRight,
  ShieldCheck,
  WifiOff,
  Menu,
  Sun,
  Moon,
  Check,
  RefreshCw,
  X,
  ListChecks,
  Map as MapIcon,
  Droplets,
  CookingPot,
  Siren,
  Radio,
  HeartPulse,
} from "./components/icons";
import { db, withDefaults, setPreferences } from "./storage/db";
import { HavenContext } from "./components/shared";
import { parseRoute } from "./components/route";
import {
  registerOffline,
  verifyOffline,
  initialOffline,
  activateUpdate,
  type OfflineState,
} from "./services/offline";
import { Home, Library, Article, Tools, Scenario, Urgent } from "./pages/Core";
import { Notebook, Documents, Preferences, Offline } from "./pages/Personal";
import { Supplies } from "./pages/Supplies";
import { Checklist, ChecklistPrint } from "./pages/Checklist";
import { Water } from "./pages/Water";
import { Meals } from "./pages/Meals";
import { Garden } from "./pages/Garden";
import { MapPage } from "./pages/MapPage";

import { Cooking } from "./pages/Cooking";
import { Health } from "./pages/Health";
import { Radio as RadioPage } from "./pages/Radio";
import { Pets } from "./pages/Pets";
import { StorageDates } from "./pages/StorageDates";

const navigation = [
  { path: "", label: "Today", icon: House },
  { path: "checklist", label: "14-day checklist", icon: ListChecks },
  { path: "supplies", label: "Supplies", icon: Package },
  { path: "storage", label: "Storage & shelf lives", icon: Package },
  { path: "water", label: "Water safety", icon: Droplets },
  { path: "map", label: "Michigan map", icon: MapIcon },
  { path: "meals", label: "Pantry & food", icon: CookingPot },
  { path: "cooking", label: "Outdoor cooking", icon: CookingPot },
  { path: "health", label: "Health & first aid", icon: HeartPulse },
  { path: "radio", label: "Radio frequencies", icon: Radio },
  { path: "pets", label: "Pet preparedness", icon: HeartPulse },
  { path: "garden", label: "Grow food", icon: Sprout },
  { path: "library", label: "Field guide", icon: BookOpen },
  { path: "notebook", label: "Notebook", icon: NotebookPen },
  { path: "tools", label: "Calculators", icon: Calculator },
  { path: "documents", label: "Documents", icon: Files },
  { path: "offline", label: "Offline setup", icon: Download },
];
const titles: Record<string, string> = Object.fromEntries(
  navigation.map((n) => [n.path, n.label]),
);

export default function App() {
  const settings = withDefaults(
    useLiveQuery(() => db.settings.get("preferences"), []),
  );
  const [route, setRoute] = useState(parseRoute());
  const [message, setMessage] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [offline, setOffline] = useState<OfflineState>(initialOffline);
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    onLiveQueryError(setMessage);
    const onRoute = () => {
      const next = parseRoute();
      setRoute((prev) => {
        if (prev.path !== next.path) {
          window.scrollTo({ top: 0 });
          setTimeout(
            () =>
              document
                .querySelector<HTMLElement>("main")
                ?.focus({ preventScroll: true }),
            0,
          );
        }
        return next;
      });
    };
    window.addEventListener("hashchange", onRoute);
    const net = () => setOnline(navigator.onLine);
    window.addEventListener("online", net);
    window.addEventListener("offline", net);
    registerOffline(() => setUpdate(true))
      .then(() => verifyOffline(setOffline))
      .catch((e) =>
        setOffline({ ...initialOffline, status: "error", message: e.message }),
      );
    return () => {
      window.removeEventListener("hashchange", onRoute);
      window.removeEventListener("online", net);
      window.removeEventListener("offline", net);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.classList.toggle("large-text", settings.largeText);
    document.documentElement.classList.toggle("emergency", settings.emergency);
  }, [settings.theme, settings.largeText, settings.emergency]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 7000);
    return () => clearTimeout(t);
  }, [message]);
  const path = route.path;
  const section = path.split("/")[0];
  const title = path.startsWith("guide/")
    ? "Field guide"
    : path.startsWith("scenario/") || path === "urgent"
      ? "Urgent help"
      : titles[section] ||
        (path === "settings" ? "Settings & backups" : "Urban Haven");
  let content;
  if (path.startsWith("guide/")) content = <Article id={path.slice(6)} />;
  else if (path.startsWith("scenario/"))
    content = <Scenario id={path.slice(9)} />;
  else if (path === "checklist/print")
    content = <ChecklistPrint view={route.params.get("view") || ""} />;
  else
    switch (path) {
      case "":
        content = <Home offline={offline} />;
        break;
      case "urgent":
        content = <Urgent />;
        break;
      case "checklist":
        content = <Checklist />;
        break;
      case "storage":
        content = <StorageDates />;
        break;
      case "supplies":
        content = <Supplies />;
        break;
      case "water":
        content = <Water />;
        break;
      case "map":
        content = <MapPage />;
        break;
      case "cooking":
        content = <Cooking />;
        break;
      case "health":
        content = <Health />;
        break;
      case "radio":
        content = <RadioPage />;
        break;
      case "pets":
        content = <Pets />;
        break;
      case "meals":
        content = <Meals />;
        break;
      case "library":
        content = <Library />;
        break;
      case "tools":
        content = <Tools />;
        break;
      case "garden":
        content = <Garden />;
        break;
      case "notebook":
        content = <Notebook />;
        break;
      case "documents":
        content = <Documents />;
        break;
      case "offline":
        content = <Offline state={offline} setState={setOffline} />;
        break;
      case "settings":
        content = <Preferences />;
        break;
      case "more":
        content = (
          <>
            <h1>Everything in Urban Haven</h1>
            <div className="more-grid">
              {[
                ...navigation.slice(1),
                {
                  path: "settings",
                  label: "Settings & backups",
                  icon: Settings,
                },
              ].map((x) => (
                <a
                  href={"#/" + x.path}
                  className="panel more-link"
                  key={x.path}
                >
                  <x.icon />
                  <span>{x.label}</span>
                  <ArrowRight size={18} />
                </a>
              ))}
            </div>
          </>
        );
        break;
      default:
        content = (
          <>
            <h1>Page not found</h1>
            <a href="#/">Return to Today</a>
          </>
        );
    }
  const printing = path === "checklist/print";
  return (
    <HavenContext.Provider value={{ settings, toast: setMessage }}>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <div className={"app-layout" + (printing ? " printing" : "")}>
        <aside className="sidebar">
          <a href="#/" className="brand">
            <img src="./icons/icon.svg" alt="" />
            <span>
              Urban Haven<small>MICHIGAN · OFFLINE</small>
            </span>
          </a>
          <a href="#/urgent" className="urgent-link">
            <Siren size={18} /> Urgent help now
          </a>
          <nav aria-label="Main navigation">
            {navigation.map((item) => (
              <a
                href={"#/" + item.path}
                key={item.path}
                className={
                  section === item.path ||
                  (item.path === "library" && path.startsWith("guide/"))
                    ? "nav-item active"
                    : "nav-item"
                }
                aria-current={section === item.path ? "page" : undefined}
              >
                <item.icon size={19} />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="local-note">
              <ShieldCheck size={20} />
              <div>
                <strong>Just you and your device.</strong>
                <p>
                  No accounts. No tracking. Not encrypted — protect your phone.
                </p>
              </div>
            </div>
            <a className="nav-item" href="#/settings">
              <Settings size={18} /> Settings & backups
            </a>
            <span className="version">
              URBAN HAVEN · 2.1.1 · {__BUILD_DATE__}
            </span>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumbs">
              <a href="#/" className="mobile-brand">
                Urban Haven
              </a>
              <span className="crumb-sep">/</span>
              <strong>{title}</strong>
            </div>
            <div className="top-actions">
              <a
                href="#/urgent"
                className="urgent-pill"
                aria-label="Urgent help"
              >
                <Siren size={16} />
                <span>Urgent</span>
              </a>
              <a
                href="#/offline"
                className={
                  "offline-pill " +
                  (offline.status === "ready" ? "verified" : "")
                }
                aria-label={`Offline status: ${offline.status === "ready" ? "files verified" : offline.message}`}
              >
                {offline.status === "ready" ? (
                  <Check size={14} />
                ) : (
                  <WifiOff size={14} />
                )}
                <span>
                  {offline.status === "ready"
                    ? "Offline verified"
                    : "Check offline setup"}
                </span>
              </a>
              <button
                className="icon-button"
                aria-label={
                  settings.theme === "dark"
                    ? "Use light theme"
                    : "Use dark theme"
                }
                onClick={() =>
                  void setPreferences({
                    theme: settings.theme === "dark" ? "light" : "dark",
                  }).catch((e) => setMessage(e.message))
                }
              >
                {settings.theme === "dark" ? (
                  <Sun size={19} />
                ) : (
                  <Moon size={19} />
                )}
              </button>
              <button
                className={
                  "emergency-toggle " + (settings.emergency ? "on" : "")
                }
                aria-pressed={settings.emergency}
                onClick={() =>
                  void setPreferences({ emergency: !settings.emergency }).catch(
                    (e) => setMessage(e.message),
                  )
                }
              >
                <ShieldCheck size={16} />
                <span>
                  {settings.emergency
                    ? "Exit emergency mode"
                    : "Emergency mode"}
                </span>
              </button>
            </div>
          </header>
          {!online && (
            <div className="network-bar" role="status">
              <WifiOff size={15} /> No network connection.{" "}
              {offline.status === "ready"
                ? "The core app and overview map are verified on this device."
                : "Offline files are not verified yet. Open Offline setup when you're back online."}
            </div>
          )}
          {update && (
            <div className="update-bar" role="status">
              <RefreshCw size={16} /> A new edition is downloaded and verified.
              Your records are kept.
              <button onClick={activateUpdate}>Update & reload</button>
            </div>
          )}
          <main id="main" tabIndex={-1}>
            {content}
            <footer className="footer">
              <span>
                Educational planning aid — not an official emergency service.
                Call 911 in an emergency.
              </span>
              <a href="#/settings">Privacy, sources & licenses</a>
            </footer>
          </main>
        </div>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          { path: "", label: "Today", icon: House },
          { path: "checklist", label: "Checklist", icon: ListChecks },
          { path: "map", label: "Map", icon: MapIcon },
          { path: "library", label: "Guides", icon: BookOpen },
          { path: "more", label: "More", icon: Menu },
        ].map((x) => (
          <a
            href={"#/" + x.path}
            className={section === x.path ? "active" : ""}
            key={x.path}
            aria-current={section === x.path ? "page" : undefined}
          >
            <x.icon size={21} />
            <span>{x.label}</span>
          </a>
        ))}
      </nav>
      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button aria-label="Dismiss message" onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </HavenContext.Provider>
  );
}
