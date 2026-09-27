import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { copyText } from "@/lib/clipboard";

import { Button, type ButtonProps } from "./Button";
import { Dialog } from "./Dialog";

/**
 * Copies text; if the browser blocks the clipboard, opens a dialog with the text pre-selected so
 * the user can copy it by hand.
 */
export function CopyButton({
  text,
  label = "Copy",
  toastMessage = "Copied",
  getText,
  ...props
}: {
  text?: string;
  label?: string;
  toastMessage?: string;
  getText?: () => Promise<string> | string;
} & Omit<ButtonProps, "onClick">) {
  const [done, setDone] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const value = getText ? await getText() : (text ?? "");
      if (await copyText(value)) {
        setDone(true);
        toast.success(toastMessage);
        setTimeout(() => setDone(false), 1500);
      } else {
        setFallback(value);
      }
    } catch (err) {
      toast.error((err as Error).message || "Couldn't copy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={onClick} loading={busy} {...props}>
        {done ? <Check /> : <Copy />}
        {label}
      </Button>
      <Dialog
        open={fallback !== null}
        onClose={() => setFallback(null)}
        title="Copy this text"
        footer={<Button onClick={() => setFallback(null)}>Done</Button>}
      >
        <p className="mb-2 text-sm">
          Your browser blocked the clipboard. The text is selected – press Ctrl/⌘+C.
        </p>
        <textarea
          readOnly
          data-autofocus
          aria-label="Text to copy"
          className="field-input h-48 font-mono text-xs"
          value={fallback ?? ""}
          onFocus={(e) => e.currentTarget.select()}
        />
      </Dialog>
    </>
  );
}
