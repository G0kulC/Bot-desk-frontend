import { CheckCircle2, Link2, Send, XCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { ChannelIn, ChannelTest, Client } from "@/api/types";
import { useChannel, useSaveChannel, useTestChannel } from "@/api/useChannel";
import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { Field, Input } from "@/components/Field";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { Pill } from "@/components/Pill";
import { ErrorState, Skeleton } from "@/components/States";
import { formatDateTime } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/motion";
import { formatPhone, normalizePhone } from "@/lib/phone";

import { ProviderFlow } from "./ProviderFlow";

const META_STEPS = [
  "In Meta Business, create the WhatsApp app (once) and add the client's phone number.",
  "Copy the Phone number ID and WhatsApp Business Account ID into the fields here.",
  "Create a system-user token (never expires, whatsapp_business_messaging + management) and paste it here.",
  "In the app's WhatsApp → Configuration, paste the webhook URL below and the verify token from the server's META_WEBHOOK_VERIFY_TOKEN.",
  "Subscribe to the `messages` webhook field and create the `new_lead_alert` utility template.",
  "Ask the owner to send “hi” to the business number, then send a test message.",
];
const AISENSY_STEPS = [
  "Confirm the client's AiSensy plan includes the Project API.",
  "Copy the Project ID and Project API password from AiSensy into the fields here.",
  "In AiSensy, add the webhook URL below as the Project Webhook (incoming messages + status updates).",
  "If AiSensy gives a webhook secret, paste it here so signatures are checked.",
  "Ask the owner to send “hi” to the business number, then send a test message.",
];

type SecretKey = "meta_access_token" | "aisensy_api_key" | "aisensy_webhook_secret";

function SecretField({
  label,
  saved,
  value,
  onChange,
}: {
  label: string;
  saved: { has_token: boolean; last4?: string | null };
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field
      label={label}
      hint={
        saved.has_token
          ? `Saved ••••${saved.last4 ?? ""}. Leave empty to keep it.`
          : "Not saved yet. Write-only: it is never shown again."
      }
    >
      {(p) => (
        <Input
          {...p}
          type="password"
          autoComplete="new-password"
          placeholder={saved.has_token ? `saved ••••${saved.last4 ?? ""}` : "Paste here"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function ChannelTab({ client }: { client: Client }) {
  const channel = useChannel(client.id);
  const save = useSaveChannel(client.id);
  const test = useTestChannel(client.id);
  const reduced = usePrefersReducedMotion();
  const provider = client.effective_provider;
  const ch = channel.data;

  const [plain, setPlain] = useState({
    display_phone: "",
    meta_phone_number_id: "",
    meta_waba_id: "",
    aisensy_project_id: "",
  });
  const [secrets, setSecrets] = useState<Record<SecretKey, string>>({
    meta_access_token: "",
    aisensy_api_key: "",
    aisensy_webhook_secret: "",
  });
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<ChannelTest | null>(null);

  // Load server values unless the user is mid-edit.
  useEffect(() => {
    if (!dirty && channel.isSuccess)
      setPlain({
        display_phone: ch?.display_phone ?? "",
        meta_phone_number_id: ch?.meta_phone_number_id ?? "",
        meta_waba_id: ch?.meta_waba_id ?? "",
        aisensy_project_id: ch?.aisensy_project_id ?? "",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch, channel.isSuccess]);

  if (channel.isLoading) return <Skeleton className="h-96" />;
  if (channel.error) return <ErrorState error={channel.error} onRetry={() => channel.refetch()} />;

  const phoneError =
    plain.display_phone && !normalizePhone(plain.display_phone) ? "Enter a valid phone number" : undefined;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (phoneError) return;
    const body: ChannelIn = {
      display_phone: plain.display_phone ? normalizePhone(plain.display_phone) : null,
      meta_phone_number_id: plain.meta_phone_number_id.trim() || null,
      meta_waba_id: plain.meta_waba_id.trim() || null,
      aisensy_project_id: plain.aisensy_project_id.trim() || null,
    };
    // Secrets are sent only when the field was changed.
    (Object.keys(secrets) as SecretKey[]).forEach((k) => {
      if (secrets[k].trim()) body[k] = secrets[k].trim();
    });
    save.mutate(body, {
      onSuccess: () => {
        toast.success("Channel saved");
        setSecrets({ meta_access_token: "", aisensy_api_key: "", aisensy_webhook_secret: "" });
        setDirty(false);
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  function runTest() {
    setResult(null);
    test.mutate(undefined, {
      onSuccess: (r) => {
        setResult(r);
        if (r.ok) toast.success("Test message sent to the owner");
        else toast.error(r.error ?? "Test failed");
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  const setP = (k: keyof typeof plain) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlain((p) => ({ ...p, [k]: e.target.value }));
    setDirty(true);
  };
  const setS = (k: SecretKey) => (v: string) => {
    setSecrets((s) => ({ ...s, [k]: v }));
    setDirty(true);
  };
  const noSecret = { has_token: false, last4: null };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
      <div className="space-y-4">
        <section className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Provider</h2>
            <span className="flex items-center gap-2">
              <span className="font-medium">{provider === "own" ? "Own (Meta Cloud API)" : "AiSensy"}</span>
              <Pill tone={client.provider_override ? "amber" : "grey"} dot={false}>
                {client.provider_override ? "override" : "default"}
              </Pill>
            </span>
          </div>
          <ProviderFlow provider={provider} />
          <p className="text-xs text-ink-2">Change the provider from the client's Edit form.</p>
        </section>

        <form onSubmit={onSubmit} className="card space-y-4 p-4" aria-label="Channel settings">
          <h2 className="font-semibold">{provider === "own" ? "Meta Cloud API" : "AiSensy"} details</h2>
          <Field label="Business WhatsApp number" optional error={phoneError}>
            {(p) => (
              <Input
                {...p}
                type="tel"
                placeholder="+91 98400 00001"
                value={plain.display_phone}
                onChange={setP("display_phone")}
              />
            )}
          </Field>
          {provider === "own" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone number ID">
                  {(p) => (
                    <Input
                      {...p}
                      className="font-mono"
                      value={plain.meta_phone_number_id}
                      onChange={setP("meta_phone_number_id")}
                    />
                  )}
                </Field>
                <Field label="WABA ID">
                  {(p) => (
                    <Input
                      {...p}
                      className="font-mono"
                      value={plain.meta_waba_id}
                      onChange={setP("meta_waba_id")}
                    />
                  )}
                </Field>
              </div>
              <SecretField
                label="Access token"
                saved={ch?.meta_access_token ?? noSecret}
                value={secrets.meta_access_token}
                onChange={setS("meta_access_token")}
              />
            </>
          ) : (
            <>
              <Field label="Project ID">
                {(p) => (
                  <Input
                    {...p}
                    className="font-mono"
                    value={plain.aisensy_project_id}
                    onChange={setP("aisensy_project_id")}
                  />
                )}
              </Field>
              <SecretField
                label="Project API password"
                saved={ch?.aisensy_api_key ?? noSecret}
                value={secrets.aisensy_api_key}
                onChange={setS("aisensy_api_key")}
              />
              <SecretField
                label="Webhook secret (optional)"
                saved={ch?.aisensy_webhook_secret ?? noSecret}
                value={secrets.aisensy_webhook_secret}
                onChange={setS("aisensy_webhook_secret")}
              />
            </>
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={save.isPending} disabled={!dirty}>
              {ch ? "Save channel" : "Create channel"}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <section className="card space-y-3 p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Link2 className="size-4" /> Webhook
          </h2>
          {ch ? (
            <>
              <code className="block break-all rounded-md bg-surface-2 px-3 py-2 text-xs">
                {ch.webhook_url}
              </code>
              <CopyButton text={ch.webhook_url} label="Copy webhook URL" toastMessage="Webhook URL copied" />
              {provider === "own" ? (
                <p className="text-sm text-ink-2">
                  Verify token: use the server's <code>META_WEBHOOK_VERIFY_TOKEN</code>{" "}
                  {ch.meta_verify_token_set ? (
                    "(set on the server)."
                  ) : (
                    <strong className="text-bad">(not set on the server!)</strong>
                  )}{" "}
                  Subscribe to the <code>messages</code> field.
                </p>
              ) : (
                <p className="text-sm text-ink-2">
                  Paste this as the AiSensy Project Webhook. The link itself identifies this client – keep it
                  private.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-2">Save the channel to get the webhook URL.</p>
          )}
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Health</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-2">Last customer message</dt>
              <dd>{formatDateTime(ch?.last_inbound_at, "Never")}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-2">Owner</dt>
              <dd>{client.owner_phone ? formatPhone(client.owner_phone) : "Not set"}</dd>
            </div>
          </dl>
          {ch?.last_error && (
            <p className="rounded-md bg-bad/10 px-3 py-2 text-xs text-bad">Last error: {ch.last_error}</p>
          )}
          {reduced ? (
            <Button
              variant="secondary"
              onClick={runTest}
              loading={test.isPending}
              disabled={!ch || !client.owner_phone}
            >
              <Send /> Send test message to owner
            </Button>
          ) : (
            <InteractiveHoverButton
              onClick={runTest}
              disabled={!ch || !client.owner_phone || test.isPending}
              className="w-full border-line text-sm disabled:opacity-50"
            >
              {test.isPending ? "Sending…" : "Send test message to owner"}
            </InteractiveHoverButton>
          )}
          {result && (
            <div
              role="status"
              className={`rounded-md border p-3 text-sm ${result.ok ? "border-ok/40 bg-ok/10" : "border-bad/40 bg-bad/10"}`}
            >
              <p className="flex items-center gap-1.5 font-medium">
                {result.ok ? (
                  <CheckCircle2 className="size-4 text-ok" />
                ) : (
                  <XCircle className="size-4 text-bad" />
                )}
                {result.ok
                  ? `Sent via ${result.provider} to ${result.to}`
                  : `Failed (${result.status_code ?? "no response"})`}
              </p>
              {result.error && <p className="mt-1 text-xs">{result.error}</p>}
              {result.provider_message_id && (
                <p className="mt-1 break-all font-mono text-xs text-ink-2">{result.provider_message_id}</p>
              )}
            </div>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">
            {provider === "own" ? "Meta setup checklist" : "AiSensy setup checklist"}
          </h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-2 marker:font-semibold marker:text-brand">
            {(provider === "own" ? META_STEPS : AISENSY_STEPS).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
