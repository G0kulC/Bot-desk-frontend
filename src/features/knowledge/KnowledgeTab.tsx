import { AlertTriangle, BadgeCheck, History, RotateCcw, Save, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useBlocker } from "react-router-dom";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Client } from "@/api/types";
import {
  fetchKnowledgeExport,
  useApproveKnowledge,
  useKnowledge,
  useKnowledgeTemplate,
  useKnowledgeVersions,
  useRestoreKnowledge,
  useSaveKnowledge,
} from "@/api/useKnowledge";
import { Button } from "@/components/Button";
import { useCelebrate } from "@/components/Celebrate";
import { CopyButton } from "@/components/CopyButton";
import { Dialog } from "@/components/Dialog";
import { Drawer } from "@/components/Drawer";
import { Field, Input, Textarea } from "@/components/Field";
import { ShineBorder } from "@/components/magicui/shine-border";
import { Pill } from "@/components/Pill";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "@/components/States";
import { formatDate, formatDateTime, nicheLabel } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/motion";

import {
  fillFromTemplate,
  KNOWLEDGE_FIELDS,
  knowledgeToValues,
  needsReapproval,
  type KnowledgeValues,
} from "./knowledgeForm";

function VersionsPanel({
  clientId,
  open,
  onClose,
}: {
  clientId: string;
  open: boolean;
  onClose: () => void;
}) {
  const versions = useKnowledgeVersions(clientId, open);
  const restore = useRestoreKnowledge(clientId);
  const [confirm, setConfirm] = useState<number | null>(null);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Version history"
      description="Every save is kept. Restoring creates a new version."
    >
      {versions.isLoading ? (
        <SkeletonRows rows={4} />
      ) : versions.error ? (
        <ErrorState error={versions.error} onRetry={() => versions.refetch()} />
      ) : !versions.data?.length ? (
        <EmptyState title="No versions yet">Save the knowledge to create version 1.</EmptyState>
      ) : (
        <ol className="space-y-2">
          {versions.data.map((v, i) => (
            <li key={v.id} className="card p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    Version {v.version} {i === 0 && <Pill tone="brand">current</Pill>}
                  </p>
                  <p className="text-xs text-ink-2">
                    {formatDateTime(v.created_at)}
                    {v.saved_by && ` · ${v.saved_by}`}
                  </p>
                  {v.note && <p className="mt-1 text-xs italic text-ink-2">{v.note}</p>}
                </div>
                {i > 0 &&
                  (confirm === v.version ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        loading={restore.isPending}
                        onClick={() =>
                          restore.mutate(v.version, {
                            onSuccess: (kb) => {
                              toast.success(`Restored version ${v.version} as version ${kb.version}`);
                              setConfirm(null);
                              onClose();
                            },
                            onError: (e) => toast.error(errorMessage(e)),
                          })
                        }
                      >
                        Restore
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setConfirm(v.version)}>
                      <RotateCcw /> Restore
                    </Button>
                  ))}
              </div>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-ink-2">Show services</summary>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs">{v.content.services || "—"}</pre>
              </details>
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}

export function KnowledgeTab({ client }: { client: Client }) {
  const kbQuery = useKnowledge(client.id);
  const kb = kbQuery.data;
  const template = useKnowledgeTemplate(client.niche);
  const save = useSaveKnowledge(client.id);
  const approve = useApproveKnowledge(client.id);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approver, setApprover] = useState(client.owner_name ?? "");
  const [celebration, celebrate] = useCelebrate();
  const reduced = usePrefersReducedMotion();

  const form = useForm<KnowledgeValues>({ defaultValues: knowledgeToValues(kb) });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { isDirty },
  } = form;
  const values = useWatch({ control }) as KnowledgeValues;

  // Load server data into the form, but never overwrite unsaved edits on background refetch.
  useEffect(() => {
    if (kbQuery.isSuccess && !isDirty) reset(knowledgeToValues(kb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kb, kbQuery.isSuccess]);

  // Warn before leaving with unsaved changes (in-app navigation and tab close).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  );
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  if (kbQuery.isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-16" />
        <SkeletonRows rows={6} />
      </div>
    );
  if (kbQuery.error) return <ErrorState error={kbQuery.error} onRetry={() => kbQuery.refetch()} />;

  const reapprove = needsReapproval(kb, values);

  const onSave = handleSubmit((v) =>
    save.mutate(v, {
      onSuccess: (saved) => {
        reset(knowledgeToValues(saved));
        toast.success(
          saved.approved
            ? `Knowledge saved (version ${saved.version})`
            : `Saved as draft (version ${saved.version})`,
        );
      },
      onError: (e) => toast.error(errorMessage(e)),
    }),
  );

  function fillSample() {
    if (!template.data) return;
    const patch = fillFromTemplate(getValues(), template.data.knowledge);
    const keys = Object.keys(patch) as (keyof KnowledgeValues)[];
    keys.forEach((k) => setValue(k, patch[k] as string, { shouldDirty: true }));
    toast(
      keys.length
        ? `Filled ${keys.length} empty field${keys.length === 1 ? "" : "s"} from the sample`
        : "No empty fields to fill",
      {
        description: keys.length ? template.data.label : undefined,
      },
    );
  }

  function doApprove() {
    approve.mutate(approver.trim(), {
      onSuccess: () => {
        setApproveOpen(false);
        toast.success("Knowledge approved");
        celebrate();
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  }

  const statusCard = (
    <div className="card relative flex flex-wrap items-center justify-between gap-3 overflow-hidden p-4">
      {kb?.approved && !reduced && (
        <ShineBorder shineColor={["hsl(var(--brand))", "hsl(var(--ok))"]} borderWidth={1.5} duration={10} />
      )}
      <div className="flex items-center gap-3">
        {kb?.approved ? (
          <BadgeCheck className="size-6 text-ok" aria-hidden />
        ) : (
          <AlertTriangle className="size-6 text-warn" aria-hidden />
        )}
        <div>
          <p className="font-medium">
            {kb ? `Version ${kb.version}` : "Not saved yet"}
            {kb &&
              (kb.approved ? (
                <Pill tone="green" className="ml-2">
                  Approved
                </Pill>
              ) : (
                <Pill tone="amber" className="ml-2">
                  Draft
                </Pill>
              ))}
          </p>
          <p className="text-sm text-ink-2">
            {kb?.approved
              ? `Approved by ${kb.approved_by_name} on ${formatDate(kb.approved_at)}`
              : client.status === "live"
                ? "Live clients get a holding reply until the owner approves."
                : "Trial and lead clients still get replies (demo mode)."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => setVersionsOpen(true)} disabled={!kb}>
          <History /> Versions
        </Button>
        {kb && (
          <CopyButton
            label="Copy for platform"
            toastMessage="Prompt copied"
            getText={() => fetchKnowledgeExport(client.id)}
          />
        )}
        {kb && !kb.approved && (
          <Button
            size="sm"
            onClick={() => setApproveOpen(true)}
            disabled={isDirty}
            title={isDirty ? "Save first" : undefined}
          >
            <BadgeCheck /> Approve
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {celebration}
      {statusCard}

      {reapprove && (
        <div role="alert" className="flex gap-2 rounded-md border border-warn/40 bg-warn/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <p>
            You changed services, questions or rules. After saving, the owner must{" "}
            <strong>approve again</strong>
            {client.status === "live" && " – until then live customers get a holding reply"}.
          </p>
        </div>
      )}

      <form onSubmit={onSave} className="card space-y-4 p-4" aria-label="Bot knowledge">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">What the assistant may say</h2>
          <Button type="button" variant="soft" size="sm" onClick={fillSample} disabled={!template.data}>
            <Wand2 /> Fill empty fields from the {nicheLabel(client.niche).toLowerCase()} sample
          </Button>
        </div>
        {KNOWLEDGE_FIELDS.map((f) => (
          <Field key={f.name} label={f.label} hint={"hint" in f ? f.hint : undefined}>
            {(p) =>
              f.rows === 1 ? (
                <Input {...p} placeholder={f.placeholder} {...register(f.name)} />
              ) : (
                <Textarea {...p} rows={f.rows} placeholder={f.placeholder} {...register(f.name)} />
              )
            }
          </Field>
        ))}
        <div className="sticky bottom-16 z-10 -mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-lg border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:bottom-0">
          {isDirty && <span className="mr-auto text-sm text-warn">Unsaved changes</span>}
          <Button
            type="button"
            variant="ghost"
            disabled={!isDirty}
            onClick={() => reset(knowledgeToValues(kb))}
          >
            Discard
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!isDirty}>
            <Save /> Save new version
          </Button>
        </div>
      </form>

      <VersionsPanel clientId={client.id} open={versionsOpen} onClose={() => setVersionsOpen(false)} />

      <Dialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve this knowledge"
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doApprove} loading={approve.isPending} disabled={!approver.trim()}>
              <Sparkles /> Approve
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm">Only approve after the owner has checked prices, timings and rules.</p>
        <Field label="Approved by (owner's name)">
          {(p) => (
            <Input
              {...p}
              data-autofocus
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && approver.trim()) doApprove();
              }}
            />
          )}
        </Field>
      </Dialog>

      <Dialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Leave without saving?"
        footer={
          <>
            <Button variant="ghost" onClick={() => blocker.reset?.()}>
              Stay
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>
              Leave
            </Button>
          </>
        }
      >
        Your knowledge edits haven't been saved.
      </Dialog>
    </div>
  );
}
