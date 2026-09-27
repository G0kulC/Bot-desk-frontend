import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MoneyText({
  value,
  decimals,
  className,
}: {
  value: number | string | null | undefined;
  decimals?: number;
  className?: string;
}) {
  return <span className={cn("tnum", className)}>{formatINR(value, decimals)}</span>;
}
