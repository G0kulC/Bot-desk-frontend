import { Laptop, Moon, Sun } from "lucide-react";

import { useConfig, useMe } from "@/api/useAuth";
import { MoneyText } from "@/components/MoneyText";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, Skeleton } from "@/components/States";
import { titleCase } from "@/lib/format";
import { setThemePref, useThemePref, type ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEMES: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Laptop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function SettingsPage() {
  const config = useConfig();
  const me = useMe();
  const theme = useThemePref();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Read-only platform settings come from the server's environment."
      />

      <section className="card p-4" aria-labelledby="theme-h">
        <h2 id="theme-h" className="mb-3 font-semibold">
          Theme
        </h2>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2 sm:max-w-md">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={theme === t.value}
              onClick={() => setThemePref(t.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border px-3 py-3 text-sm font-medium",
                theme === t.value
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line text-ink-2 hover:text-ink",
              )}
            >
              <t.icon className="size-5" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4" aria-labelledby="platform-h">
        <h2 id="platform-h" className="mb-1 font-semibold">
          Platform
        </h2>
        {config.isLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : config.error ? (
          <ErrorState error={config.error} onRetry={() => config.refetch()} />
        ) : (
          config.data && (
            <dl>
              <Row label="Default WhatsApp provider">
                {config.data.default_provider === "own" ? "Own (Meta Cloud API)" : "AiSensy"}
              </Row>
              <Row label="AI model">
                <code className="text-sm">{config.data.ai_model}</code>
              </Row>
              <Row label="Fallback model">
                <code className="text-sm">{config.data.ai_fallback_model}</code>
              </Row>
              <Row label="Trial length">{config.data.trial_days} days</Row>
              <Row label="Signed in as">{me.data?.email ?? "…"}</Row>
            </dl>
          )
        )}
      </section>

      {config.data && (
        <section className="card p-4" aria-labelledby="pkg-h">
          <h2 id="pkg-h" className="mb-3 font-semibold">
            Packages
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(config.data.packages).map(([name, p]) => (
              <div key={name} className="rounded-md border border-line p-3">
                <h3 className="font-semibold">{titleCase(name)}</h3>
                <p className="mt-1 text-sm text-ink-2">
                  Setup <MoneyText value={p.setup} className="font-medium text-ink" /> · Monthly{" "}
                  <MoneyText value={p.monthly} className="font-medium text-ink" />
                </p>
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm text-ink-2">
                  {p.includes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-ink-2">
        Bot Desk admin v{__APP_VERSION__}
        {config.data && ` · API v${config.data.app_version}`}
      </p>
    </div>
  );
}
