import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useFocusTrap } from "@/lib/useFocusTrap";
import { cn } from "@/lib/utils";

import { Button } from "./Button";

/**
 * Right-side drawer on desktop, bottom sheet on mobile. Modal: focus is trapped, Escape and the
 * backdrop close it (unless `dismissable` is false), and focus returns to the opener.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
  dismissable?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const close = useCallback(() => {
    if (dismissable) onClose();
  }, [dismissable, onClose]);
  useFocusTrap(ref, open, close);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in-0" onClick={close} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl border border-line bg-surface shadow-2xl outline-none animate-in slide-in-from-bottom-8",
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:rounded-none sm:rounded-l-2xl sm:slide-in-from-bottom-0 sm:slide-in-from-right-8",
          { sm: "sm:w-[400px]", md: "sm:w-[520px]", lg: "sm:w-[680px]" }[width],
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-ink-2">
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && (
          <div className="pb-safe flex items-center justify-end gap-2 border-t border-line px-4 py-3 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
