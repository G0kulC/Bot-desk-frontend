import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "./client";
import { qk } from "./keys";
import type { ChannelIn, TestChatIn } from "./types";

/** Channel, or null when none is configured yet (404). */
export function useChannel(clientId: string) {
  return useQuery({
    queryKey: qk.channel(clientId),
    queryFn: async () => {
      try {
        return await api.get("/clients/{client_id}/channel", { path: { client_id: clientId } });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(clientId),
  });
}

export function useSaveChannel(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ChannelIn) =>
      api.put("/clients/{client_id}/channel", { path: { client_id: clientId }, body }),
    onSuccess: (ch) => qc.setQueryData(qk.channel(clientId), ch),
  });
}

export function useTestChannel(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/clients/{client_id}/channel/test", { path: { client_id: clientId } }),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.channel(clientId) }),
  });
}

export function useTestChat(clientId: string) {
  return useMutation({
    mutationFn: (body: TestChatIn) =>
      api.post("/clients/{client_id}/test-chat", { path: { client_id: clientId }, body }),
  });
}
