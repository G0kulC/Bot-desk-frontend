import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "./client";
import { qk } from "./keys";
import type { KnowledgeIn } from "./types";

/** Current knowledge, or null when the client has none yet (404). */
export function useKnowledge(clientId: string) {
  return useQuery({
    queryKey: qk.knowledge.current(clientId),
    queryFn: async () => {
      try {
        return await api.get("/clients/{client_id}/knowledge", { path: { client_id: clientId } });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(clientId),
  });
}

export function useKnowledgeVersions(clientId: string, enabled = true) {
  return useQuery({
    queryKey: qk.knowledge.versions(clientId),
    queryFn: () => api.get("/clients/{client_id}/knowledge/versions", { path: { client_id: clientId } }),
    enabled: Boolean(clientId) && enabled,
  });
}

export function useKnowledgeTemplate(niche: string | undefined) {
  return useQuery({
    queryKey: qk.knowledge.template(niche ?? ""),
    queryFn: () => api.get("/knowledge/templates/{niche}", { path: { niche: niche as never } }),
    enabled: Boolean(niche),
    staleTime: Infinity,
  });
}

function useInvalidateKnowledge(clientId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.knowledge.all(clientId) });
}

export function useSaveKnowledge(clientId: string) {
  const invalidate = useInvalidateKnowledge(clientId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: KnowledgeIn) =>
      api.put("/clients/{client_id}/knowledge", { path: { client_id: clientId }, body }),
    onSuccess: (kb) => {
      qc.setQueryData(qk.knowledge.current(clientId), kb);
      invalidate();
    },
  });
}

export function useApproveKnowledge(clientId: string) {
  const invalidate = useInvalidateKnowledge(clientId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (approved_by_name: string) =>
      api.post("/clients/{client_id}/knowledge/approve", {
        path: { client_id: clientId },
        body: { approved_by_name },
      }),
    onSuccess: (kb) => {
      qc.setQueryData(qk.knowledge.current(clientId), kb);
      invalidate();
    },
  });
}

export function useRestoreKnowledge(clientId: string) {
  const invalidate = useInvalidateKnowledge(clientId);
  return useMutation({
    mutationFn: (version: number) =>
      api.post("/clients/{client_id}/knowledge/restore/{version}", {
        path: { client_id: clientId, version },
      }),
    onSuccess: invalidate,
  });
}

export function fetchKnowledgeExport(clientId: string): Promise<string> {
  return api.get("/clients/{client_id}/knowledge/export", {
    path: { client_id: clientId },
  }) as Promise<string>;
}
