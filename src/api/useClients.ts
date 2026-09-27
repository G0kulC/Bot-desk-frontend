import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { api, type ApiQuery } from "./client";
import { qk } from "./keys";
import type { Client, ClientCreate, ClientUpdate } from "./types";

export type ClientListParams = ApiQuery<"/clients">;

export function useClients(params: ClientListParams = {}) {
  return useQuery({
    queryKey: qk.clients.list(params),
    queryFn: () => api.get("/clients", { query: params }),
    placeholderData: keepPreviousData,
  });
}

/** All clients (for selects and id → name lookups). */
export function useAllClients() {
  return useClients({ page_size: 200 });
}

export function useClientNames(): Map<string, Client> {
  const { data } = useAllClients();
  return useMemo(() => new Map((data?.items ?? []).map((c) => [c.id, c])), [data]);
}

export function useClient(id: string) {
  return useQuery({
    queryKey: qk.clients.detail(id),
    queryFn: () => api.get("/clients/{client_id}", { path: { client_id: id } }),
    enabled: Boolean(id),
  });
}

function useInvalidateClients() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.clients.all });
    qc.invalidateQueries({ queryKey: qk.dashboard });
    qc.invalidateQueries({ queryKey: qk.renewals });
  };
}

export function useCreateClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (body: ClientCreate) => api.post("/clients", { body }),
    onSuccess: invalidate,
  });
}

export function useUpdateClient(id: string) {
  const invalidate = useInvalidateClients();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ClientUpdate) => api.patch("/clients/{client_id}", { path: { client_id: id }, body }),
    onSuccess: (client) => {
      qc.setQueryData(qk.clients.detail(id), client);
      invalidate();
      qc.invalidateQueries({ queryKey: qk.channel(id) });
    },
  });
}

/** Optimistic toggle for bot on/off (rolls back on error). */
export function useToggleBot(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bot_enabled: boolean) =>
      api.patch("/clients/{client_id}", { path: { client_id: id }, body: { bot_enabled } }),
    onMutate: async (bot_enabled) => {
      await qc.cancelQueries({ queryKey: qk.clients.detail(id) });
      const prev = qc.getQueryData<Client>(qk.clients.detail(id));
      if (prev) qc.setQueryData(qk.clients.detail(id), { ...prev, bot_enabled });
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.clients.detail(id), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.clients.all }),
  });
}

export function useDeleteClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (id: string) => api.delete("/clients/{client_id}", { path: { client_id: id } }),
    onSuccess: invalidate,
  });
}
