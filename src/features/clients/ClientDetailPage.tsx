import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useClient } from "@/api/useClients";
import { Button } from "@/components/Button";
import { StatusPill } from "@/components/Pill";
import { ErrorState, Skeleton } from "@/components/States";
import { TabPanel, Tabs } from "@/components/Tabs";
import { ChannelTab } from "@/features/channel/ChannelTab";
import { InboxView } from "@/features/inbox/InboxView";
import { KnowledgeTab } from "@/features/knowledge/KnowledgeTab";
import { LeadsTable } from "@/features/leads/LeadsTable";
import { ClientPaymentsTab } from "@/features/payments/ClientPaymentsTab";
import { ReportTab } from "@/features/reports/ReportTab";
import { TestBotTab } from "@/features/testbot/TestBotTab";
import { nicheLabel } from "@/lib/format";

import { ClientFormDrawer } from "./ClientFormDrawer";
import { OverviewTab } from "./OverviewTab";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "knowledge", label: "Bot knowledge" },
  { value: "test", label: "Test bot" },
  { value: "channel", label: "Channel" },
  { value: "conversations", label: "Conversations" },
  { value: "leads", label: "Leads" },
  { value: "payments", label: "Payments" },
  { value: "report", label: "Report" },
] as const;
type TabValue = (typeof TABS)[number]["value"];

export function ClientDetailPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(false);
  const { data: client, isLoading, error, refetch } = useClient(id);
  const tab = (TABS.find((t) => t.value === params.get("tab"))?.value ?? "overview") as TabValue;

  function setTab(value: TabValue) {
    const next = new URLSearchParams(params);
    next.set("tab", value);
    setParams(next, { replace: true });
  }

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (error || !client)
    return <ErrorState error={error} onRetry={() => refetch()} title="Couldn't load client" />;

  return (
    <div>
      <Link to="/clients" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Clients
      </Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold sm:text-[28px]">
            <span className="truncate">{client.name}</span>
            <StatusPill status={client.status} />
          </h1>
          <p className="text-sm text-ink-2">
            {nicheLabel(client.niche)}
            {client.city && ` · ${client.city}`}
            {client.owner_name && ` · ${client.owner_name}`}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          <Pencil /> Edit
        </Button>
      </div>

      <Tabs items={[...TABS]} value={tab} onChange={setTab} label="Client sections" idBase="client-tab" />
      <TabPanel idBase="client-tab" value={tab}>
        {tab === "overview" && <OverviewTab client={client} onOpenTab={setTab} />}
        {tab === "knowledge" && <KnowledgeTab client={client} />}
        {tab === "test" && <TestBotTab client={client} />}
        {tab === "channel" && <ChannelTab client={client} />}
        {tab === "conversations" && <InboxView clientId={client.id} embedded />}
        {tab === "leads" && <LeadsTable clientId={client.id} />}
        {tab === "payments" && <ClientPaymentsTab client={client} />}
        {tab === "report" && <ReportTab client={client} />}
      </TabPanel>

      <ClientFormDrawer open={editing} onClose={() => setEditing(false)} client={client} />
    </div>
  );
}
