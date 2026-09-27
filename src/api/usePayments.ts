import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type ApiQuery } from "./client";
import { qk } from "./keys";
import type { PaymentCreate } from "./types";

export type PaymentParams = ApiQuery<"/payments">;

export function usePayments(params: PaymentParams = {}) {
  return useQuery({
    queryKey: qk.payments.list(params),
    queryFn: () => api.get("/payments", { query: params }),
  });
}

export function useRenewals() {
  return useQuery({ queryKey: qk.renewals, queryFn: () => api.get("/billing/renewals") });
}

function invalidateMoney(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.payments.all });
  qc.invalidateQueries({ queryKey: qk.renewals });
  qc.invalidateQueries({ queryKey: qk.dashboard });
  qc.invalidateQueries({ queryKey: qk.clients.all });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PaymentCreate) => api.post("/payments", { body }),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete("/payments/{payment_id}", { path: { payment_id: id } }),
    onSuccess: () => invalidateMoney(qc),
  });
}
