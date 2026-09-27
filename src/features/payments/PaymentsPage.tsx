import { CalendarCheck, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { PaymentType, Renewal } from "@/api/types";
import { useRenewals } from "@/api/usePayments";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { Chip, Input } from "@/components/Field";
import { MoneyText } from "@/components/MoneyText";
import { PageHeader } from "@/components/PageHeader";
import { Pill, StatusPill } from "@/components/Pill";
import { formatDate, formatINR, titleCase } from "@/lib/format";

import { monthlyPrefill, setupPrefill, type PaymentFormValues } from "./paymentForm";
import { PaymentsTable } from "./PaymentsTable";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";

export function RenewalsTable({ onRecord }: { onRecord: (initial: Partial<PaymentFormValues>) => void }) {
  const query = useRenewals();
  const columns: Column<Renewal>[] = [
    {
      key: "client",
      header: "Client",
      cell: (r) => (
        <Link
          to={`/clients/${r.client_id}?tab=payments`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {r.client_name}
        </Link>
      ),
    },
    { key: "package", header: "Package", cell: (r) => titleCase(r.package), hideOnMobile: true },
    { key: "amount", header: "Amount", cell: (r) => <MoneyText value={r.amount} />, align: "right" },
    { key: "due", header: "Due date", cell: (r) => formatDate(r.due_date) },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    {
      key: "setup",
      header: "Setup fee",
      cell: (r) =>
        r.setup_paid ? (
          <Pill tone="green">Paid</Pill>
        ) : Number(r.setup_fee) > 0 ? (
          <Button size="sm" variant="soft" onClick={() => onRecord(setupPrefill(r))}>
            Mark {formatINR(r.setup_fee)} paid
          </Button>
        ) : (
          <span className="text-ink-2">—</span>
        ),
    },
    {
      key: "action",
      header: <span className="sr-only">Actions</span>,
      mobileLabel: "",
      align: "right",
      cell: (r) =>
        r.status === "paid" ? (
          <span className="text-sm text-ok">Paid</span>
        ) : r.status === "upcoming" ? (
          <span className="text-sm text-ink-2">Not due yet</span>
        ) : (
          <Button size="sm" onClick={() => onRecord(monthlyPrefill(r))}>
            Mark paid
          </Button>
        ),
    },
  ];
  return (
    <DataTable
      rows={query.data}
      columns={columns}
      rowKey={(r) => r.client_id}
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => query.refetch()}
      caption="Renewals"
      empty={{
        title: "No live clients yet",
        text: "Renewals appear once a client is set to Live with a go-live date.",
        icon: <CalendarCheck />,
      }}
    />
  );
}

const TYPES: (PaymentType | "")[] = ["", "monthly", "setup", "other"];

export function PaymentsPage() {
  const [drawer, setDrawer] = useState<{ open: boolean; initial?: Partial<PaymentFormValues> }>({
    open: false,
  });
  const [type, setType] = useState<PaymentType | "">("");
  const [month, setMonth] = useState("");
  const record = (initial?: Partial<PaymentFormValues>) => setDrawer({ open: true, initial });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments & renewals"
        actions={
          <Button onClick={() => record()}>
            <Plus /> Record payment
          </Button>
        }
      />

      <section aria-labelledby="renewals-h">
        <h2 id="renewals-h" className="mb-3 text-lg font-semibold">
          This month's renewals
        </h2>
        <RenewalsTable onRecord={record} />
      </section>

      <section aria-labelledby="history-h">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 id="history-h" className="text-lg font-semibold">
            Payment history
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5" role="group" aria-label="Payment type">
              {TYPES.map((t) => (
                <Chip key={t || "all"} active={type === t} onClick={() => setType(t)}>
                  {t ? (t === "setup" ? "Setup" : titleCase(t)) : "All"}
                </Chip>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">Month</span>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-8 w-40"
              />
            </label>
            {month && (
              <Button variant="ghost" size="sm" onClick={() => setMonth("")}>
                Clear
              </Button>
            )}
          </div>
        </div>
        <PaymentsTable
          params={{ type: type || undefined, month: month || undefined }}
          emptyAction={
            <Button variant="secondary" onClick={() => record()}>
              <Plus /> Record payment
            </Button>
          }
        />
      </section>

      <RecordPaymentDrawer
        open={drawer.open}
        initial={drawer.initial}
        onClose={() => setDrawer({ open: false })}
      />
    </div>
  );
}
