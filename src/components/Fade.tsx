import type { ReactNode } from "react";

import { BlurFade } from "@/components/magicui/blur-fade";
import { usePrefersReducedMotion } from "@/lib/motion";

/** Magic UI BlurFade entrance; renders plainly when the user prefers reduced motion. */
export function Fade({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <BlurFade delay={delay} inView className={className}>
      {children}
    </BlurFade>
  );
}
