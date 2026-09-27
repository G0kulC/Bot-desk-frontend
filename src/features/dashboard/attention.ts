import {
  AlertTriangle,
  BellOff,
  CalendarClock,
  CircleDollarSign,
  Hand,
  Receipt,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

import type { Attention } from "@/api/types";

export type AttentionMeta = { icon: LucideIcon; tone: "bad" | "warn" | "brand"; to: string; action: string };

/** Where each kind of "needs attention" item should take you. */
export function attentionMeta(item: Attention): AttentionMeta {
  const c = item.client_id;
  switch (item.kind) {
    case "payment_overdue":
      return { icon: AlertTriangle, tone: "bad", to: "/payments", action: "Record payment" };
    case "payment_due":
      return { icon: CircleDollarSign, tone: "warn", to: "/payments", action: "Record payment" };
    case "setup_unpaid":
      return { icon: Receipt, tone: "warn", to: "/payments", action: "Mark setup paid" };
    case "trial_ending":
      return { icon: CalendarClock, tone: "warn", to: `/clients/${c}?tab=report`, action: "Send report" };
    case "handoff_waiting":
      return { icon: Hand, tone: "bad", to: `/inbox?client=${c}&handoff=1`, action: "Open chats" };
    case "channel_silent":
      return { icon: WifiOff, tone: "warn", to: `/clients/${c}?tab=channel`, action: "Check channel" };
    case "alert_undelivered":
      return { icon: BellOff, tone: "bad", to: `/clients/${c}?tab=conversations`, action: "Open chats" };
    default:
      return { icon: AlertTriangle, tone: "brand", to: c ? `/clients/${c}` : "/", action: "Open" };
  }
}

const ORDER = [
  "payment_overdue",
  "handoff_waiting",
  "alert_undelivered",
  "payment_due",
  "setup_unpaid",
  "trial_ending",
  "channel_silent",
];

export function sortAttention(items: Attention[]): Attention[] {
  const rank = (k: string) => {
    const i = ORDER.indexOf(k);
    return i === -1 ? ORDER.length : i;
  };
  return [...items].sort((a, b) => rank(a.kind) - rank(b.kind));
}
