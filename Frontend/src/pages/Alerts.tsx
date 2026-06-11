import { useEffect, useMemo, useState } from "react";
import { getAlerts, markAlertRead, markAllAlertsRead } from "../lib/api";
import EmptyState from "../components/EmptyState";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
};

const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative rounded-xl bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 shadow-[0_0_15px_rgba(0,229,255,0.05)] overflow-hidden group ${className}`}
    >
      <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e5ff]/40"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e5ff]/40"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00e5ff]/40"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00e5ff]/40"></div>
      </div>
      <div className="absolute top-0 left-0 w-full h-[200%] pointer-events-none bg-gradient-to-b from-transparent via-[#00e5ff]/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[scan_3s_linear_infinite] z-0"></div>
      <div style={{ transform: "translateZ(30px)" }} className="relative z-20 h-full p-6 flex flex-col justify-between">
         {children}
      </div>
    </motion.div>
  );
};

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
  const isDataAvailable = localStorage.getItem("isDataAvailable") === "true";
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
    if (!isDataAvailable) return;

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

  if (!isDataAvailable) {
    return <EmptyState />;
  }

  if (loading) {
    return <div className="p-6 text-white">Loading alerts...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto relative overflow-hidden bg-[#0c1324] min-h-[calc(100vh-4rem)]"
    >
      <div className="absolute inset-0 grid-bg pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30"></div>

      <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
        <div>
          <h1 className="text-4xl font-['Space_Grotesk'] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white/60 mb-2 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
            SYSTEM ALERTS
          </h1>
          <p className="text-xs font-['Inter'] text-white/50 tracking-widest uppercase drop-shadow-sm">
            Real-time system warnings and congestion events
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={alerts.length === 0 || unreadCount === 0 || actionLoading === "all"}
          className="px-6 py-3 rounded border border-[#00e5ff] bg-[#00e5ff]/20 text-[#00e5ff] disabled:opacity-30 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30 text-[10px] uppercase font-bold tracking-widest transition-all duration-300 font-['Inter'] hover:bg-[#00e5ff]/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
        >
          {actionLoading === "all" ? "MARKING..." : "MARK ALL READ"}
        </button>
      </motion.div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[#00e5ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#00e5ff]/70 uppercase tracking-widest">Total Alerts</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">{alerts.length}</h2>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e9b3ff]/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[#e9b3ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#e9b3ff]/70 uppercase tracking-widest">Unread Alerts</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(233,179,255,0.5)]">{unreadCount}</h2>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard className="border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-red-500/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-red-400/70 uppercase tracking-widest">Critical Alerts</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">{criticalCount}</h2>
        </TiltCard></motion.div>
      </div>

      {/* ALERT LIST */}
      <motion.div variants={itemVariants} className="space-y-4 relative z-10">
        {alerts.length === 0 ? (
          <div className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] text-center">
            <span className="text-[#00e5ff] font-['Space_Grotesk'] tracking-widest uppercase text-xs">No alerts available right now.</span>
          </div>
        ) : (
          alerts.map((alert) => {
            const isRead = alert.is_read;
            const isCritical = alert.severity === "critical";
            const borderColor = isRead ? "border-white/10" : isCritical ? "border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-[#00e5ff]/40 shadow-[0_0_15px_rgba(0,229,255,0.1)]";
            const bgColor = isRead ? "bg-white/5" : isCritical ? "bg-red-500/10" : "bg-[#00e5ff]/10";
            const titleColor = isRead ? "text-white/60" : isCritical ? "text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" : "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]";

            return (
              <div
                key={alert.id}
                className={`rounded-xl p-6 transition-all duration-300 relative group overflow-hidden ${borderColor} ${bgColor} backdrop-blur-md`}
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-50"></div>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between relative z-10">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className={`text-sm font-['Space_Grotesk'] font-bold uppercase tracking-widest ${titleColor}`}>{alert.title}</h2>

                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 font-bold tracking-widest rounded border ${isCritical ? 'border-red-500/50 text-red-400 bg-red-500/20' : 'border-[#00e5ff]/50 text-[#00e5ff] bg-[#00e5ff]/20'}`}
                      >
                        {alert.severity}
                      </span>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-widest ${
                          isRead
                            ? "border-white/10 text-white/40 bg-black/40"
                            : "border-[#e9b3ff]/50 text-[#e9b3ff] bg-[#e9b3ff]/20 shadow-[0_0_5px_rgba(233,179,255,0.4)]"
                        }`}
                      >
                        {isRead ? "READ" : "UNREAD"}
                      </span>
                    </div>

                    <p className="text-xs font-['Inter'] tracking-wide text-white/70">{alert.description}</p>

                    <div className="text-[10px] font-['Inter'] uppercase tracking-widest text-white/40 space-y-1 flex items-center gap-6">
                      <p>NODE: {alert.location}</p>
                      <p>
                        TIME:{" "}
                        {alert.created_at
                          ? new Date(alert.created_at).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {!isRead && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      disabled={actionLoading === alert.id}
                      className="px-4 py-2 mt-2 md:mt-0 rounded border border-[#00e5ff]/50 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] disabled:opacity-30 disabled:border-white/10 disabled:text-white/30 text-[9px] uppercase font-bold tracking-widest transition-all duration-300 font-['Inter']"
                    >
                      {actionLoading === alert.id ? "UPDATING..." : "ACKNOWLEDGE"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}