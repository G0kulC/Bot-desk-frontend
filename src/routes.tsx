import { createBrowserRouter, type RouteObject } from "react-router-dom";

import { LoginPage } from "./features/auth/LoginPage";
import { requireAuth } from "./features/auth/requireAuth";
import { ClientDetailPage } from "./features/clients/ClientDetailPage";
import { ClientsPage } from "./features/clients/ClientsPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { InboxPage } from "./features/inbox/InboxPage";
import { AppShell } from "./features/layout/AppShell";
import { NotFound, RouteError } from "./features/layout/NotFound";
import { LeadsPage } from "./features/leads/LeadsPage";
import { PaymentsPage } from "./features/payments/PaymentsPage";
import { MorePage } from "./features/settings/MorePage";
import { SettingsPage } from "./features/settings/SettingsPage";

export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage />, errorElement: <RouteError /> },
  {
    path: "/",
    element: <AppShell />,
    loader: requireAuth,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "clients/:id", element: <ClientDetailPage /> },
      { path: "inbox", element: <InboxPage /> },
      { path: "leads", element: <LeadsPage /> },
      { path: "payments", element: <PaymentsPage /> },
      { path: "more", element: <MorePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
