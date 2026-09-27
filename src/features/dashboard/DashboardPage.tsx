import {
  ArrowRight,
  Bot,
  CheckCircle2,
  IndianRupee,
  Plus,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Attention, Lead } from "@/api/types";
import { useClientNames } from "@/api/useClients";
import { useDashboard, useResolveAttention } from "@/api/useDashboard";
import { useLeads } from "@/api/useLeads";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { buttonVariants } from "@/components/button-variants";
import { Button } from "@/components/Button";
import { CallButton } from "@/components/CallButton";
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { AnimatedList } from "@/components/magicui/animated-list";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/Pill";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";
import { Fade } from "@/components/Fade";
import { StatTile } from "@/components/StatTile";
import { formatRelative } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { attentionMeta, sortAttention } from "./attention";

const PIPELINE = ["lead", "trial", "live", "paused"] as const;

function AttentionRow({ item, clientName }: { item: Attention; clientName?: string }) {
  const meta = attentionMeta(item);
  const resolve = useResolveAttention();
  return (
    <div className="flex w-full items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          meta.tone === "bad" && "bg-bad/10 text-bad",
          meta.tone === "warn" && "bg-warn/10 text-warn",
          meta.tone === "brand" && "bg-brand-soft text-brand",
        )}
      >
        <meta.icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{item.text}</p>
        {clientName && <p className="truncate text-xs text-ink-2">{clientName}</p>}
      </div>
      <Link to={meta.to} className={buttonVariants({ variant: "soft", size: "sm" })}>
        <span className="hidden sm:inline">{meta.action}</span>
        <ArrowRight aria-hidden />
        <span className="sr-only sm:hidden">{meta.action}</span>
      </Link>
      {item.id && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          loading={resolve.isPending}
          onClick={() =>
            resolve.mutate(item.id as string, {
              onSuccess: () => toast.success("Marked as done"),
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
        >
          {!resolve.isPending && <X />}
        </Button>
      )}
    </div>
  );
}

function AttentionList({ items, names }: { items: Attention[]; names: Map<string, { name: string }> }) {
  const reduced = usePrefersReducedMotion();
  const sorted = sortAttention(items);
  const rows = sorted.map((item, i) => (
    <AttentionRow
      key={item.id ?? `${item.kind}-${item.client_id}-${i}`}
      item={item}
      clientName={item.client_id ? names.get(item.client_id)?.name : undefined}
    />
  ));
  if (reduced) return <div className="space-y-2">{rows}</div>;
  // Magic UI AnimatedList reveals items one by one (newest on top), so feed it in reverse.
  return (
    <AnimatedList delay={120} className="items-stretch gap-2">
      {[...rows].reverse()}
    </AnimatedList>
  );
}

function RecentLeads() {
  const { data, isLoading, error, refetch } = useLeads({ limit: 5 });
  const names = useClientNames();
  if (isLoading) return <Skeleton className="h-40" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data?.length)
    return (
      <EmptyState icon={<Target />} title="No leads yet">
        Leads appear here when an assistant captures a name or booking need.
      </EmptyState>
    );
  return (
    <ul className="divide-y divide-line">
      {data.map((l: Lead) => (
        <li key={l.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {l.name || "Unnamed"} <span className="font-normal text-ink-2">· {l.need || "—"}</span>
            </p>
            <p className="truncate text-xs text-ink-2">
              {names.get(l.client_id)?.name ?? "Client"} · {formatRelative(l.created_at)}
            </p>
          </div>
          <StatusPill status={l.status} className="hidden sm:inline-flex" />
          <CallButton phone={l.phone} name={l.name} />
        </li>
      ))}
    </ul>
  );
}

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();
  const names = useClientNames();
  const reduced = usePrefersReducedMotion();

  if (isLoading)
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-6 h-48" />
      </div>
    );
  if (error || !data)
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );

  const goalReached = data.paying_clients >= data.goal;
  const overdue = Number(data.overdue_amount) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={
          reduced ? (
            `Goal: ${data.goal} paying clients`
          ) : (
            <AnimatedShinyText className="mx-0 max-w-none text-sm text-ink-2">
              Goal: {data.goal} paying clients · {data.messages_7d} messages this week
            </AnimatedShinyText>
          )
        }
        actions={
          <Link to="/clients?new=1" className={buttonVariants()}>
            <Plus /> Add client
          </Link>
        }
      />

      <Fade>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatTile label="Paying clients" to="/clients?status=live" icon={<CheckCircle2 />}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <AnimatedCircularProgressBar
                  max={data.goal}
                  min={0}
                  value={Math.min(data.paying_clients, data.goal)}
                  gaugePrimaryColor="hsl(var(--brand))"
                  gaugeSecondaryColor="hsl(var(--surface-2))"
                  className="size-14 text-[0px] [&>span]:hidden"
                />
                <span className="tnum absolute inset-0 grid place-items-center text-xs font-semibold">
                  {Math.round((Math.min(data.paying_clients, data.goal) / data.goal) * 100)}%
                </span>
              </div>
              <div className="font-display text-[26px] font-semibold leading-none">
                {goalReached && !reduced ? (
                  <SparklesText
                    className="text-[26px] font-semibold"
                    colors={{ first: "hsl(var(--brand))", second: "hsl(var(--ok))" }}
                  >
                    {`${data.paying_clients} / ${data.goal}`}
                  </SparklesText>
                ) : (
                  <span className="tnum">
                    {data.paying_clients} <span className="text-ink-2">/ {data.goal}</span>
                  </span>
                )}
              </div>
            </div>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-label="Paying clients towards goal"
              aria-valuemin={0}
              aria-valuemax={data.goal}
              aria-valuenow={data.paying_clients}
            >
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${Math.min(100, (data.paying_clients / data.goal) * 100)}%` }}
              />
            </div>
          </StatTile>
          <StatTile label="Monthly income (MRR)" value={data.mrr} money icon={<TrendingUp />} />
          <StatTile
            label="Collected this month"
            value={data.collected_this_month}
            money
            icon={<Wallet />}
            to="/payments"
          />
          <StatTile
            label="Overdue"
            value={data.overdue_amount}
            money
            tone={overdue ? "bad" : "default"}
            icon={<IndianRupee />}
            to="/payments"
            footer={
              overdue ? `${data.overdue_count} client${data.overdue_count === 1 ? "" : "s"}` : "All clear"
            }
          />
          <StatTile label="New leads (7 days)" value={data.leads_new_7d} icon={<Target />} to="/leads" />
          <StatTile
            label="AI cost (30 days)"
            value={data.ai_cost_inr_30d}
            money
            decimals={2}
            icon={<Bot />}
            footer={`${data.handoffs_open} chat${data.handoffs_open === 1 ? "" : "s"} waiting for a person`}
          />
        </div>
      </Fade>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Fade delay={0.08}>
          <section className="card p-4" aria-labelledby="attn-h">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="attn-h" className="font-semibold">
                Needs attention
              </h2>
              {data.attention.length > 0 && (
                <span className="tnum rounded-full bg-bad/10 px-2 text-sm font-medium text-bad">
                  {data.attention.length}
                </span>
              )}
            </div>
            {data.attention.length === 0 ? (
              <EmptyState icon={<CheckCircle2 />} title="Nothing needs you right now">
                Payments, trials, chats and channels all look fine.
              </EmptyState>
            ) : (
              <AttentionList items={data.attention} names={names} />
            )}
          </section>
        </Fade>

        <div className="space-y-6">
          <Fade delay={0.12}>
            <section className="card p-4" aria-labelledby="pipe-h">
              <h2 id="pipe-h" className="mb-3 font-semibold">
                Pipeline
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {PIPELINE.map((s) => (
                  <Link
                    key={s}
                    to={`/clients?status=${s}`}
                    className="flex flex-col items-center gap-1.5 rounded-md border border-line py-3 hover:bg-surface-2"
                  >
                    <AnimatedNumber
                      value={data.pipeline[s] ?? 0}
                      className="font-display text-2xl font-semibold"
                    />
                    <StatusPill status={s} />
                  </Link>
                ))}
              </div>
            </section>
          </Fade>
          <Fade delay={0.16}>
            <section className="card p-4" aria-labelledby="leads-h">
              <div className="mb-1 flex items-center justify-between">
                <h2 id="leads-h" className="font-semibold">
                  Recent leads
                </h2>
                <Link to="/leads" className="text-sm font-medium text-brand hover:underline">
                  All leads
                </Link>
              </div>
              <RecentLeads />
            </section>
          </Fade>
        </div>
      </div>
    </div>
  );
}
