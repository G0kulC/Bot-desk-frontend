import { differenceInCalendarDays, differenceInMinutes } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const TZ = "Asia/Kolkata";

// Indian English short months ("Sept", not "Sep").
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type DateInput = string | number | Date | null | undefined;

const inrFormatters = new Map<number, Intl.NumberFormat>();

/** ₹1,23,456 (Indian digit grouping). `decimals` defaults to 0, or 2 when the amount has paise. */
export function formatINR(value: number | string | null | undefined, decimals?: number): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return "₹0";
  const d = decimals ?? (Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2);
  let f = inrFormatters.get(d);
  if (!f) {
    f = new Intl.NumberFormat("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
    inrFormatters.set(d, f);
  }
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${f.format(Math.abs(n))}`;
}

/** 1,23,456 (Indian grouping, no currency). */
export function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

/** Parse API dates. Plain "YYYY-MM-DD" is a calendar date (IST), not UTC midnight. */
export function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+05:30`);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "27 Sept 2026" in IST. */
export function formatDate(value: DateInput, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  const z = toZonedTime(d, TZ);
  return `${z.getDate()} ${MONTHS[z.getMonth()]} ${z.getFullYear()}`;
}

/** "27 Sept" in IST (no year). */
export function formatDayMonth(value: DateInput, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  const z = toZonedTime(d, TZ);
  return `${z.getDate()} ${MONTHS[z.getMonth()]}`;
}

/** "4:05 pm" in IST. */
export function formatTime(value: DateInput, fallback = ""): string {
  const d = toDate(value);
  if (!d) return fallback;
  return formatInTimeZone(d, TZ, "h:mm aaa");
}

/** "27 Sept 2026, 4:05 pm" in IST. */
export function formatDateTime(value: DateInput, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return `${formatDate(d)}, ${formatTime(d)}`;
}

/** Short relative label for lists: "now", "5m", "3h", "Yesterday", "27 Sept". */
export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const d = toDate(value);
  if (!d) return "";
  const mins = differenceInMinutes(now, d);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const days = differenceInCalendarDays(toZonedTime(now, TZ), toZonedTime(d, TZ));
  if (days === 0) return formatTime(d);
  if (days === 1) return "Yesterday";
  return formatDayMonth(d);
}

/** Today's date in IST as YYYY-MM-DD. */
export function todayIST(now: Date = new Date()): string {
  return formatInTimeZone(now, TZ, "yyyy-MM-dd");
}

/** Current month in IST as YYYY-MM. */
export function monthIST(now: Date = new Date()): string {
  return formatInTimeZone(now, TZ, "yyyy-MM");
}

/** "2026-09" → "September 2026"; "2026-09-01" → "September 2026". */
export function formatMonth(value: string | null | undefined, style: "long" | "short" = "long"): string {
  if (!value) return "—";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  const names = style === "long" ? MONTHS_LONG : MONTHS;
  return `${names[m - 1]} ${y}`;
}

/** Add days to a YYYY-MM-DD calendar date. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function hoursSince(value: DateInput, now: Date = new Date()): number {
  const d = toDate(value);
  if (!d) return Infinity;
  return (now.getTime() - d.getTime()) / 3_600_000;
}

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const NICHE_LABELS: Record<string, string> = {
  dental_clinic: "Dental clinic",
  skin_clinic: "Skin clinic",
  salon: "Salon",
  coaching_centre: "Coaching centre",
  gym: "Gym",
  bakery_sweets: "Bakery & sweets",
  real_estate: "Real estate",
  restaurant: "Restaurant",
  other: "Other",
};

export function nicheLabel(niche: string | null | undefined): string {
  if (!niche) return "";
  return NICHE_LABELS[niche] ?? titleCase(niche);
}
