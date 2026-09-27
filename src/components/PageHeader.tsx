import type { ReactNode } from "react";

import { TextAnimate } from "@/components/magicui/text-animate";
import { usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {reduced ? (
          <h1 className="text-2xl font-semibold sm:text-[28px]">{title}</h1>
        ) : (
          <TextAnimate
            as="h1"
            animation="blurInUp"
            by="character"
            once
            className="text-2xl font-semibold sm:text-[28px]"
          >
            {title}
          </TextAnimate>
        )}
        {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
