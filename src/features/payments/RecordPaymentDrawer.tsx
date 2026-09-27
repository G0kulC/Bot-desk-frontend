import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import { useAllClients } from "@/api/useClients";
import { useCreatePayment } from "@/api/usePayments";
import { Button } from "@/components/Button";
import { Drawer } from "@/components/Drawer";
import { Field, Input, Select, Textarea } from "@/components/Field";
import { formatINR, titleCase } from "@/lib/format";

import {
  emptyPaymentValues,
  feeFor,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  paymentSchema,
  valuesToPayment,
  type PaymentFormValues,
} from "./paymentForm";

export function RecordPaymentDrawer({
  open,
  onClose,
  initial,
  lockClient = false,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<PaymentFormValues>;
  lockClient?: boolean;
}) {
  const clients = useAllClients();
  const create = useCreatePayment();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: emptyPaymentValues(initial),
  });
  const type = useWatch({ control, name: "type" });
  const clientId = useWatch({ control, name: "client_id" });
  const client = clients.data?.items.find((c) => c.id === clientId);

  useEffect(() => {
    if (!open) return;
    const values = emptyPaymentValues(initial);
    // Auto-fill the amount from the client's fees when the caller didn't give one.
    if (!initial?.amount) {
      const c = clients.data?.items.find((x) => x.id === values.client_id);
      values.amount = feeFor(c, values.type);
    }
    reset(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function refill(nextClientId: string, nextType: string) {
    const c = clients.data?.items.find((x) => x.id === nextClientId);
    const fee = feeFor(c, nextType);
    if (fee || nextType === "other") setValue("amount", fee, { shouldValidate: Boolean(fee) });
  }

  const onSubmit = handleSubmit((v) =>
    create.mutate(valuesToPayment(v), {
      onSuccess: () => {
        toast.success("Payment recorded");
        onClose();
      },
      onError: (e) => toast.error(errorMessage(e)),
    }),
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Record payment"
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="payment-form" loading={create.isPending}>
            Record payment
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={onSubmit} noValidate className="space-y-4">
        {lockClient ? (
          <Field label="Client">
            {(p) => (
              <>
                <Input {...p} readOnly value={client?.name ?? ""} />
                <input type="hidden" {...register("client_id")} />
              </>
            )}
          </Field>
        ) : (
          <Field label="Client" error={errors.client_id?.message}>
            {(p) => (
              <Select
                {...p}
                {...register("client_id", { onChange: (e) => refill(e.target.value, getValues("type")) })}
              >
                <option value="">Choose a client…</option>
                {clients.data?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Type">
          {(p) => (
            <Select
              {...p}
              {...register("type", { onChange: (e) => refill(getValues("client_id"), e.target.value) })}
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "setup" ? "Setup fee" : titleCase(t)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {type === "monthly" && (
          <Field label="For month" error={errors.for_month?.message}>
            {(p) => <Input {...p} type="month" {...register("for_month")} />}
          </Field>
        )}
        <Field
          label="Amount (₹)"
          error={errors.amount?.message}
          hint={
            client
              ? `Fees: setup ${formatINR(client.setup_fee)}, monthly ${formatINR(client.monthly_fee)}`
              : undefined
          }
        >
          {(p) => <Input {...p} inputMode="decimal" className="tnum" {...register("amount")} />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Paid on" error={errors.paid_on?.message}>
            {(p) => <Input {...p} type="date" {...register("paid_on")} />}
          </Field>
          <Field label="Method">
            {(p) => (
              <Select {...p} {...register("method")}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m === "UPI" ? "UPI" : titleCase(m)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Reference" optional hint="UPI transaction id, cheque no., etc.">
          {(p) => <Input {...p} {...register("reference")} />}
        </Field>
        <Field label="Note" optional>
          {(p) => <Textarea {...p} rows={2} {...register("note")} />}
        </Field>
      </form>
    </Drawer>
  );
}
