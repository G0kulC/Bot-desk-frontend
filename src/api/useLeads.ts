import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type ApiQuery } from "./client";
import { qk } from "./keys";
import type { Lead, LeadCreate, LeadUpdate } from "./types";

export type LeadParams = ApiQuery<"/leads">;

export function useLeads(params: LeadParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.leads.list(params),
    queryFn: () => api.get("/leads", { query: params }),
    enabled: options.enabled ?? true,
  });
}

function invalidateLeads(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.leads.all });
  qc.invalidateQueries({ queryKey: qk.dashboard });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LeadCreate) => api.post("/leads", { body }),
    onSuccess: () => invalidateLeads(qc),
  });
}

/** Update a lead. Status-only changes are applied optimistically and rolled back on error. */
export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: LeadUpdate & { id: string }) =>
      api.patch("/leads/{lead_id}", { path: { lead_id: id }, body }),
    onMutate: async ({ id, ...body }) => {
      await qc.cancelQueries({ queryKey: qk.leads.all });
      const prev = qc.getQueriesData<Lead[]>({ queryKey: qk.leads.all });
      prev.forEach(([key, rows]) =>
        qc.setQueryData(
          key,
          rows?.map((l) => (l.id === id ? ({ ...l, ...body } as Lead) : l)),
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev.forEach(([key, rows]) => qc.setQueryData(key, rows)),
    onSettled: () => invalidateLeads(qc),
  });
}
