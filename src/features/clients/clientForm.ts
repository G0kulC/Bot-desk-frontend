import { z } from "zod";

import type { AppConfig, Client, ClientCreate } from "@/api/types";
import { addDaysISO, todayIST } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";

export const FORM_LANGUAGES = [
  "English",
  "Tamil",
  "Hindi",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Odia",
  "Urdu",
] as const;

export const NICHES = [
  "dental_clinic",
  "skin_clinic",
  "salon",
  "coaching_centre",
  "gym",
  "bakery_sweets",
  "real_estate",
  "restaurant",
  "other",
] as const;

export const STATUSES = ["lead", "trial", "live", "paused"] as const;
export const PACKAGES = ["starter", "business", "growth", "custom"] as const;

/** Fallback prices if /config hasn't loaded (must match the backend defaults). */
export const DEFAULT_PACKAGE_FEES: Record<string, { setup: number; monthly: number }> = {
  starter: { setup: 3999, monthly: 1999 },
  business: { setup: 7999, monthly: 3999 },
  growth: { setup: 12999, monthly: 6999 },
};

const money = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0), "Enter an amount in rupees");

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(255),
  niche: z.enum(NICHES),
  city: z.string().trim().max(128),
  owner_name: z.string().trim().max(255),
  owner_phone: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || normalizePhone(v) !== null,
      "Enter a valid WhatsApp number, e.g. +91 98400 12345",
    ),
  languages: z.array(z.string()).min(1, "Pick at least one language"),
  package: z.enum(PACKAGES),
  setup_fee: money,
  monthly_fee: money,
  status: z.enum(STATUSES),
  trial_start: z.string(),
  live_date: z.string(),
  provider_override: z.enum(["", "own", "aisensy"]),
  notes: z.string(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export function packageFees(
  pkg: string,
  config?: AppConfig | null,
): { setup: string; monthly: string } | null {
  const p = config?.packages?.[pkg] ?? DEFAULT_PACKAGE_FEES[pkg];
  if (!p) return null;
  return { setup: String(Number(p.setup)), monthly: String(Number(p.monthly)) };
}

export function emptyClientValues(config?: AppConfig | null): ClientFormValues {
  const fees = packageFees("starter", config);
  return {
    name: "",
    niche: "dental_clinic",
    city: "",
    owner_name: "",
    owner_phone: "",
    languages: ["English", "Tamil"],
    package: "starter",
    setup_fee: fees?.setup ?? "",
    monthly_fee: fees?.monthly ?? "",
    status: "lead",
    trial_start: "",
    live_date: "",
    provider_override: "",
    notes: "",
  };
}

export function clientToValues(c: Client): ClientFormValues {
  return {
    name: c.name,
    niche: c.niche,
    city: c.city ?? "",
    owner_name: c.owner_name ?? "",
    owner_phone: c.owner_phone ?? "",
    languages: c.languages?.length ? c.languages : ["English"],
    package: c.package,
    setup_fee: String(Number(c.setup_fee)),
    monthly_fee: String(Number(c.monthly_fee)),
    status: c.status,
    trial_start: c.trial_start ?? "",
    live_date: c.live_date ?? "",
    provider_override: c.provider_override ?? "",
    notes: c.notes ?? "",
  };
}

/** Status change side effects: trial → trial start today, live → go-live today (only when empty). */
export function datesForStatus(
  status: string,
  current: { trial_start: string; live_date: string },
  today: string = todayIST(),
): { trial_start?: string; live_date?: string } {
  if (status === "trial" && !current.trial_start) return { trial_start: today };
  if (status === "live" && !current.live_date) return { live_date: today };
  return {};
}

export function valuesToPayload(v: ClientFormValues): ClientCreate {
  return {
    name: v.name.trim(),
    niche: v.niche,
    city: v.city.trim(),
    owner_name: v.owner_name.trim(),
    owner_phone: v.owner_phone ? normalizePhone(v.owner_phone) : null,
    languages: v.languages,
    package: v.package,
    setup_fee: v.setup_fee === "" ? null : v.setup_fee,
    monthly_fee: v.monthly_fee === "" ? null : v.monthly_fee,
    status: v.status,
    trial_start: v.trial_start || null,
    live_date: v.live_date || null,
    provider_override: v.provider_override || null,
    notes: v.notes.trim() || null,
    bot_enabled: true,
  };
}

export function trialEnd(client: { trial_start?: string | null }, trialDays = 7): string | null {
  return client.trial_start ? addDaysISO(client.trial_start, trialDays) : null;
}
