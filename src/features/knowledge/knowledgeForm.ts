import type { Knowledge } from "@/api/types";

export const KNOWLEDGE_FIELDS = [
  {
    name: "address",
    label: "Address",
    rows: 2,
    placeholder: "Shop/clinic address with a landmark",
  },
  { name: "timings", label: "Timings", rows: 2, placeholder: "Mon–Sat 10 AM – 8 PM. Sunday closed." },
  {
    name: "services",
    label: "Services & prices",
    rows: 8,
    placeholder: "One per line, e.g.\nScaling & polishing: ₹1,200\nRoot canal: from ₹4,500",
    hint: "One per line with ₹ prices. The bot may only quote prices listed here or in the questions.",
  },
  {
    name: "faqs",
    label: "Common questions",
    rows: 6,
    placeholder: "Q: Is parking available? A: Yes, two-wheeler parking in front.",
  },
  {
    name: "booking_instructions",
    label: "Booking steps",
    rows: 3,
    placeholder: "Collect name, need, preferred date and time. Say the team will confirm on WhatsApp.",
  },
  {
    name: "rules",
    label: "Never-say rules",
    rows: 4,
    placeholder: "Never diagnose. Never promise discounts. Hand over for complaints and emergencies.",
  },
  { name: "handoff_contact", label: "Handoff contact", rows: 1, placeholder: "Front desk: +91 98400 12345" },
  { name: "tone", label: "Tone", rows: 1, placeholder: "Warm, polite and short." },
] as const;

export type KnowledgeField = (typeof KNOWLEDGE_FIELDS)[number]["name"];
export type KnowledgeValues = Record<KnowledgeField, string>;

/** Editing any of these after approval means the owner must approve again (backend resets it). */
export const APPROVAL_SENSITIVE: KnowledgeField[] = ["services", "faqs", "rules"];

export function knowledgeToValues(kb: Knowledge | null | undefined): KnowledgeValues {
  const out = {} as KnowledgeValues;
  for (const f of KNOWLEDGE_FIELDS) out[f.name] = (kb?.[f.name] as string | undefined) ?? "";
  return out;
}

export function needsReapproval(kb: Knowledge | null | undefined, values: KnowledgeValues): boolean {
  if (!kb?.approved) return false;
  return APPROVAL_SENSITIVE.some((f) => (values[f] ?? "") !== (kb[f] ?? ""));
}

/** Fill only empty fields from a sample template. Returns the fields that were filled. */
export function fillFromTemplate(
  values: KnowledgeValues,
  template: Record<string, string>,
): Partial<KnowledgeValues> {
  const out: Partial<KnowledgeValues> = {};
  for (const f of KNOWLEDGE_FIELDS) {
    if (!values[f.name].trim() && template[f.name]) out[f.name] = template[f.name];
  }
  return out;
}
