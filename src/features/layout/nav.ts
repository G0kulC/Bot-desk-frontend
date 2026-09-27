import {
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  Settings,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };

export const SIDEBAR_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/leads", label: "Leads", icon: Target },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const MOBILE_TABS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/more", label: "More", icon: MoreHorizontal },
];
