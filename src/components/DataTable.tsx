import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { EmptyState, ErrorState, SkeletonRows } from "./States";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide this column in the stacked mobile card. */
  hideOnMobile?: boolean;
  /** Label shown next to the value in the mobile card (defaults to header). */
  mobileLabel?: ReactNode;
  align?: "left" | "right";
};

/**
 * Table ≥ 640px, stacked cards below. Handles loading (skeleton), error (retry) and empty states.
 * The first column is the card title on mobile.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  isLoading,
  error,
  onRetry,
  empty,
  onRowClick,
  caption,
  className,
}: {
  rows: T[] | undefined;
  columns: Column<T>[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty: { title: string; text?: ReactNode; action?: ReactNode; icon?: ReactNode };
  onRowClick?: (row: T) => void;
  caption?: string;
  className?: string;
}) {
  if (isLoading) return <SkeletonRows rows={5} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0)
    return (
      <EmptyState title={empty.title} action={empty.action} icon={empty.icon}>
        {empty.text}
      </EmptyState>
    );

  const [first, ...rest] = columns;
  return (
    <div className={className}>
      {/* Mobile: stacked cards */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn("card p-3", onRowClick && "cursor-pointer active:bg-surface-2")}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className="mb-1.5">{first.cell(row)}</div>
            <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
              {rest
                .filter((c) => !c.hideOnMobile)
                .map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-ink-2">{c.mobileLabel ?? c.header}</dt>
                    <dd className="min-w-0 text-right">{c.cell(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="card hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-2">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn("px-3 py-2.5 font-medium", c.align === "right" && "text-right", c.className)}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  "border-b border-line last:border-0",
                  onRowClick && "cursor-pointer hover:bg-surface-2/60",
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-2.5 align-middle",
                      c.align === "right" && "text-right",
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
