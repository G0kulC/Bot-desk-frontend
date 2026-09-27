import { Check, CheckCheck, Clock, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BubbleSide = "in" | "out" | "system";

function Ticks({ status }: { status?: string }) {
  if (!status) return null;
  if (status === "failed") return <TriangleAlert className="size-3.5 text-bad" aria-label="failed" />;
  if (status === "read") return <CheckCheck className="size-3.5 text-sky-500" aria-label="read" />;
  if (status === "delivered") return <CheckCheck className="size-3.5" aria-label="delivered" />;
  if (status === "sent") return <Check className="size-3.5" aria-label="sent" />;
  if (status === "pending") return <Clock className="size-3.5" aria-label="sending" />;
  return null;
}

/** WhatsApp-style bubble. Customer on the left, bot/agent on the right, system alerts centred. */
export function ChatBubble({
  side,
  label,
  time,
  status,
  children,
  footer,
  tone,
}: {
  side: BubbleSide;
  label?: string;
  time?: string;
  status?: string;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "bot" | "agent";
}) {
  if (side === "system") {
    return (
      <div className="flex justify-center px-2 py-1">
        <div className="max-w-[88%] rounded-md bg-surface/90 px-3 py-1.5 text-center text-xs text-ink-2 shadow-sm">
          {label && <span className="font-semibold text-ink">{label} · </span>}
          {children}
          {time && <span className="ml-1.5 opacity-70">{time}</span>}
        </div>
      </div>
    );
  }
  const out = side === "out";
  return (
    <div className={cn("flex px-2 py-0.5", out ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] flex-col sm:max-w-[70%]", out ? "items-end" : "items-start")}>
        <div
          className={cn(
            "relative rounded-lg px-3 py-1.5 text-[15px] leading-snug text-ink shadow-sm",
            out ? "rounded-tr-sm bg-chat-out" : "rounded-tl-sm bg-chat-in",
          )}
        >
          {label && (
            <span
              className={cn(
                "mb-0.5 block text-[11px] font-semibold uppercase tracking-wide",
                tone === "agent" ? "text-sky-700 dark:text-sky-300" : "text-brand",
              )}
            >
              {label}
            </span>
          )}
          <span className="whitespace-pre-wrap break-words">{children}</span>
          <span className="float-right ml-2 mt-1.5 inline-flex translate-y-0.5 items-center gap-0.5 text-[11px] text-ink-2">
            {time}
            {out && <Ticks status={status} />}
          </span>
        </div>
        {footer && <div className="mt-1 flex flex-wrap gap-1">{footer}</div>}
      </div>
    </div>
  );
}

/** Three bouncing dots. */
export function TypingIndicator({ label = "Typing" }: { label?: string }) {
  return (
    <div className="flex justify-end px-2 py-0.5" role="status" aria-label={label}>
      <div className="flex items-center gap-1 rounded-lg rounded-tr-sm bg-chat-out px-3 py-2.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-typing-dot rounded-full bg-ink-2"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
