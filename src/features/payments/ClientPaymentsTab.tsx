import { Plus } from "lucide-react";
import { useState } from "react";

import type { Client } from "@/api/types";
import { Button } from "@/components/Button";
import { MoneyText } from "@/components/MoneyText";
import { StatusPill } from "@/components/Pill";
import { formatDate } from "@/lib/format";

import { PaymentsTable } from "./PaymentsTable";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";

export function ClientPaymentsTab({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <p>
            Monthly <MoneyText value={client.monthly_fee} className="font-semibold" /> · Setup{" "}
            <MoneyText value={client.setup_fee} className="font-semibold" />{" "}
            {client.setup_paid ? "(paid)" : "(not recorded)"}
          </p>
          {client.status === "live" && (
            <p className="mt-1 flex items-center gap-2 text-ink-2">
              <StatusPill status={client.billing_status} />
              {client.next_due_date && `next due ${formatDate(client.next_due_date)}`}
            </p>
          )}
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus /> Record payment
        </Button>
      </div>
      <PaymentsTable params={{ client_id: client.id }} showClient={false} />
      <RecordPaymentDrawer
        open={open}
        onClose={() => setOpen(false)}
        initial={{ client_id: client.id }}
        lockClient
      />
    </div>
  );
}
