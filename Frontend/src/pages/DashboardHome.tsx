import { useEffect, useState } from "react";

interface Stats {
  totalVehicles: number;
  density: number;
  alerts: number;
  vehicleTypes: {
    car: number;
    bike: number;
    bus: number;
    truck: number;
  };
  laneDensity: { lane: string; density: number }[];
  trafficTrend: { time: string; vehicles: number }[];
  recommendedSignalTime: number;
  updatedAt: string | null;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    density: 0,
    alerts: 0,
    vehicleTypes: {
      car: 0,
      bike: 0,
      bus: 0,
      truck: 0,
    },
    laneDensity: [],
    trafficTrend: [],
    recommendedSignalTime: 30,
    updatedAt: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/dashboard/stats");
      const data = await res.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      setError("Backend not connected");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto animate-in-fade">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            System Overview
          </h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Live tracking and analytics aggregation.</p>
        </div>
        <div className="text-xs font-semibold text-primary px-4 py-2 rounded-full border border-primary/20 bg-primary/10 glow-green backdrop-blur-md">
          {stats.updatedAt ? "LIVE STREAM ACTIVE" : "AWAITING DATA"}
        </div>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-primary/20"></div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Total Vehicles</p>
          <h2 className="text-6xl font-display font-bold mt-4 text-white relative z-10 glow-text">{stats.totalVehicles}</h2>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-accent/20"></div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Density</p>
          <h2 className="text-6xl font-display font-bold mt-4 text-white relative z-10 glow-violet">{stats.density}<span className="text-3xl text-white/50 ml-1">%</span></h2>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-destructive/20"></div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Alerts</p>
          <h2 className="text-6xl font-display font-bold mt-4 text-white relative z-10 text-shadow-[0_0_20px_rgba(255,50,50,0.5)]">{stats.alerts}</h2>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-primary/20"></div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Signal Time</p>
          <h2 className="text-6xl font-display font-bold mt-4 text-white relative z-10 glow-text">{stats.recommendedSignalTime}<span className="text-3xl text-white/50 ml-1">s</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* VEHICLE TYPES */}
        <div className="glass-card p-8 xl:col-span-1">
          <h2 className="text-xl font-display font-bold mb-6 tracking-tight text-white/90">Vehicle Distribution</h2>
          <div className="space-y-4">
            {Object.entries(stats.vehicleTypes).map(([type, count]) => (
               <div key={type} className="flex justify-between items-center group">
                 <span className="capitalize text-muted-foreground font-medium">{type}</span>
                 <span className="font-display font-bold text-2xl group-hover:text-primary transition-colors">{count}</span>
               </div>
            ))}
          </div>
        </div>

        {/* LANE DENSITY */}
        <div className="glass-card p-8 xl:col-span-2 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent/5 blur-[100px] pointer-events-none"></div>
          <h2 className="text-xl font-display font-bold mb-6 tracking-tight text-white/90 relative z-10">Lane Density Map</h2>

          <div className="space-y-6 relative z-10">
            {stats.laneDensity.map((lane, i) => (
              <div key={i} className="group cursor-default">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-white/80">{lane.lane}</span>
                  <span className="font-display font-bold text-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">{lane.density}%</span>
                </div>
                <div className="w-full bg-background/50 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out flex group-hover:opacity-100"
                    style={{ 
                       width: `${lane.density}%`,
                       background: `linear-gradient(90deg, hsl(var(--primary)/0.5) 0%, hsl(var(--primary)) 100%)`, 
                       boxShadow: `0 0 10px hsl(var(--primary)/0.5)`
                     }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRAFFIC TREND */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-display font-bold mb-6 tracking-tight text-white/90">Traffic Trend Matrix</h2>

        <div className="grid grid-cols-5 gap-4">
          {stats.trafficTrend.map((item, i) => (
            <div key={i} className="bg-background/40 border border-white/5 p-4 text-center rounded-xl hover:bg-white/5 transition-colors group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{item.time}</div>
              <div className="text-3xl font-display font-bold group-hover:text-accent transition-colors">{item.vehicles}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LAST UPDATED */}
      <div className="text-sm text-gray-400">
        Last Updated:{" "}
        {stats.updatedAt
          ? new Date(stats.updatedAt).toLocaleString()
          : "N/A"}
      </div>
    </div>
  );
}