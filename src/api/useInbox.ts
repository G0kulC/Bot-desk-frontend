import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type ApiQuery } from "./client";
import { qk } from "./keys";
import type { Contact, InboxItem } from "./types";

export type InboxParams = ApiQuery<"/inbox">;
const POLL_MS = 10_000; // TanStack pauses interval refetches while the tab is hidden.

export function useInbox(params: InboxParams = {}) {
  return useQuery({
    queryKey: qk.inbox.list(params),
    queryFn: () => api.get("/inbox", { query: params }),
    refetchInterval: POLL_MS,
  });
}

export function useContact(contactId: string | undefined) {
  return useQuery({
    queryKey: qk.inbox.contact(contactId ?? ""),
    queryFn: () => api.get("/contacts/{contact_id}", { path: { contact_id: contactId as string } }),
    enabled: Boolean(contactId),
    refetchInterval: POLL_MS,
  });
}

export function useMessages(contactId: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.inbox.messages(contactId ?? ""),
    queryFn: async () => {
      const rows = await api.get("/contacts/{contact_id}/messages", {
        path: { contact_id: contactId as string },
        query: { limit: 100 },
      });
      // Opening a thread marks it read: refresh unread dots.
      qc.invalidateQueries({ queryKey: [...qk.inbox.all, "list"] });
      return rows;
    },
    enabled: Boolean(contactId),
    refetchInterval: POLL_MS,
  });
}

export function useReply(contactId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post("/contacts/{contact_id}/reply", { path: { contact_id: contactId }, body: { body } }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.inbox.messages(contactId) });
      qc.invalidateQueries({ queryKey: qk.inbox.contact(contactId) });
      qc.invalidateQueries({ queryKey: [...qk.inbox.all, "list"] });
    },
  });
}

/** Optimistic handoff toggle on the contact and on every inbox list row. */
export function useSetHandoff(contactId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) =>
      api.post("/contacts/{contact_id}/handoff", { path: { contact_id: contactId }, body: { active } }),
    onMutate: async (active) => {
      await qc.cancelQueries({ queryKey: qk.inbox.all });
      const prevContact = qc.getQueryData<Contact>(qk.inbox.contact(contactId));
      const prevLists = qc.getQueriesData<InboxItem[]>({ queryKey: [...qk.inbox.all, "list"] });
      if (prevContact)
        qc.setQueryData(qk.inbox.contact(contactId), { ...prevContact, handoff_active: active });
      prevLists.forEach(([key, list]) =>
        qc.setQueryData(
          key,
          list?.map((i) => (i.contact_id === contactId ? { ...i, handoff_active: active } : i)),
        ),
      );
      return { prevContact, prevLists };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevContact) qc.setQueryData(qk.inbox.contact(contactId), ctx.prevContact);
      ctx?.prevLists.forEach(([key, list]) => qc.setQueryData(key, list));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.inbox.all });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useSetOptOut(contactId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opted_out: boolean) =>
      api.post("/contacts/{contact_id}/opt-out", { path: { contact_id: contactId }, body: { opted_out } }),
    onSuccess: (c) => {
      qc.setQueryData(qk.inbox.contact(contactId), c);
      qc.invalidateQueries({ queryKey: qk.inbox.all });
    },
  });
}
