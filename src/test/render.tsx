import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { authStore } from "@/api/auth-store";

/** Render a component inside a fresh QueryClient + memory router, signed in. */
export function renderWithProviders(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  authStore.setToken("test-token");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchInterval: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter([{ path: "*", element: ui }], { initialEntries: [route] });
  return {
    queryClient: client,
    ...render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}
