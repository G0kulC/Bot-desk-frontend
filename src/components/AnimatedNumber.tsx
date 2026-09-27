import { NumberTicker } from "@/components/magicui/number-ticker";
import { formatCount, formatINR } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Magic UI NumberTicker with Indian grouping. Falls back to static text when the user prefers
 * reduced motion (and in tests), so the final value is always readable.
 */
export function AnimatedNumber({
  value,
  money = false,
  decimals = 0,
  className,
}: {
  value: number | string | null | undefined;
  money?: boolean;
  decimals?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const n = Number(value ?? 0) || 0;
  const text = money ? formatINR(n, decimals) : decimals ? n.toFixed(decimals) : formatCount(n);
  if (reduced) return <span className={cn("tnum", className)}>{text}</span>;
  return (
    <span className={cn("tnum", className)} aria-label={text}>
      {money && <span aria-hidden>₹</span>}
      <NumberTicker value={n} decimalPlaces={decimals} className="tracking-normal text-inherit" aria-hidden />
    </span>
  );
}
