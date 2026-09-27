import { MessageCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { InboxItem } from "@/api/types";
import { useAllClients } from "@/api/useClients";
import { useInbox } from "@/api/useInbox";
import { Chip, Input, Select } from "@/components/Field";
import { Ripple } from "@/components/magicui/ripple";
import { Pill } from "@/components/Pill";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/States";
import { formatRelative } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/motion";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

import { ThreadView } from "./ThreadView";

function Row({
  item,
  active,
  onClick,
  showClient,
}: {
  item: InboxItem;
  active: boolean;
  onClick: () => void;
  showClient: boolean;
}) {
  const unread = item.unread_count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 border-b border-line px-3 py-2.5 text-left transition-colors last:border-0",
        active ? "bg-brand-soft" : "hover:bg-surface-2",
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 font-semibold text-ink-2">
        {(item.profile_name || item.wa_id).slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className={cn("min-w-0 flex-1 truncate", unread ? "font-semibold" : "font-medium")}>
            {item.profile_name || formatPhone(`+${item.wa_id}`)}
          </p>
          <span className={cn("shrink-0 text-xs", unread ? "font-semibold text-brand" : "text-ink-2")}>
            {formatRelative(item.last_message_at)}
          </span>
        </div>
        {showClient && <p className="truncate text-xs text-ink-2">{item.client_name}</p>}
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm text-ink-2">
            {item.last_message_sender === "bot" && "Bot: "}
            {item.last_message_sender === "agent" && "You: "}
            {item.last_message_preview ?? "…"}
          </p>
          {item.handoff_active && <Pill tone="red">Human</Pill>}
          {unread && (
            <span className="tnum grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-ink">
              <span className="sr-only">unread: </span>
              {item.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/** Contact list + thread. Two panes on desktop; list → thread on mobile. Used by /inbox and the client tab. */
export function InboxView({ clientId, embedded = false }: { clientId?: string; embedded?: boolean }) {
  const [params, setParams] = useSearchParams();
  const reduced = usePrefersReducedMotion();
  const clients = useAllClients();
  const selected = params.get("contact") ?? undefined;
  const clientFilter = clientId ?? params.get("client") ?? "";
  const needsHuman = params.get("handoff") === "1";
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const inbox = useInbox({
    client_id: clientFilter || undefined,
    handoff: needsHuman ? true : undefined,
    q: debounced || undefined,
    limit: 100,
  });

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key !== "contact" });
  }

  const items = inbox.data ?? [];
  const selectedItem = items.find((i) => i.contact_id === selected);

  const list = (
    <div className="flex min-h-0 flex-col">
      <div className="space-y-2 border-b border-line p-3">
        <label className="relative block">
          <span className="sr-only">Search chats</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or number"
            className="pl-9"
            type="search"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Chip active={!needsHuman} onClick={() => setParam("handoff", undefined)}>
            All
          </Chip>
          <Chip active={needsHuman} onClick={() => setParam("handoff", "1")}>
            Needs human
          </Chip>
          {!clientId && (
            <Select
              aria-label="Client"
              value={clientFilter}
              onChange={(e) => setParam("client", e.target.value || undefined)}
              className="h-8 min-w-0 flex-1 py-0 text-sm"
            >
              <option value="">All clients</option>
              {clients.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {inbox.isLoading ? (
          <SkeletonRows rows={6} className="p-3" />
        ) : inbox.error ? (
          <ErrorState error={inbox.error} onRetry={() => inbox.refetch()} className="m-3" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<MessageCircle />}
            title={needsHuman ? "No one is waiting" : "No conversations yet"}
            className="m-3 border-0"
          >
            {needsHuman
              ? "Chats handed to a person show up here."
              : "Chats appear when customers message a connected WhatsApp number."}
          </EmptyState>
        ) : (
          items.map((i) => (
            <Row
              key={i.contact_id}
              item={i}
              active={i.contact_id === selected}
              onClick={() => setParam("contact", i.contact_id)}
              showClient={!clientId}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "card grid overflow-hidden md:grid-cols-[340px,1fr]",
        embedded
          ? "h-[calc(100dvh-280px)] min-h-[480px]"
          : "h-[calc(100dvh-180px)] min-h-[480px] md:h-[calc(100dvh-150px)]",
      )}
    >
      <div className={cn("min-h-0 border-line md:flex md:border-r", selected ? "hidden md:flex" : "flex")}>
        {list}
      </div>
      <div className={cn("min-h-0", selected ? "block" : "hidden md:block")}>
        {selected ? (
          <ThreadView
            key={selected}
            contactId={selected}
            clientName={clientId ? undefined : selectedItem?.client_name}
            onBack={() => setParam("contact", undefined)}
          />
        ) : (
          <div className="relative grid h-full place-items-center overflow-hidden bg-surface-2/40">
            {!reduced && <Ripple mainCircleSize={160} numCircles={5} />}
            <p className="relative z-10 px-6 text-center text-sm text-ink-2">
              Pick a conversation to read and reply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
