import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useFocusTrap } from "@/lib/useFocusTrap";

/** Small centred modal (used for confirmations and short prompts). Keyboard-usable. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in-0" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-2xl outline-none animate-in fade-in-0 zoom-in-95"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {children && <div className="mt-2 text-ink-2">{children}</div>}
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
