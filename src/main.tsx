import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { makeQueryClient } from "./api/queryClient";
import { ThemedToaster } from "./components/ThemedToaster";
import { applyTheme, watchSystemTheme } from "./lib/theme";
import { router } from "./routes";

applyTheme();
watchSystemTheme();
const queryClient = makeQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Magic UI motion respects the OS "reduce motion" setting. */}
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
        <ThemedToaster />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
