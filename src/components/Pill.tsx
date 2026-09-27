import type { ReactNode } from "react";

import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Tone = "grey" | "amber" | "green" | "red" | "brand" | "blue";

const TONES: Record<Tone, string> = {
  grey: "bg-surface-2 text-ink-2 ring-line",
  amber: "bg-warn/10 text-warn ring-warn/25",
  green: "bg-ok/10 text-ok ring-ok/25",
  red: "bg-bad/10 text-bad ring-bad/25",
  brand: "bg-brand-soft text-brand ring-brand/20",
  blue: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
};

export function Pill({
  tone = "grey",
  children,
  className,
  dot = true,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** One place that decides the colour of every status in the app. */
const STATUS_TONES: Record<string, Tone> = {
  // client status
  lead: "grey",
  trial: "amber",
  live: "green",
  paused: "red",
  // billing
  paid: "green",
  due: "amber",
  overdue: "red",
  upcoming: "grey",
  not_live: "grey",
  // leads
  new: "brand",
  contacted: "blue",
  won: "green",
  lost: "grey",
  // messages
  sent: "grey",
  delivered: "grey",
  read: "green",
  failed: "red",
  received: "grey",
};

const STATUS_LABELS: Record<string, string> = { not_live: "Not live" };

export function StatusPill({ status, className }: { status: string | null | undefined; className?: string }) {
  if (!status) return null;
  return (
    <Pill tone={STATUS_TONES[status] ?? "grey"} className={className}>
      {STATUS_LABELS[status] ?? titleCase(status)}
    </Pill>
  );
}
