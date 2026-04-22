import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Video,
  TrafficCone,
  Play,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { UserRole } from "../context/AuthContext";

export type NavItem = {
  title: string;
  path: string;
  icon: any;
  roles: UserRole[];
};

export const navItems: NavItem[] = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["user", "admin"] },
  { title: "Analytics", path: "/analytics", icon: BarChart3, roles: ["user", "admin"] },
  { title: "Settings", path: "/settings", icon: Settings, roles: ["user", "admin"] },
  { title: "Live Feed", path: "/live-feed", icon: Video, roles: ["admin"] },
  { title: "Signals", path: "/signals", icon: TrafficCone, roles: ["admin"] },
  { title: "Simulation", path: "/simulation", icon: Play, roles: ["admin"] },
  { title: "Alerts", path: "/alerts", icon: Bell, roles: ["admin"] },
  { title: "Admin Panel", path: "/admin", icon: ShieldCheck, roles: ["admin"] },
];