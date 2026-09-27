import { MessageCircle, Phone } from "lucide-react";
import { useState } from "react";

import { formatPhone, telLink, waLink } from "@/lib/phone";

import { Button, type ButtonProps } from "./Button";
import { buttonVariants } from "./button-variants";
import { CopyButton } from "./CopyButton";
import { Dialog } from "./Dialog";

/** "Call" opens a small dialog with the number, a copy button, a tel: link and a WhatsApp link. */
export function CallButton({
  phone,
  name,
  size = "sm",
  variant = "secondary",
}: {
  phone: string | null | undefined;
  name?: string;
} & Pick<ButtonProps, "size" | "variant">) {
  const [open, setOpen] = useState(false);
  if (!phone) return null;
  const display = formatPhone(phone);
  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Call ${name ?? display}`}
      >
        <Phone /> Call
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={name ? `Contact ${name}` : "Contact"}
        footer={
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="tnum font-display text-2xl font-semibold text-ink">{display}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton text={display} label="Copy number" toastMessage="Number copied" />
          <a href={telLink(phone)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Phone /> Call
          </a>
          <a
            href={waLink(phone)}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <MessageCircle /> WhatsApp
          </a>
        </div>
      </Dialog>
    </>
  );
}
