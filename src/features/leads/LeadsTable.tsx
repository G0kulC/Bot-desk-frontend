import { MessageCircle, NotebookPen, Plus, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Lead, LeadStatus } from "@/api/types";
import { useClientNames } from "@/api/useClients";
import { useCreateLead, useLeads, useUpdateLead } from "@/api/useLeads";
import { buttonVariants } from "@/components/button-variants";
import { Button } from "@/components/Button";
import { CallButton } from "@/components/CallButton";
import { useCelebrate } from "@/components/Celebrate";
import { DataTable, type Column } from "@/components/DataTable";
import { Dialog } from "@/components/Dialog";
import { Field, Input, Select, Textarea } from "@/components/Field";
import { Tabs } from "@/components/Tabs";
import { formatRelative, titleCase } from "@/lib/format";
import { normalizePhone, waLink } from "@/lib/phone";

const STATUSES: LeadStatus[] = ["new", "contacted", "won", "lost"];

function NotesDialog({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const update = useUpdateLead();
  const [notes, setNotes] = useState(lead?.notes ?? "");
  if (!lead) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Notes – ${lead.name || "lead"}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={update.isPending}
            onClick={() =>
              update.mutate(
                { id: lead.id, notes },
                {
                  onSuccess: () => {
                    toast.success("Notes saved");
                    onClose();
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                },
              )
            }
          >
            Save notes
          </Button>
        </>
      }
    >
      <Textarea
        aria-label="Notes"
        data-autofocus
        rows={5}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </Dialog>
  );
}

function NewLeadDialog({
  clientId,
  open,
  onClose,
}: {
  clientId?: string;
  open: boolean;
  onClose: () => void;
}) {
  const names = useClientNames();
  const create = useCreateLead();
  const [v, setV] = useState({
    client_id: clientId ?? "",
    name: "",
    phone: "",
    need: "",
    preferred_time: "",
  });
  const phoneOk = !v.phone || normalizePhone(v.phone);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add lead"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!v.client_id || !phoneOk}
            loading={create.isPending}
            onClick={() =>
              create.mutate(
                { ...v, phone: v.phone ? (normalizePhone(v.phone) ?? v.phone) : "", status: "new" },
                {
                  onSuccess: () => {
                    toast.success("Lead added");
                    onClose();
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                },
              )
            }
          >
            Add lead
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {!clientId && (
          <Field label="Client">
            {(p) => (
              <Select {...p} value={v.client_id} onChange={(e) => setV({ ...v, client_id: e.target.value })}>
                <option value="">Choose…</option>
                {[...names.values()].map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Name">
          {(p) => (
            <Input
              {...p}
              data-autofocus
              value={v.name}
              onChange={(e) => setV({ ...v, name: e.target.value })}
            />
          )}
        </Field>
        <Field label="Phone" error={phoneOk ? undefined : "Enter a valid number"}>
          {(p) => (
            <Input
              {...p}
              type="tel"
              value={v.phone}
              onChange={(e) => setV({ ...v, phone: e.target.value })}
            />
          )}
        </Field>
        <Field label="Need">
          {(p) => <Input {...p} value={v.need} onChange={(e) => setV({ ...v, need: e.target.value })} />}
        </Field>
        <Field label="Preferred time" optional>
          {(p) => (
            <Input
              {...p}
              value={v.preferred_time}
              onChange={(e) => setV({ ...v, preferred_time: e.target.value })}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}

/** Leads with status tabs, status changes (optimistic), notes and call/WhatsApp buttons. */
export function LeadsTable({ clientId, filterClientId }: { clientId?: string; filterClientId?: string }) {
  const [status, setStatus] = useState<LeadStatus>("new");
  const [notesFor, setNotesFor] = useState<Lead | null>(null);
  const [adding, setAdding] = useState(false);
  const cid = clientId ?? filterClientId;
  const query = useLeads({ client_id: cid || undefined, status, limit: 200 });
  const update = useUpdateLead();
  const names = useClientNames();
  const [celebration, celebrate] = useCelebrate();

  function changeStatus(lead: Lead, next: LeadStatus) {
    update.mutate(
      { id: lead.id, status: next },
      {
        onSuccess: () => {
          toast.success(`Lead marked ${next}`);
          if (next === "won") celebrate();
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  }

  const columns: Column<Lead>[] = [
    {
      key: "who",
      header: "Lead",
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{l.name || "Unnamed"}</p>
          <p className="truncate text-xs text-ink-2">
            {!clientId && `${names.get(l.client_id)?.name ?? "Client"} · `}
            {formatRelative(l.created_at)}
          </p>
        </div>
      ),
    },
    { key: "need", header: "Need", cell: (l) => <span className="text-sm">{l.need || "—"}</span> },
    {
      key: "when",
      header: "When",
      cell: (l) => <span className="text-sm">{l.preferred_time || "—"}</span>,
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (l) => (
        <Select
          aria-label={`Status for ${l.name || "lead"}`}
          value={l.status}
          onChange={(e) => changeStatus(l, e.target.value as LeadStatus)}
          onClick={(e) => e.stopPropagation()}
          className="h-8 w-32 py-0 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      mobileLabel: "",
      align: "right",
      cell: (l) => (
        <span className="inline-flex flex-wrap justify-end gap-1">
          <CallButton phone={l.phone} name={l.name} />
          {l.phone && (
            <a
              href={waLink(l.phone)}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
            >
              <MessageCircle />
            </a>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Notes"
            title={l.notes ?? "Add notes"}
            onClick={() => setNotesFor(l)}
          >
            <NotebookPen />
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {celebration}
      <div className="flex items-end justify-between gap-2">
        <Tabs
          items={STATUSES.map((s) => ({ value: s, label: titleCase(s) }))}
          value={status}
          onChange={setStatus}
          label="Lead status"
          idBase={`leads-${cid ?? "all"}`}
          className="flex-1"
        />
        <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
          <Plus /> Add lead
        </Button>
      </div>
      <DataTable
        rows={query.data}
        columns={columns}
        rowKey={(l) => l.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        caption="Leads"
        empty={{
          title: `No ${status} leads`,
          text:
            status === "new"
              ? "The assistants add leads when customers share a name or booking need."
              : undefined,
          icon: <Target />,
        }}
      />
      {notesFor && <NotesDialog key={notesFor.id} lead={notesFor} onClose={() => setNotesFor(null)} />}
      {adding && <NewLeadDialog clientId={cid} open onClose={() => setAdding(false)} />}
    </div>
  );
}
