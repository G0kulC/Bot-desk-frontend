import type { Contact } from "@/api/types";
import { hoursSince } from "@/lib/format";

export const REPLY_WINDOW_HOURS = 24;

/** WhatsApp allows free-form replies only within 24 hours of the customer's last message. */
export function canReply(contact: Pick<Contact, "last_inbound_at"> | undefined, now = new Date()): boolean {
  return Boolean(contact?.last_inbound_at) && hoursSince(contact?.last_inbound_at, now) < REPLY_WINDOW_HOURS;
}
