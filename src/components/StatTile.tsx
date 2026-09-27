import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { MagicCard } from "@/components/magicui/magic-card";
import { cn } from "@/lib/utils";

import { AnimatedNumber } from "./AnimatedNumber";

/** Dashboard number tile: Magic UI MagicCard spotlight + NumberTicker. */
export function StatTile({
  label,
  value,
  money,
  decimals,
  icon,
  footer,
  tone = "default",
  to,
  children,
}: {
  label: string;
  value?: number | string | null;
  money?: boolean;
  decimals?: number;
  icon?: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "bad" | "ok";
  to?: string;
  children?: ReactNode;
}) {
  const body = (
    <MagicCard
      className="h-full rounded-lg"
      gradientColor="hsl(var(--brand) / 0.10)"
      gradientFrom="hsl(var(--brand))"
      gradientTo="hsl(var(--ok))"
      gradientSize={180}
    >
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2 text-sm text-ink-2">
          <span>{label}</span>
          {icon && <span className="text-ink-2/70 [&_svg]:size-4">{icon}</span>}
        </div>
        {children ?? (
          <AnimatedNumber
            value={value}
            money={money}
            decimals={decimals}
            className={cn(
              "font-display text-[26px] font-semibold leading-none",
              tone === "bad" && "text-bad",
              tone === "ok" && "text-ok",
            )}
          />
        )}
        {footer && <div className="mt-auto text-xs text-ink-2">{footer}</div>}
      </div>
    </MagicCard>
  );
  if (!to) return <div className="h-full">{body}</div>;
  return (
    <Link to={to} className="block h-full rounded-lg" aria-label={label}>
      {body}
    </Link>
  );
}
