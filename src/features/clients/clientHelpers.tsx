import type { Client } from "@/api/types";
import { Pill, StatusPill } from "@/components/Pill";
import { formatDayMonth, todayIST } from "@/lib/format";

import { trialEnd } from "./clientForm";

/** What to do next with this client. */
export function NextStep({ client, trialDays = 7 }: { client: Client; trialDays?: number }) {
  if (client.status === "trial") {
    const end = trialEnd(client, trialDays);
    if (!end) return <span className="text-sm text-ink-2">Set trial start</span>;
    const ended = end < todayIST();
    return (
      <span className={ended ? "text-sm font-medium text-bad" : "text-sm"}>
        Trial {ended ? "ended" : "ends"} {formatDayMonth(end)}
      </span>
    );
  }
  if (client.status === "live") {
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-1.5 text-sm">
        <StatusPill status={client.billing_status} />
        {client.next_due_date && <span className="text-ink-2">{formatDayMonth(client.next_due_date)}</span>}
      </span>
    );
  }
  if (client.status === "lead") return <span className="text-sm text-brand">Send demo</span>;
  return <span className="text-sm text-ink-2">Paused</span>;
}

export function ProviderBadge({ client }: { client: Client }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-sm font-medium">{client.effective_provider === "own" ? "Own" : "AiSensy"}</span>
      <Pill tone={client.provider_override ? "amber" : "grey"} dot={false}>
        {client.provider_override ? "override" : "default"}
      </Pill>
    </span>
  );
}

export function LanguagesText({ languages }: { languages: string[] }) {
  const short = languages.slice(0, 3).join(", ");
  return (
    <span className="text-sm" title={languages.join(", ")}>
      {short}
      {languages.length > 3 && ` +${languages.length - 3}`}
    </span>
  );
}
