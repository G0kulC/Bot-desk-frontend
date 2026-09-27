import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scrollable WhatsApp-style thread. Sticks to the bottom when new messages arrive (if the user was
 * already near the bottom) and announces them to screen readers via aria-live.
 */
export function ChatThread({
  children,
  header,
  footer,
  className,
  scrollKey,
  label = "Conversation",
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Changes when a message is added; triggers auto-scroll. */
  scrollKey?: unknown;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (el && nearBottom.current) el.scrollTo({ top: el.scrollHeight });
  }, [scrollKey]);

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border border-line", className)}>
      {header}
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="chat-wallpaper min-h-0 flex-1 space-y-1 overflow-y-auto py-3"
        role="log"
        aria-live="polite"
        aria-label={label}
      >
        {children}
      </div>
      {footer}
    </div>
  );
}
