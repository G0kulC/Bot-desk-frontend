import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { authStore } from "@/api/auth-store";

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return () => {
    authStore.clear();
    qc.clear();
    navigate("/login", { replace: true });
  };
}
