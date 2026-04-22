import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend,
  ReferenceDot,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import {
  getVehicleTypes,
  getHourlyCount,
  getLaneDensity,
  getInsights,
  getReports
} from "../lib/api";

interface VehicleTypeApi {
  car: number;
  bike: number;
  bus: number;
  truck: number;
}

interface TrendPoint {
  time: string;
  vehicles: number;
}

interface LanePoint {
  lane: string;
  density: number;
}

interface InsightItem {
  id: number;
  insight: string;
}

export default function Analytics() {
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [hourlyCount, setHourlyCount] = useState<TrendPoint[]>([]);
  const [laneDensity, setLaneDensity] = useState<LanePoint[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [reportData, setReportData] = useState<any[]>([]);

  const loadReports = async (period: "daily" | "weekly" | "monthly") => {
    try {
      const res = await getReports(period);
      setReportData([...(res.data || [])].reverse());
    } catch (err) {
      console.error("Historical reports load failed", err);
    }
  };

  const loadAnalytics = async () => {
    try {
      setError("");

      const [vehicleRes, hourlyRes, laneRes, insightRes] = await Promise.all([
        getVehicleTypes(),
        getHourlyCount(),
        getLaneDensity(),
        getInsights(),
      ]);

      const vehicleData: VehicleTypeApi = vehicleRes.data || {};
      const hourlyData: TrendPoint[] = hourlyRes.data || [];
      const laneData: LanePoint[] = laneRes.data || [];
      const insightData: InsightItem[] = insightRes.data || [];

      setVehicleTypes([
        { name: "Detected Cars", value: vehicleData.car || 0, color: "hsl(153 100% 40%)" },
        { name: "Detected Buses", value: vehicleData.bus || 0, color: "#3b82f6" },
        { name: "Detected Bikes", value: vehicleData.bike || 0, color: "#fbbf24" },
        { name: "Detected Trucks", value: vehicleData.truck || 0, color: "#f97316" },
      ]);

      setHourlyCount(hourlyData);
      setLaneDensity(laneData);
      setInsights(insightData);
    } catch (err) {
      console.error("Analytics load error:", err);
      setError("Analytics data load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(() => {
      loadAnalytics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadReports(reportPeriod);
  }, [reportPeriod]);

  const totalDetectedVehicles = vehicleTypes.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const peakTrend = useMemo(() => {
    if (!hourlyCount.length) return null;
    return hourlyCount.reduce((max, item) =>
      item.vehicles > max.vehicles ? item : max
    );
  }, [hourlyCount]);

  const lowestTrend = useMemo(() => {
    if (!hourlyCount.length) return null;
    return hourlyCount.reduce((min, item) =>
      item.vehicles < min.vehicles ? item : min
    );
  }, [hourlyCount]);

  const busiestLane = useMemo(() => {
    if (!laneDensity.length) return null;
    return [...laneDensity].sort((a, b) => b.density - a.density)[0];
  }, [laneDensity]);

  if (loading) {
    return <div className="p-6 text-foreground">Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">{error}</div>;
  }

  return (
    <div className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto animate-in-slide">
      <h1 className="text-4xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-8">
        Live Analytics Telemetry
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-primary/20"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Total Extracted Entities</p>
          <h2 className="text-5xl font-display font-bold mt-4 text-white glow-text relative z-10">{totalDetectedVehicles}</h2>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-destructive/20"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Peak Density Surge</p>
          <h2 className="text-5xl font-display font-bold mt-3 text-destructive relative z-10 text-shadow-[0_0_15px_rgba(255,50,50,0.5)]">
            {peakTrend ? `${peakTrend.vehicles}` : "0"}
          </h2>
          <p className="text-sm font-medium text-white/50 mt-2 relative z-10 tracking-wide">
            {peakTrend ? `Timestamp / ${peakTrend.time}` : "Awaiting Matrix Data"}
          </p>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-accent/20"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Critical Saturation Node</p>
          <h2 className="text-5xl font-display font-bold mt-3 text-white glow-violet relative z-10">
            {busiestLane ? busiestLane.lane : "N/A"}
          </h2>
          <p className="text-sm font-medium text-accent/70 mt-2 relative z-10 tracking-wide glow-violet">
            {busiestLane ? `${busiestLane.density}% local stress` : "Awaiting Matrix Data"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-8 border-white/5">
          <h2 className="text-xl font-display font-bold mb-6 text-white/90">Entity Classification Matrix</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={vehicleTypes}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                innerRadius={70}
                stroke="none"
                paddingAngle={5}
                label={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter' }}
              >
                {vehicleTypes.map((entry, index) => (
                  <Cell key={index} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}80)` }} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-8 border-white/5">
          <h2 className="text-xl font-display font-bold mb-6 text-white/90">Temporal Flow Frequency</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={hourlyCount}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="vehicles"
                name="Volume"
                stroke="hsl(180 100% 50%)"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(240 25% 4%)", stroke: "hsl(180 100% 50%)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "hsl(180 100% 50%)", stroke: "#fff", strokeWidth: 2 }}
                style={{ filter: "drop-shadow(0 0 10px rgba(0, 240, 255, 0.5))" }}
              />
              {peakTrend && (
                <ReferenceDot
                  x={peakTrend.time}
                  y={peakTrend.vehicles}
                  r={6}
                  fill="hsl(350 100% 60%)"
                  stroke="none"
                  label={{
                     value: "Peak Surge", 
                     position: "top", 
                     fill: "hsl(350 100% 60%)", 
                     fontSize: 10,
                     fontFamily: "Inter",
                     fontWeight: 600 
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Lane Density Comparison</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={laneDensity}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="lane" stroke="#888888" />
            <YAxis stroke="#888888" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            <Legend />
            <Bar dataKey="density" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-8 border-white/5 relative">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-white/5 relative z-10">
          <div>
            <h2 className="text-2xl font-display font-bold text-white/90">Historical Density Spectrum</h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium tracking-wide">Aggregated throughput vs network saturation peaks.</p>
          </div>
          <div className="flex gap-2 bg-background/50 backdrop-blur-md p-1 mt-4 sm:mt-0 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
               <button 
                 key={p} 
                 onClick={() => setReportPeriod(p)}
                 className={`px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all duration-300 ${reportPeriod === p ? "bg-primary/20 text-primary border border-primary/30 glow-green" : "text-muted-foreground hover:text-white/80 border border-transparent"}`}
               >
                 {p}
               </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={380} className="relative z-10">
          <ComposedChart data={reportData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(180 100% 50%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(180 100% 40%)" stopOpacity={0.2}/>
              </linearGradient>
              <filter id="glowAvg" x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur stdDeviation="4" result="blur" />
                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="report_date" 
              stroke="rgba(255,255,255,0.3)" 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
               stroke="rgba(255,255,255,0.3)" 
               tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
               axisLine={false}
               tickLine={false}
               dx={-10}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
              itemStyle={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}
              labelFormatter={(v) => new Date(v).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500 }} iconType="rect" />
            <Bar 
               dataKey="avg_vehicles" 
               name="Baseline Flow" 
               fill="url(#colorAvg)" 
               radius={[6, 6, 0, 0]}
               barSize={20}
               style={{ filter: "drop-shadow(0 0 10px rgba(0,255,255,0.3))" }}
            />
            <Line 
               type="monotone" 
               dataKey="peak_vehicles" 
               name="Max Surge Flow" 
               stroke="hsl(330 100% 60%)" 
               strokeWidth={3} 
               dot={{ r: 4, fill: "hsl(330 100% 60%)", strokeWidth: 0, style: { filter: "drop-shadow(0 0 5px hsl(330 100% 60%))" } }}
               activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-8 border-white/5">
        <h2 className="text-xl font-display font-bold mb-6 text-white/90 text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Vector Insight Log</h2>
        <div className="space-y-4">
          {insights.length > 0 ? (
            insights.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium tracking-wide hover:bg-primary/10 transition-colors shadow-[inset_0_0_10px_rgba(0,240,255,0.05)]"
              >
                <span className="text-primary mr-2">›</span> {item.insight}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-white/5 bg-background/50 p-4 text-sm font-medium text-white/50 text-center tracking-wide">
              Neural engine aggregating base flows...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}