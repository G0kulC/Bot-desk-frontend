import { Receipt, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Payment } from "@/api/types";
import { useClientNames } from "@/api/useClients";
import { useDeletePayment, usePayments, type PaymentParams } from "@/api/usePayments";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { MoneyText } from "@/components/MoneyText";
import { Pill } from "@/components/Pill";
import { formatDate, formatMonth, titleCase } from "@/lib/format";

/** Two-step delete: first click arms, second click deletes (no window.confirm). */
function DeleteButton({ payment }: { payment: Payment }) {
  const [armed, setArmed] = useState(false);
  const del = useDeletePayment();
  if (!armed)
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete payment"
        onClick={(e) => {
          e.stopPropagation();
          setArmed(true);
        }}
      >
        <Trash2 />
      </Button>
    );
  return (
    <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="danger"
        size="sm"
        loading={del.isPending}
        onClick={() =>
          del.mutate(payment.id, {
            onSuccess: () => toast.success("Payment deleted"),
            onError: (e) => {
              toast.error(errorMessage(e));
              setArmed(false);
            },
          })
        }
      >
        Delete
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setArmed(false)}>
        Keep
      </Button>
    </span>
  );
}

export function PaymentsTable({
  params,
  showClient = true,
  emptyAction,
}: {
  params: PaymentParams;
  showClient?: boolean;
  emptyAction?: React.ReactNode;
}) {
  const query = usePayments(params);
  const names = useClientNames();
  const columns: Column<Payment>[] = [
    {
      key: "what",
      header: "Payment",
      cell: (p) => (
        <div>
          <p className="font-medium">
            {showClient
              ? (names.get(p.client_id)?.name ?? "Client")
              : p.type === "setup"
                ? "Setup fee"
                : titleCase(p.type)}
          </p>
          <p className="text-xs text-ink-2">
            {showClient && `${p.type === "setup" ? "Setup fee" : titleCase(p.type)} · `}
            {p.for_month ? formatMonth(p.for_month, "short") : formatDate(p.paid_on)}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (p) => <MoneyText value={p.amount} className="font-medium" />,
      align: "right",
    },
    { key: "paid", header: "Paid on", cell: (p) => formatDate(p.paid_on) },
    {
      key: "method",
      header: "Method",
      cell: (p) => <Pill dot={false}>{p.method === "UPI" ? "UPI" : titleCase(p.method)}</Pill>,
    },
    {
      key: "ref",
      header: "Reference",
      cell: (p) => <span className="text-sm text-ink-2">{p.reference || p.note || "—"}</span>,
      hideOnMobile: true,
    },
    {
      key: "del",
      header: <span className="sr-only">Actions</span>,
      mobileLabel: "",
      cell: (p) => <DeleteButton payment={p} />,
      align: "right",
    },
  ];
  return (
    <DataTable
      rows={query.data}
      columns={columns}
      rowKey={(p) => p.id}
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => query.refetch()}
      caption="Payments"
      empty={{
        title: "No payments",
        text: "Recorded payments show up here.",
        icon: <Receipt />,
        action: emptyAction,
      }}
    />
  );
}
