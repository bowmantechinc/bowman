import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  KanbanSquare,
  GanttChartSquare,
  ShieldAlert,
  Receipt,
  Boxes,
  Users,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Projects", href: "/projects", icon: Briefcase },
      { label: "Knowledge Base", href: "/knowledge", icon: BookOpen },
      { label: "Task Board", href: "/tasks", icon: KanbanSquare },
      { label: "Timeline", href: "/timeline", icon: GanttChartSquare },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Risk Register", href: "/risks", icon: ShieldAlert },
      { label: "Vendors", href: "/vendors", icon: Receipt },
      { label: "Resources", href: "/resources", icon: Boxes },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Members", href: "/members", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings, adminOnly: true },
    ],
  },
];
