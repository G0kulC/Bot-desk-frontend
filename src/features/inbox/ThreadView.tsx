import { ArrowLeft, Ban, Bot, Send, Target, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Contact, Message } from "@/api/types";
import { useContact, useMessages, useReply, useSetHandoff, useSetOptOut } from "@/api/useInbox";
import { useCreateLead, useLeads } from "@/api/useLeads";
import { Button } from "@/components/Button";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatThread } from "@/components/ChatThread";
import { PulsatingButton } from "@/components/magicui/pulsating-button";
import { Pill } from "@/components/Pill";
import { ErrorState, Skeleton } from "@/components/States";
import { formatDate, formatTime, toDate } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/motion";
import { formatPhone } from "@/lib/phone";

import { canReply } from "./replyWindow";

function dayKey(iso: string) {
  return formatDate(iso);
}

function MessageBubble({ m }: { m: Message }) {
  const time = formatTime(m.created_at);
  const meta = (m.meta ?? {}) as Record<string, unknown>;
  if (m.sender === "system") {
    const undelivered = m.status === "failed";
    return (
      <ChatBubble side="system" label={meta.kind === "owner_alert" ? "Owner alert" : "System"} time={time}>
        {m.body}
        {undelivered && <span className="ml-1 font-semibold text-bad">· not delivered</span>}
      </ChatBubble>
    );
  }
  if (m.sender === "customer") {
    return (
      <ChatBubble side="in" time={time}>
        {m.msg_type !== "text" && <span className="mr-1 italic text-ink-2">[{m.msg_type}]</span>}
        {m.body}
      </ChatBubble>
    );
  }
  const notes = Array.isArray(meta.guardrail_notes) ? (meta.guardrail_notes as string[]) : [];
  return (
    <ChatBubble
      side="out"
      label={m.sender === "bot" ? "Bot" : "You"}
      tone={m.sender === "agent" ? "agent" : "bot"}
      time={time}
      status={m.status}
      footer={
        notes.length || m.status === "failed" ? (
          <>
            {m.status === "failed" && <Pill tone="red">Failed: {m.error ?? "not sent"}</Pill>}
            {notes.map((n) => (
              <Pill key={n} tone="amber" dot={false}>
                {n}
              </Pill>
            ))}
          </>
        ) : undefined
      }
    >
      {m.body}
    </ChatBubble>
  );
}

function LeadControl({ contact }: { contact: Contact }) {
  const leads = useLeads({ contact_id: contact.id, limit: 1 });
  const create = useCreateLead();
  const lead = leads.data?.[0];
  if (lead)
    return (
      <Link
        to={`/leads?client=${contact.client_id}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand-soft px-3 text-sm font-medium text-brand"
      >
        <Target className="size-4" /> View lead
      </Link>
    );
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={create.isPending}
      onClick={() =>
        create.mutate(
          {
            client_id: contact.client_id,
            contact_id: contact.id,
            name: contact.profile_name ?? "",
            phone: `+${contact.wa_id}`,
            need: "",
            preferred_time: "",
            status: "new",
          },
          {
            onSuccess: () => toast.success("Lead created"),
            onError: (e) => toast.error(errorMessage(e)),
          },
        )
      }
    >
      <Target /> Create lead
    </Button>
  );
}

export function ThreadView({
  contactId,
  clientName,
  onBack,
}: {
  contactId: string;
  clientName?: string;
  onBack?: () => void;
}) {
  const contactQ = useContact(contactId);
  const messagesQ = useMessages(contactId);
  const reply = useReply(contactId);
  const handoff = useSetHandoff(contactId);
  const optOut = useSetOptOut(contactId);
  const [text, setText] = useState("");
  const reduced = usePrefersReducedMotion();
  const contact = contactQ.data;

  if (contactQ.isLoading || messagesQ.isLoading) return <Skeleton className="h-full min-h-[420px]" />;
  if (contactQ.error || messagesQ.error)
    return (
      <ErrorState
        error={contactQ.error ?? messagesQ.error}
        onRetry={() => {
          contactQ.refetch();
          messagesQ.refetch();
        }}
      />
    );
  if (!contact) return null;

  const open = canReply(contact);
  const messages = messagesQ.data ?? [];
  const lastCustomerAt = toDate(contact.last_inbound_at);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    reply.mutate(body, {
      onSuccess: () => setText(""),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  function toggleHandoff() {
    const next = !contact!.handoff_active;
    handoff.mutate(next, {
      onSuccess: () =>
        toast.success(next ? "You've taken over – the bot is quiet" : "Handed back to the bot"),
      onError: (e) => toast.error(errorMessage(e)),
    });
  }

  const takeOver = contact.handoff_active ? (
    <Button size="sm" variant="secondary" onClick={toggleHandoff} disabled={handoff.isPending}>
      <Bot /> Hand back to bot
    </Button>
  ) : reduced ? (
    <Button size="sm" onClick={toggleHandoff} disabled={handoff.isPending}>
      <UserRound /> Take over
    </Button>
  ) : (
    <PulsatingButton
      onClick={toggleHandoff}
      disabled={handoff.isPending}
      pulseColor="hsl(var(--brand) / 0.35)"
      className="h-8 bg-brand px-3 py-0 text-sm font-medium text-brand-ink"
    >
      <span className="inline-flex items-center gap-1.5">
        <UserRound className="size-4" /> Take over
      </span>
    </PulsatingButton>
  );

  const header = (
    <div className="border-b border-line bg-surface px-3 py-2">
      <div className="flex items-center gap-2">
        {onBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="Back to list"
            className="md:hidden"
          >
            <ArrowLeft />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {contact.profile_name || formatPhone(`+${contact.wa_id}`)}
            {contact.handoff_active && (
              <Pill tone="red" className="ml-2">
                Human
              </Pill>
            )}
            {contact.opted_out && (
              <Pill tone="grey" className="ml-2">
                Opted out
              </Pill>
            )}
          </p>
          <p className="truncate text-xs text-ink-2">
            {formatPhone(`+${contact.wa_id}`)}
            {clientName && ` · ${clientName}`}
            {contact.detected_language && ` · ${contact.detected_language}`}
          </p>
        </div>
        {takeOver}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <LeadControl contact={contact} />
        <Button
          size="sm"
          variant={contact.opted_out ? "secondary" : "danger-ghost"}
          onClick={() =>
            optOut.mutate(!contact.opted_out, {
              onSuccess: (c) => toast.success(c.opted_out ? "Marked as opted out" : "Opt-out removed"),
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
          loading={optOut.isPending}
        >
          <Ban /> {contact.opted_out ? "Undo opt-out" : "Mark opted out"}
        </Button>
        {contact.handoff_active && contact.handoff_reason && (
          <span className="text-xs text-ink-2">Why: {contact.handoff_reason}</span>
        )}
      </div>
    </div>
  );

  const footer = (
    <form onSubmit={onSubmit} className="border-t border-line bg-surface p-2">
      {!open && (
        <p id="reply-help" className="mb-2 rounded-md bg-warn/10 px-3 py-2 text-xs text-warn">
          {lastCustomerAt
            ? `The customer last wrote ${formatDate(lastCustomerAt)} at ${formatTime(lastCustomerAt)} – more than 24 hours ago.`
            : "The customer hasn't written yet."}{" "}
          WhatsApp only allows approved templates now, so free replies are disabled.
        </p>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor="reply-input" className="sr-only">
          Reply as agent
        </label>
        <textarea
          id="reply-input"
          rows={1}
          value={text}
          disabled={!open || reply.isPending}
          aria-describedby={!open ? "reply-help" : undefined}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={open ? "Reply as you (the bot pauses while you talk)" : "Reply window closed"}
          className="field-input max-h-32 min-h-10 flex-1 resize-none py-2"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send reply"
          disabled={!open || !text.trim()}
          loading={reply.isPending}
        >
          {!reply.isPending && <Send />}
        </Button>
      </div>
    </form>
  );

  // Day divider before the first message of each IST day.
  const rows = messages.map((m, i) => ({
    m,
    day: dayKey(m.created_at),
    divider: i === 0 || dayKey(messages[i - 1].created_at) !== dayKey(m.created_at),
  }));
  return (
    <ChatThread
      header={header}
      footer={footer}
      className="h-full"
      scrollKey={messages.at(-1)?.id}
      label="Messages"
    >
      {messages.length === 0 && <p className="py-10 text-center text-sm text-ink-2">No messages yet.</p>}
      {rows.map(({ m, day, divider }) => (
        <div key={m.id}>
          {divider && (
            <div className="my-2 flex justify-center">
              <span className="rounded-md bg-surface/90 px-2 py-0.5 text-[11px] text-ink-2 shadow-sm">
                {day}
              </span>
            </div>
          )}
          <MessageBubble m={m} />
        </div>
      ))}
    </ChatThread>
  );
}
