import { BarChart3, Moon } from "lucide-react";
import { useState } from "react";

import type { Client } from "@/api/types";
import { useMonthlyReport } from "@/api/useDashboard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { CopyButton } from "@/components/CopyButton";
import { Fade } from "@/components/Fade";
import { Input } from "@/components/Field";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";
import { formatMonth, monthIST } from "@/lib/format";

import { ownerSummary } from "./summaryText";

function Metric({
  label,
  value,
  money,
  decimals,
  hint,
}: {
  label: string;
  value: number | string;
  money?: boolean;
  decimals?: number;
  hint?: string;
}) {
  return (
    <div className="card p-3">
      <p className="text-xs text-ink-2">{label}</p>
      <AnimatedNumber
        value={value}
        money={money}
        decimals={decimals}
        className="font-display text-2xl font-semibold"
      />
      {hint && <p className="text-xs text-ink-2">{hint}</p>}
    </div>
  );
}

export function ReportTab({ client }: { client: Client }) {
  const [month, setMonth] = useState(monthIST());
  const { data: r, isLoading, error, refetch } = useMonthlyReport(client.id, month);

  const languages = r ? Object.entries(r.languages).sort((a, b) => b[1] - a[1]) : [];
  const langTotal = languages.reduce((s, [, n]) => s + n, 0) || 1;
  const maxQ = r?.top_questions[0]?.count ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-2">Month</span>
          <Input
            type="month"
            value={month}
            max={monthIST()}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="w-44"
          />
        </label>
        {r && (
          <CopyButton
            text={ownerSummary(r, client.name)}
            label="Copy summary for owner"
            toastMessage="Summary copied – paste it in WhatsApp"
          />
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !r || (r.messages_in === 0 && r.messages_out === 0) ? (
        <EmptyState icon={<BarChart3 />} title={`No chats in ${formatMonth(month)}`}>
          Numbers appear once customers message this client's WhatsApp number.
        </EmptyState>
      ) : (
        <>
          <Fade>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Chats (unique customers)" value={r.chats} />
              <Metric label="Messages in / out" value={r.messages_in} hint={`${r.messages_out} sent`} />
              <Metric label="Bot replies" value={r.bot_replies} hint={`${r.agent_replies} by a person`} />
              <Metric label="Leads" value={r.leads} />
              <Metric label="Handoffs" value={r.handoffs} />
              <Metric
                label="Night enquiries"
                value={r.night_enquiries}
                hint={`${Math.round(r.night_share * 100)}% of messages (10 pm–8 am)`}
              />
              <Metric label="Avg bot reply (sec)" value={r.avg_bot_reply_seconds ?? 0} decimals={1} />
              <Metric label="AI cost" value={r.ai_cost_inr} money decimals={2} />
            </div>
          </Fade>

          <div className="grid gap-4 lg:grid-cols-2">
            <Fade delay={0.06}>
              <section className="card p-4" aria-labelledby="q-h">
                <h2 id="q-h" className="mb-3 font-semibold">
                  Top questions
                </h2>
                {r.top_questions.length === 0 ? (
                  <p className="text-sm text-ink-2">No text questions this month.</p>
                ) : (
                  <ol className="space-y-2">
                    {r.top_questions.map((q, i) => (
                      <li key={q.question} className="text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="min-w-0 truncate">
                            <span className="tnum mr-2 text-ink-2">{i + 1}.</span>
                            {q.question}
                          </span>
                          <span className="tnum shrink-0 text-ink-2">{q.count}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-brand/70"
                            style={{ width: `${(q.count / maxQ) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </Fade>
            <Fade delay={0.1}>
              <section className="card p-4" aria-labelledby="lang-h">
                <h2 id="lang-h" className="mb-3 font-semibold">
                  Languages
                </h2>
                {languages.length === 0 ? (
                  <p className="text-sm text-ink-2">No language data yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {languages.map(([lang, n]) => (
                      <li key={lang} className="text-sm">
                        <div className="flex justify-between">
                          <span>{lang}</span>
                          <span className="tnum text-ink-2">
                            {n} · {Math.round((n / langTotal) * 100)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-ok/70"
                            style={{ width: `${(n / langTotal) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-sm">
                  <Moon className="size-4 text-brand" />
                  {r.night_enquiries} enquiries came while the shop was closed.
                </p>
              </section>
            </Fade>
          </div>
        </>
      )}
    </div>
  );
}
