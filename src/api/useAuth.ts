import { useMutation, useQuery } from "@tanstack/react-query";

import { authStore } from "./auth-store";
import { api } from "./client";
import { qk } from "./keys";

export function useLogin() {
  return useMutation({
    mutationFn: (body: { email: string; password: string }) => api.post("/auth/login", { body }),
    onSuccess: (data) => authStore.setToken(data.access_token),
  });
}

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: () => api.get("/auth/me"), staleTime: 5 * 60_000 });
}

export function useConfig() {
  return useQuery({ queryKey: qk.config, queryFn: () => api.get("/config"), staleTime: 10 * 60_000 });
}
