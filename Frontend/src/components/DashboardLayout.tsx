import { useEffect, useMemo, useState } from "react";
import { useLocation, Link, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  BarChart3,
  TrafficCone,
  Play,
  Bell,
  Settings,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { getAlerts } from "../lib/api";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Live Feed", path: "/live-feed", icon: Video },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "Signals", path: "/signals", icon: TrafficCone },
  { title: "Simulation", path: "/simulation", icon: Play },
  { title: "Alerts", path: "/alerts", icon: Bell },
  { title: "Upload Video", path: "/upload-video", icon: Upload },
  { title: "Settings", path: "/settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard Overview",
  "/live-feed": "Live CCTV Feed",
  "/analytics": "Traffic Analytics",
  "/signals": "Signal Control",
  "/simulation": "Traffic Simulation",
  "/alerts": "Alerts & Notifications",
  "/upload-video": "Upload Traffic Video",
  "/settings": "Settings",
};

interface AlertItem {
  id: number;
  is_read: boolean;
}

export default function DashboardLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const loadAlerts = async () => {
    try {
      const res = await getAlerts();
      const alertData = res.data || [];
      setAlerts(alertData);
    } catch (err) {
      console.error("Layout alerts fetch error:", err);
    }
  };

  useEffect(() => {
    loadAlerts();

    const interval = setInterval(() => {
      loadAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.is_read).length,
    [alerts]
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="w-64 shrink-0 bg-background-secondary border-r border-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <TrafficCone className="h-6 w-6 text-primary mr-3" />
          <span className="text-foreground font-semibold text-lg">TrafficAI</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-muted-foreground hover:bg-background-tertiary hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 bg-background-secondary border-b border-border flex items-center justify-between px-6">
          <h1 className="text-lg font-medium text-foreground">
            {pageTitles[currentPath] || "Dashboard"}
          </h1>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-muted-foreground">System Active</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{unreadCount} Alerts</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}