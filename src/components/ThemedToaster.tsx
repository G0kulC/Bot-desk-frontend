import { Toaster } from "sonner";

import { resolvedTheme, useThemePref } from "@/lib/theme";

export function ThemedToaster() {
  const pref = useThemePref();
  return <Toaster richColors closeButton position="top-center" theme={resolvedTheme(pref)} />;
}
