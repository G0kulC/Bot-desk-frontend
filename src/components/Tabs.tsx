import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TabItem<T extends string> = { value: T; label: ReactNode; count?: number };

/** Accessible tab list (arrow keys move between tabs). Content is rendered by the caller. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
  idBase = "tab",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  idBase?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKey(e: KeyboardEvent, i: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(items[next].value);
      refs.current[next]?.focus();
    }
  }
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0",
        className,
      )}
    >
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${idBase}-${item.value}`}
            aria-selected={selected}
            aria-controls={`${idBase}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "relative -mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              selected ? "border-brand text-brand" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="tnum ml-1.5 rounded-full bg-surface-2 px-1.5 text-xs text-ink-2">
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  idBase = "tab",
  value,
  children,
}: {
  idBase?: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-${value}`} className="pt-4">
      {children}
    </div>
  );
}
