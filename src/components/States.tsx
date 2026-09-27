import { AlertTriangle, RotateCw } from "lucide-react";
import type { ReactNode } from "react";

import { DotPattern } from "@/components/magicui/dot-pattern";
import { errorMessage } from "@/api/client";
import { cn } from "@/lib/utils";

import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-skeleton rounded-md bg-surface-2", className)} aria-hidden />;
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

/** Empty list: say what's missing and offer the next action. */
export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-lg border border-dashed border-line px-6 py-10 text-center",
        className,
      )}
    >
      <DotPattern
        className="text-line [mask-image:radial-gradient(220px_circle_at_center,white,transparent)]"
        width={18}
        height={18}
      />
      <div className="relative flex flex-col items-center">
        {icon && <div className="mb-3 rounded-full bg-brand-soft p-3 text-brand [&_svg]:size-6">{icon}</div>}
        <h3 className="text-base font-semibold">{title}</h3>
        {children && <p className="mt-1 max-w-sm text-sm text-ink-2">{children}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "Couldn't load this",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-lg border border-bad/30 bg-bad/5 px-6 py-8 text-center",
        className,
      )}
    >
      <AlertTriangle className="mb-2 size-6 text-bad" aria-hidden />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw /> Try again
        </Button>
      )}
    </div>
  );
}
