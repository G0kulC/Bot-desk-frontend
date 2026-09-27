import { redirect, type LoaderFunctionArgs } from "react-router-dom";

import { authStore } from "@/api/auth-store";

/** Route loader: send signed-out users to /login, remembering where they wanted to go. */
export function requireAuth({ request }: LoaderFunctionArgs) {
  if (!authStore.getToken()) {
    const url = new URL(request.url);
    throw redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return null;
}
