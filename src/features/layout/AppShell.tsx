import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { onUnauthorized } from "@/api/client";
import { useDashboard } from "@/api/useDashboard";
import { Logo } from "@/components/Logo";
import { ScrollProgress } from "@/components/magicui/scroll-progress";
import { useSignOut } from "@/features/auth/useSignOut";
import { cn } from "@/lib/utils";

import { MOBILE_TABS, SIDEBAR_NAV, type NavItem } from "./nav";

function Badge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="tnum ml-auto rounded-full bg-bad px-1.5 text-[11px] font-semibold leading-5 text-white dark:text-bg">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const signOut = useSignOut();
  const { data: summary } = useDashboard();
  const badges: Record<string, number | undefined> = { "/inbox": summary?.handoffs_open };

  // Any 401 from the API signs the user out and returns them here afterwards.
  useEffect(
    () =>
      onUnauthorized(() => {
        qc.clear();
        const next = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?next=${next}`, { replace: true });
      }),
    [navigate, location.pathname, location.search, qc],
  );

  const link = (item: NavItem, mobile = false) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        mobile
          ? cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              isActive ? "text-brand" : "text-ink-2",
            )
          : cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium transition-colors",
              isActive ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
            )
      }
    >
      <item.icon className={mobile ? "size-5" : "size-[18px]"} aria-hidden />
      <span>{item.label}</span>
      {mobile ? (
        badges[item.to] ? (
          <span
            className="absolute right-[calc(50%-18px)] top-1 size-2 rounded-full bg-bad"
            aria-label="needs attention"
          />
        ) : null
      ) : (
        <Badge count={badges[item.to]} />
      )}
    </NavLink>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px,1fr]">
      <ScrollProgress className="h-0.5 bg-gradient-to-r from-brand via-ok to-brand" />
      <a
        href="#main"
        className="sr-only z-50 rounded bg-brand px-3 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 py-4 md:flex">
        <Logo className="mb-6 px-2" />
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {SIDEBAR_NAV.map((i) => link(i))}
        </nav>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <LogOut className="size-[18px]" aria-hidden /> Sign out
        </button>
      </aside>

      <main id="main" className="min-w-0 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur md:hidden"
      >
        {MOBILE_TABS.map((i) => link(i, true))}
      </nav>
    </div>
  );
}
