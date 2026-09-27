import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Client } from "@/api/types";
import { useConfig } from "@/api/useAuth";
import { useCreateClient, useUpdateClient } from "@/api/useClients";
import { Button } from "@/components/Button";
import { Drawer } from "@/components/Drawer";
import { Chip, Field, Input, Select, Textarea } from "@/components/Field";
import { formatINR, nicheLabel, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  clientSchema,
  clientToValues,
  datesForStatus,
  emptyClientValues,
  FORM_LANGUAGES,
  NICHES,
  PACKAGES,
  packageFees,
  STATUSES,
  valuesToPayload,
  type ClientFormValues,
} from "./clientForm";

export function ClientFormDrawer({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client;
}) {
  const { data: config } = useConfig();
  const navigate = useNavigate();
  const create = useCreateClient();
  const update = useUpdateClient(client?.id ?? "");
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? clientToValues(client) : emptyClientValues(config),
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = form;

  // Reset only when the drawer opens (never on background refetch, so typing is never lost).
  useEffect(() => {
    if (open) reset(client ? clientToValues(client) : emptyClientValues(config));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id]);

  const pkg = useWatch({ control, name: "package" });

  function choosePackage(p: string) {
    setValue("package", p as ClientFormValues["package"], { shouldDirty: true });
    const fees = packageFees(p, config);
    if (fees) {
      setValue("setup_fee", fees.setup, { shouldDirty: true, shouldValidate: true });
      setValue("monthly_fee", fees.monthly, { shouldDirty: true, shouldValidate: true });
    }
  }

  const onSubmit = handleSubmit((values) => {
    const payload = valuesToPayload(values);
    if (client) {
      const { bot_enabled: _ignored, ...patch } = payload;
      update.mutate(patch, {
        onSuccess: () => {
          toast.success("Client saved");
          onClose();
        },
        onError: (e) => toast.error(errorMessage(e)),
      });
    } else {
      create.mutate(payload, {
        onSuccess: (c) => {
          toast.success("Client saved");
          onClose();
          navigate(`/clients/${c.id}?tab=knowledge`);
        },
        onError: (e) => toast.error(errorMessage(e)),
      });
    }
  });

  const saving = create.isPending || update.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={client ? `Edit ${client.name}` : "Add client"}
      description={client ? undefined : "Fees fill in from the package; you can change them."}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="client-form" loading={saving}>
            {client ? "Save changes" : "Add client"}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Business name" error={errors.name?.message}>
          {(p) => <Input {...p} data-autofocus autoComplete="off" {...register("name")} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Niche">
            {(p) => (
              <Select {...p} {...register("niche")}>
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {nicheLabel(n)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="City" optional>
            {(p) => <Input {...p} placeholder="Chennai" {...register("city")} />}
          </Field>
          <Field label="Owner name" optional>
            {(p) => <Input {...p} {...register("owner_name")} />}
          </Field>
          <Field
            label="Owner WhatsApp"
            optional
            hint="+91 is added for 10-digit Indian numbers"
            error={errors.owner_phone?.message}
          >
            {(p) => (
              <Input
                {...p}
                type="tel"
                inputMode="tel"
                placeholder="+91 98400 12345"
                {...register("owner_phone")}
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Languages</legend>
          <Controller
            control={control}
            name="languages"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {FORM_LANGUAGES.map((lang) => {
                  const on = field.value.includes(lang);
                  return (
                    <Chip
                      key={lang}
                      active={on}
                      onClick={() =>
                        field.onChange(on ? field.value.filter((l) => l !== lang) : [...field.value, lang])
                      }
                    >
                      {lang}
                    </Chip>
                  );
                })}
              </div>
            )}
          />
          <p className="mt-1.5 text-xs text-ink-2">
            Tanglish/Hinglish replies are allowed when Tamil/Hindi is on.
          </p>
          {errors.languages && (
            <p className="mt-1 text-xs font-medium text-bad">{errors.languages.message}</p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Package</legend>
          <div role="radiogroup" aria-label="Package" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PACKAGES.map((p) => {
              const fees = packageFees(p, config);
              const selected = pkg === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choosePackage(p)}
                  className={cn(
                    "relative rounded-md border p-3 text-left transition-colors",
                    selected ? "border-brand bg-brand-soft" : "border-line hover:border-ink-2/40",
                  )}
                >
                  {selected && <Check className="absolute right-2 top-2 size-4 text-brand" aria-hidden />}
                  <span className="block font-semibold">{titleCase(p)}</span>
                  <span className="tnum block text-xs text-ink-2">
                    {fees ? `${formatINR(fees.monthly)}/mo` : "Your price"}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Setup fee (₹)" error={errors.setup_fee?.message}>
            {(p) => <Input {...p} inputMode="decimal" className="tnum" {...register("setup_fee")} />}
          </Field>
          <Field label="Monthly fee (₹)" error={errors.monthly_fee?.message}>
            {(p) => <Input {...p} inputMode="decimal" className="tnum" {...register("monthly_fee")} />}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            {(p) => (
              <Select
                {...p}
                {...register("status", {
                  onChange: (e) => {
                    const patch = datesForStatus(e.target.value, getValues());
                    if (patch.trial_start) setValue("trial_start", patch.trial_start, { shouldDirty: true });
                    if (patch.live_date) setValue("live_date", patch.live_date, { shouldDirty: true });
                  },
                })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Trial start" optional>
            {(p) => <Input {...p} type="date" {...register("trial_start")} />}
          </Field>
          <Field label="Go-live date" optional>
            {(p) => <Input {...p} type="date" {...register("live_date")} />}
          </Field>
        </div>

        <Field
          label="WhatsApp provider"
          hint={`Default for all clients: ${config?.default_provider === "aisensy" ? "AiSensy" : "Own (Meta Cloud API)"}`}
        >
          {(p) => (
            <Select {...p} {...register("provider_override")}>
              <option value="">Use default</option>
              <option value="own">Own (Meta Cloud API)</option>
              <option value="aisensy">AiSensy</option>
            </Select>
          )}
        </Field>

        <Field label="Notes" optional>
          {(p) => <Textarea {...p} rows={3} {...register("notes")} />}
        </Field>
      </form>
    </Drawer>
  );
}
