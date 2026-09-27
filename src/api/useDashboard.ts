import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./client";
import { qk } from "./keys";

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: () => api.get("/dashboard/summary"),
    refetchInterval: 60_000,
  });
}

export function useMonthlyReport(clientId: string, month: string) {
  return useQuery({
    queryKey: qk.report(clientId, month),
    queryFn: () => api.get("/reports/monthly", { query: { client_id: clientId, month } }),
    enabled: Boolean(clientId && month),
  });
}

export function useResolveAttention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post("/dashboard/attention/{item_id}/resolve", { path: { item_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.dashboard }),
  });
}
