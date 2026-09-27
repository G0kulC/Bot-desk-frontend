import { Bot, BotOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Client, ClientStatus } from "@/api/types";
import { useConfig } from "@/api/useAuth";
import { useToggleBot, useUpdateClient } from "@/api/useClients";
import { useMonthlyReport } from "@/api/useDashboard";
import { useLeads } from "@/api/useLeads";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Button } from "@/components/Button";
import { CallButton } from "@/components/CallButton";
import { Select, Switch } from "@/components/Field";
import { MoneyText } from "@/components/MoneyText";
import { StatusPill } from "@/components/Pill";
import { EmptyState, Skeleton } from "@/components/States";
import { formatDate, formatRelative, monthIST, titleCase } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

import { datesForStatus, STATUSES, trialEnd } from "./clientForm";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

export function OverviewTab({
  client,
  onOpenTab,
}: {
  client: Client;
  onOpenTab: (tab: "report" | "leads") => void;
}) {
  const { data: config } = useConfig();
  const update = useUpdateClient(client.id);
  const toggle = useToggleBot(client.id);
  const [confirmBot, setConfirmBot] = useState(false);
  const leads = useLeads({ client_id: client.id, limit: 5 });
  const report = useMonthlyReport(client.id, monthIST());

  function changeStatus(status: ClientStatus) {
    update.mutate(
      {
        status,
        ...datesForStatus(status, {
          trial_start: client.trial_start ?? "",
          live_date: client.live_date ?? "",
        }),
      },
      {
        onSuccess: () => toast.success(`Status changed to ${titleCase(status)}`),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  }

  function setBot(next: boolean) {
    setConfirmBot(false);
    toggle.mutate(next, {
      onSuccess: () => toast.success(next ? "Bot switched on" : "Bot switched off"),
      onError: (e) => toast.error(errorMessage(e)),
    });
  }

  const end = trialEnd(client, config?.trial_days);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-4" aria-labelledby="facts-h">
        <h2 id="facts-h" className="mb-2 font-semibold">
          Key facts
        </h2>
        <dl>
          <Fact label="Owner">
            {client.owner_name || "—"}
            {client.owner_phone && (
              <span className="block text-ink-2">{formatPhone(client.owner_phone)}</span>
            )}
          </Fact>
          <Fact label="Package">
            {titleCase(client.package)} · <MoneyText value={client.monthly_fee} />
            /mo
          </Fact>
          <Fact label="Setup fee">
            <MoneyText value={client.setup_fee} /> {client.setup_paid ? "· paid" : ""}
          </Fact>
          <Fact label="Languages">{client.languages.join(", ")}</Fact>
          <Fact label="Provider">
            {client.effective_provider === "own" ? "Own (Meta)" : "AiSensy"}{" "}
            <span className="font-normal text-ink-2">
              ({client.provider_override ? "override" : "default"})
            </span>
          </Fact>
          {client.status === "trial" && (
            <Fact label="Trial">
              {formatDate(client.trial_start)} → {formatDate(end)}
            </Fact>
          )}
          <Fact label="Go-live">{formatDate(client.live_date)}</Fact>
          {client.notes && <Fact label="Notes">{client.notes}</Fact>}
        </dl>
        {client.owner_phone && (
          <div className="mt-3">
            <CallButton phone={client.owner_phone} name={client.owner_name || "owner"} />
          </div>
        )}
      </section>

      <div className="space-y-4">
        <section className="card space-y-4 p-4" aria-labelledby="controls-h">
          <h2 id="controls-h" className="font-semibold">
            Controls
          </h2>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="status-select" className="text-sm text-ink-2">
              Status
            </label>
            <Select
              id="status-select"
              value={client.status}
              disabled={update.isPending}
              onChange={(e) => changeStatus(e.target.value as ClientStatus)}
              className="w-40"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">WhatsApp bot</p>
              <p className="text-xs text-ink-2">
                {client.bot_enabled
                  ? "Replying to customers automatically"
                  : "Silent – messages are only stored"}
              </p>
            </div>
            <Switch
              checked={client.bot_enabled}
              label="Bot on/off"
              disabled={toggle.isPending}
              onChange={(next) => (next ? setBot(true) : setConfirmBot(true))}
            />
          </div>
          {confirmBot && (
            <div
              role="alertdialog"
              aria-label="Confirm turning the bot off"
              className="rounded-md border border-warn/40 bg-warn/10 p-3"
            >
              <p className="flex items-center gap-2 text-sm font-medium">
                <BotOff className="size-4 text-warn" /> Turn the bot off for {client.name}?
              </p>
              <p className="mt-0.5 text-xs text-ink-2">
                Customers won't get automatic replies until you switch it back on.
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="danger" onClick={() => setBot(false)}>
                  Turn off
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmBot(false)}>
                  Keep it on
                </Button>
              </div>
            </div>
          )}
          {client.status === "live" && (
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
              <span className="text-sm text-ink-2">Billing</span>
              <span className="flex items-center gap-2 text-sm">
                <StatusPill status={client.billing_status} />
                {client.next_due_date && <span>next due {formatDate(client.next_due_date)}</span>}
              </span>
            </div>
          )}
        </section>

        <section className="card p-4" aria-labelledby="month-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="month-h" className="font-semibold">
              This month
            </h2>
            <Button variant="link" size="sm" onClick={() => onOpenTab("report")}>
              Full report
            </Button>
          </div>
          {report.isLoading ? (
            <Skeleton className="h-16" />
          ) : report.data ? (
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["Chats", report.data.chats],
                ["Leads", report.data.leads],
                ["Bot replies", report.data.bot_replies],
                ["Handoffs", report.data.handoffs],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-md bg-surface-2 py-2">
                  <AnimatedNumber value={value as number} className="font-display text-xl font-semibold" />
                  <p className="text-xs text-ink-2">{label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-2">No numbers yet.</p>
          )}
        </section>

        <section className="card p-4" aria-labelledby="cl-leads-h">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="cl-leads-h" className="font-semibold">
              Recent leads
            </h2>
            <Button variant="link" size="sm" onClick={() => onOpenTab("leads")}>
              All
            </Button>
          </div>
          {leads.isLoading ? (
            <Skeleton className="h-24" />
          ) : leads.data?.length ? (
            <ul className="divide-y divide-line">
              {leads.data.map((l) => (
                <li key={l.id} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {l.name || "Unnamed"} · <span className="font-normal">{l.need || "—"}</span>
                    </p>
                    <p className="text-xs text-ink-2">{formatRelative(l.created_at)}</p>
                  </div>
                  <StatusPill status={l.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Bot />} title="No leads yet" className="py-6">
              Test the bot, then connect the channel.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
