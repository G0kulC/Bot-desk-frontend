import { ChevronLeft, ChevronRight, Plus, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { Client, ClientStatus, Niche } from "@/api/types";
import { useConfig } from "@/api/useAuth";
import { useClients } from "@/api/useClients";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { Chip, Input, Select } from "@/components/Field";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { MoneyText } from "@/components/MoneyText";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/Pill";
import { nicheLabel, titleCase } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/motion";

import { ClientFormDrawer } from "./ClientFormDrawer";
import { NICHES, STATUSES } from "./clientForm";
import { LanguagesText, NextStep, ProviderBadge } from "./clientHelpers";

const PAGE_SIZE = 25;

export function ClientsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: config } = useConfig();
  const reduced = usePrefersReducedMotion();
  const status = (params.get("status") ?? "") as ClientStatus | "";
  const niche = (params.get("niche") ?? "") as Niche | "";
  const page = Number(params.get("page") ?? 1) || 1;
  const [q, setQ] = useState(params.get("q") ?? "");
  const drawerOpen = params.get("new") === "1";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  }

  // Debounced search → URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) setParam("q", q.trim());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const query = useClients({
    status: status || undefined,
    niche: niche || undefined,
    q: params.get("q") || undefined,
    page,
    page_size: PAGE_SIZE,
  });
  const data = query.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const filtered = Boolean(status || niche || params.get("q"));

  const columns: Column<Client>[] = [
    {
      key: "business",
      header: "Business",
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{c.name}</p>
          <p className="truncate text-xs text-ink-2">
            {nicheLabel(c.niche)}
            {c.city && ` · ${c.city}`}
          </p>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (c) => <StatusPill status={c.status} /> },
    { key: "package", header: "Package", cell: (c) => titleCase(c.package), hideOnMobile: true },
    {
      key: "monthly",
      header: "Monthly",
      cell: (c) => <MoneyText value={c.monthly_fee} />,
      align: "right",
    },
    { key: "provider", header: "Provider", cell: (c) => <ProviderBadge client={c} />, hideOnMobile: true },
    {
      key: "languages",
      header: "Languages",
      cell: (c) => <LanguagesText languages={c.languages} />,
      hideOnMobile: true,
    },
    {
      key: "next",
      header: "Next step",
      cell: (c) => <NextStep client={c} trialDays={config?.trial_days} />,
    },
  ];

  const openNew = () => setParam("new", "1");
  const addButton = reduced ? (
    <Button onClick={openNew}>
      <Plus /> Add client
    </Button>
  ) : (
    <ShimmerButton
      onClick={openNew}
      background="hsl(var(--brand))"
      shimmerColor="hsl(var(--brand-soft))"
      borderRadius="8px"
      className="h-10 gap-2 px-4 text-[15px] font-medium text-brand-ink dark:text-brand-ink"
    >
      <Plus className="size-4" aria-hidden /> Add client
    </ShimmerButton>
  );

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={data ? `${data.total} client${data.total === 1 ? "" : "s"}` : undefined}
        actions={addButton}
      />

      <div className="mb-4 space-y-3">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={!status} onClick={() => setParam("status", "")}>
            All
          </Chip>
          {STATUSES.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setParam("status", s)}>
              {titleCase(s)}
            </Chip>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search clients</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, city or owner"
              className="pl-9"
              type="search"
            />
          </label>
          <Select
            aria-label="Niche"
            value={niche}
            onChange={(e) => setParam("niche", e.target.value)}
            className="sm:w-52"
          >
            <option value="">All niches</option>
            {NICHES.map((n) => (
              <option key={n} value={n}>
                {nicheLabel(n)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <DataTable
        rows={data?.items}
        columns={columns}
        rowKey={(c) => c.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={(c) => navigate(`/clients/${c.id}`)}
        caption="Clients"
        empty={
          filtered
            ? {
                title: "No clients match",
                text: "Try another status, niche or search.",
                action: (
                  <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                    Clear filters
                  </Button>
                ),
                icon: <Search />,
              }
            : {
                title: "No clients yet",
                text: "Add your first business to set up its WhatsApp assistant.",
                action: (
                  <Button onClick={openNew}>
                    <Plus /> Add client
                  </Button>
                ),
                icon: <Users />,
              }
        }
      />

      {data && pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setParam("page", String(page - 1))}
          >
            <ChevronLeft /> Prev
          </Button>
          <span className="tnum text-sm text-ink-2">
            Page {page} of {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pages}
            onClick={() => setParam("page", String(page + 1))}
          >
            Next <ChevronRight />
          </Button>
        </nav>
      )}

      <ClientFormDrawer open={drawerOpen} onClose={() => setParam("new", "")} />
    </div>
  );
}
