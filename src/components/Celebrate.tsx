import { useCallback, useRef } from "react";

import { Confetti, type ConfettiRef } from "@/components/magicui/confetti";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * Magic UI Confetti for small wins (knowledge approved, lead won).
 * Returns [element to render, fire()]. Does nothing when reduced motion is on.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCelebrate(): [React.ReactNode, () => void] {
  const ref = useRef<ConfettiRef>(null);
  const reduced = usePrefersReducedMotion();
  const fire = useCallback(() => {
    ref.current?.fire({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.3 },
      colors: ["#136F5B", "#3FB894", "#DCEFE7", "#E8B85A"],
    });
  }, []);
  const element = reduced ? null : (
    <Confetti
      ref={ref}
      manualstart
      className="pointer-events-none fixed inset-0 z-[70] size-full"
      aria-hidden
    />
  );
  return [element, fire];
}
