import { PageHeader } from "@/components/PageHeader";

import { InboxView } from "./InboxView";

export function InboxPage() {
  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Refreshes every 10 seconds while this tab is open."
        className="mb-3"
      />
      <InboxView />
    </div>
  );
}
