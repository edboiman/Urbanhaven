import { createContext, useContext, type ReactNode } from "react";
import {
  Droplets,
  Utensils,
  Sprout,
  ShowerHead,
  Zap,
  Thermometer,
  HeartPulse,
  Radio,
  House,
  Wrench,
  ArrowUpRight,
  ChevronRight,
} from "./icons";
import type { Settings, Category } from "../types";
export const HavenContext = createContext<{
  settings: Settings;
  toast: (text: string) => void;
}>({ settings: null!, toast: () => {} });
export const useHaven = () => useContext(HavenContext);
export const icons = {
  water: Droplets,
  food: Utensils,
  farming: Sprout,
  sanitation: ShowerHead,
  power: Zap,
  climate: Thermometer,
  medical: HeartPulse,
  communications: Radio,
  shelter: House,
  repairs: Wrench,
};
export function TopicIcon({
  category,
  size = 20,
}: {
  category: Category;
  size?: number;
}) {
  const Icon = icons[category];
  return <Icon size={size} aria-hidden="true" />;
}
export function go(path: string) {
  location.hash = "/" + path;
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function LinkButton({
  to,
  children,
  className = "button",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={"#/" + to} className={className}>
      {children}
      <ArrowUpRight size={16} />
    </a>
  );
}
export function Callout({
  danger = false,
  children,
}: {
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={danger ? "callout danger" : "callout"}>{children}</div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <Sprout size={32} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function SectionHeading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Trail({ children }: { children: ReactNode }) {
  return (
    <div className="trail">
      <a href="#/library">Field guide</a>
      <ChevronRight size={14} />
      {children}
    </div>
  );
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "That could not be saved. Check device storage and try again.";
}
export const n = (form: FormData, key: string) => Number(form.get(key) || 0);
export const s = (form: FormData, key: string) =>
  String(form.get(key) || "").trim();
