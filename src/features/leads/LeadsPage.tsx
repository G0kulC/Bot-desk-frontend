import { useSearchParams } from "react-router-dom";

import { useAllClients } from "@/api/useClients";
import { Select } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

import { LeadsTable } from "./LeadsTable";

export function LeadsPage() {
  const [params, setParams] = useSearchParams();
  const clients = useAllClients();
  const client = params.get("client") ?? "";
  return (
    <div>
      <PageHeader
        title="Leads"
        actions={
          <Select
            aria-label="Client"
            value={client}
            onChange={(e) => setParams(e.target.value ? { client: e.target.value } : {}, { replace: true })}
            className="w-56"
          >
            <option value="">All clients</option>
            {clients.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        }
      />
      <LeadsTable filterClientId={client || undefined} />
    </div>
  );
}
