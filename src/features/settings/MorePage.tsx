import { ChevronRight, LogOut, Settings, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { useSignOut } from "@/features/auth/useSignOut";

const ITEMS = [
  { to: "/leads", label: "Leads", icon: Target, hint: "Enquiries captured by the assistants" },
  { to: "/settings", label: "Settings", icon: Settings, hint: "Theme, AI models and package prices" },
];

export function MorePage() {
  const signOut = useSignOut();
  return (
    <div>
      <PageHeader title="More" />
      <ul className="card divide-y divide-line">
        {ITEMS.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
              <i.icon className="size-5 text-brand" aria-hidden />
              <span className="flex-1">
                <span className="block font-medium">{i.label}</span>
                <span className="block text-sm text-ink-2">{i.hint}</span>
              </span>
              <ChevronRight className="size-4 text-ink-2" aria-hidden />
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left font-medium text-bad hover:bg-bad/5"
          >
            <LogOut className="size-5" aria-hidden /> Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}
