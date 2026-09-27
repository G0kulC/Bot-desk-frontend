/** Query keys in one place so mutations invalidate exactly what they change. */
export const qk = {
  me: ["me"] as const,
  config: ["config"] as const,
  dashboard: ["dashboard"] as const,
  clients: {
    all: ["clients"] as const,
    list: (params: object) => ["clients", "list", params] as const,
    detail: (id: string) => ["clients", "detail", id] as const,
  },
  knowledge: {
    all: (clientId: string) => ["knowledge", clientId] as const,
    current: (clientId: string) => ["knowledge", clientId, "current"] as const,
    versions: (clientId: string) => ["knowledge", clientId, "versions"] as const,
    template: (niche: string) => ["knowledge-template", niche] as const,
  },
  channel: (clientId: string) => ["channel", clientId] as const,
  inbox: {
    all: ["inbox"] as const,
    list: (params: object) => ["inbox", "list", params] as const,
    messages: (contactId: string) => ["inbox", "messages", contactId] as const,
    contact: (contactId: string) => ["inbox", "contact", contactId] as const,
  },
  leads: {
    all: ["leads"] as const,
    list: (params: object) => ["leads", "list", params] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (params: object) => ["payments", "list", params] as const,
  },
  renewals: ["renewals"] as const,
  report: (clientId: string, month: string) => ["report", clientId, month] as const,
};
