import { z } from "zod";

import type { Client, PaymentCreate, Renewal } from "@/api/types";
import { monthIST, todayIST } from "@/lib/format";

export const PAYMENT_TYPES = ["monthly", "setup", "other"] as const;
export const PAYMENT_METHODS = ["UPI", "cash", "bank", "card"] as const;

export const paymentSchema = z
  .object({
    client_id: z.string().min(1, "Choose a client"),
    type: z.enum(PAYMENT_TYPES),
    for_month: z.string(), // YYYY-MM
    amount: z
      .string()
      .trim()
      .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, "Enter the amount in rupees"),
    paid_on: z.string().min(1, "Pick the date"),
    method: z.enum(PAYMENT_METHODS),
    reference: z.string(),
    note: z.string(),
  })
  .refine((v) => v.type !== "monthly" || /^\d{4}-\d{2}$/.test(v.for_month), {
    path: ["for_month"],
    message: "Pick the month this payment is for",
  });

export type PaymentFormValues = z.infer<typeof paymentSchema>;

/** Amount for a type, from the client's fees. */
export function feeFor(client: Pick<Client, "setup_fee" | "monthly_fee"> | undefined, type: string): string {
  if (!client) return "";
  if (type === "setup") return String(Number(client.setup_fee));
  if (type === "monthly") return String(Number(client.monthly_fee));
  return "";
}

export function emptyPaymentValues(partial: Partial<PaymentFormValues> = {}): PaymentFormValues {
  return {
    client_id: "",
    type: "monthly",
    for_month: monthIST(),
    amount: "",
    paid_on: todayIST(),
    method: "UPI",
    reference: "",
    note: "",
    ...partial,
  };
}

/** "Mark paid" on a renewal row → prefilled monthly payment for the right month and amount. */
export function monthlyPrefill(r: Renewal): Partial<PaymentFormValues> {
  const month = (r.period_month ?? r.due_date ?? "").slice(0, 7) || monthIST();
  return { client_id: r.client_id, type: "monthly", for_month: month, amount: String(Number(r.amount)) };
}

/** "Mark ₹X paid" for the setup fee. */
export function setupPrefill(r: Renewal): Partial<PaymentFormValues> {
  return { client_id: r.client_id, type: "setup", amount: String(Number(r.setup_fee)) };
}

export function valuesToPayment(v: PaymentFormValues): PaymentCreate {
  return {
    client_id: v.client_id,
    type: v.type,
    amount: v.amount,
    for_month: v.type === "monthly" ? `${v.for_month}-01` : null,
    paid_on: v.paid_on,
    method: v.method,
    reference: v.reference.trim() || null,
    note: v.note.trim() || null,
  };
}
