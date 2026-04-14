import { useEffect, useMemo, useState } from "react";
import { getAlerts, markAlertRead, markAllAlertsRead } from "../lib/api";

interface AlertItem {
  id: number;
  severity: "warning" | "critical" | string;
  title: string;
  description: string;
  location: string;
  is_read: boolean;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | "all" | null>(null);
  const [error, setError] = useState("");

  const loadAlerts = async () => {
    try {
      setError("");
      const res = await getAlerts();
      const alertData = res.data.data || res.data || [];
      setAlerts(alertData);
    } catch (err) {
      console.error("Alerts fetch error:", err);
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
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

  const criticalCount = useMemo(
    () => alerts.filter((alert) => alert.severity === "critical").length,
    [alerts]
  );

  const handleMarkRead = async (id: number) => {
    try {
      setActionLoading(id);
      await markAlertRead(id);
      await loadAlerts();
    } catch (err) {
      console.error("Mark read error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading("all");
      await markAllAlertsRead();
      await loadAlerts();
    } catch (err) {
      console.error("Mark all read error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverityClasses = (severity: string, isRead: boolean) => {
    if (isRead) {
      return {
        card: "border-white/10 bg-white/5",
        badge: "bg-slate-700 text-slate-200 border border-slate-500/40",
      };
    }

    if (severity === "critical") {
      return {
        card: "border-red-400/40 bg-red-500/10",
        badge: "bg-red-500/20 text-red-300 border border-red-400/40",
      };
    }

    return {
      card: "border-yellow-400/40 bg-yellow-500/10",
      badge: "bg-yellow-500/20 text-yellow-300 border border-yellow-400/40",
    };
  };

  if (loading) {
    return <div className="p-6 text-white">Loading alerts...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-white/60 mt-1">
            Real-time system warnings and congestion events
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={alerts.length === 0 || unreadCount === 0 || actionLoading === "all"}
          className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400 disabled:opacity-50"
        >
          {actionLoading === "all" ? "Marking..." : "Mark All Read"}
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Total Alerts</p>
          <h2 className="text-3xl font-bold mt-2">{alerts.length}</h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Unread Alerts</p>
          <h2 className="text-3xl font-bold mt-2">{unreadCount}</h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Critical Alerts</p>
          <h2 className="text-3xl font-bold mt-2">{criticalCount}</h2>
        </div>
      </div>

      {/* ALERT LIST */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/30 p-6 text-white/70">
            No alerts available right now.
          </div>
        ) : (
          alerts.map((alert) => {
            const classes = getSeverityClasses(alert.severity, alert.is_read);

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 transition-all ${classes.card}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{alert.title}</h2>

                      <span
                        className={`text-xs uppercase px-2 py-1 rounded-full ${classes.badge}`}
                      >
                        {alert.severity}
                      </span>

                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          alert.is_read
                            ? "border-white/10 text-white/50"
                            : "border-cyan-400/30 text-cyan-300"
                        }`}
                      >
                        {alert.is_read ? "Read" : "Unread"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300">{alert.description}</p>

                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Location: {alert.location}</p>
                      <p>
                        Time:{" "}
                        {alert.created_at
                          ? new Date(alert.created_at).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      disabled={actionLoading === alert.id}
                      className="px-3 py-2 rounded-lg border border-cyan-400 bg-cyan-500/20 disabled:opacity-50"
                    >
                      {actionLoading === alert.id ? "Updating..." : "Mark as Read"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}