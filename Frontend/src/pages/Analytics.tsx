import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
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
  const isDataAvailable = localStorage.getItem("isDataAvailable") === "true";
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
    if (!isDataAvailable) return;

    loadAnalytics();

    const interval = setInterval(() => {
      loadAnalytics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDataAvailable) return;
    loadReports(reportPeriod);
  }, [reportPeriod, isDataAvailable]);

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

  if (!isDataAvailable) {
    return <EmptyState />;
  }

  if (loading) {
    return <div className="p-6 text-foreground">Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">{error}</div>;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto relative overflow-hidden bg-[#0c1324] min-h-[calc(100vh-4rem)]"
    >
      <div className="absolute inset-0 grid-bg pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30"></div>

      <motion.div variants={itemVariants} className="relative z-10">
        <h1 className="text-4xl font-['Space_Grotesk'] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white/60 mb-8 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
          ANALYTICS TELEMETRY
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[#00e5ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#00e5ff]/70 uppercase tracking-widest">Total Extracted Entities</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">{totalDetectedVehicles}</h2>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard className="border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-red-500/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-red-400/70 uppercase tracking-widest">Peak Density Surge</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-3 text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">
            {peakTrend ? `${peakTrend.vehicles}` : "0"}
          </h2>
          <p className="text-xs font-['Inter'] font-medium text-white/50 mt-2 tracking-widest uppercase">
            {peakTrend ? `Timestamp / ${peakTrend.time}` : "Awaiting Matrix Data"}
          </p>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e9b3ff]/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[#e9b3ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#e9b3ff]/70 uppercase tracking-widest">Critical Saturation Node</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-3 text-white drop-shadow-[0_0_15px_rgba(233,179,255,0.5)]">
            {busiestLane ? busiestLane.lane : "N/A"}
          </h2>
          <p className="text-xs font-['Inter'] font-medium text-[#e9b3ff]/70 mt-2 tracking-widest uppercase">
            {busiestLane ? `${busiestLane.density}% local stress` : "Awaiting Matrix Data"}
          </p>
        </TiltCard></motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden">
          <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
             <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e5ff]/40"></div>
          </div>
          <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Entity Classification Matrix</h2>
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
                contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '8px', color: '#fff' }} 
                itemStyle={{ color: '#fff', fontFamily: 'Space Grotesk' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'Inter', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden">
          <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
             <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e5ff]/40"></div>
          </div>
          <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Temporal Flow Frequency</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={hourlyCount}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.1)" vertical={false} />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '8px', color: '#fff' }} 
                itemStyle={{ fontFamily: 'Space Grotesk', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontFamily: 'Inter', fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="vehicles"
                name="Volume"
                stroke="#00e5ff"
                strokeWidth={3}
                dot={{ r: 4, fill: "#020617", stroke: "#00e5ff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#00e5ff", stroke: "#fff", strokeWidth: 2 }}
                style={{ filter: "drop-shadow(0 0 10px rgba(0, 229, 255, 0.5))" }}
              />
              {peakTrend && (
                <ReferenceDot
                  x={peakTrend.time}
                  y={peakTrend.vehicles}
                  r={6}
                  fill="#ef4444"
                  stroke="none"
                  label={{
                     value: "SURGE", 
                     position: "top", 
                     fill: "#ef4444", 
                     fontSize: 10,
                     fontFamily: "Space Grotesk",
                     fontWeight: 700 
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative z-10 overflow-hidden">
        <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Lane Density Comparison</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={laneDensity}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.1)" vertical={false} />
            <XAxis dataKey="lane" stroke="rgba(255,255,255,0.4)" tick={{ fontFamily: 'Inter', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontFamily: 'Inter', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', border: '1px solid rgba(0,229,255,0.2)' }} itemStyle={{ fontFamily: 'Space Grotesk', color: '#00e5ff' }} />
            <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '12px' }} />
            <Bar dataKey="density" fill="#00e5ff" radius={[4, 4, 0, 0]} style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.4))" }} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden z-10">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#00e5ff]/5 to-transparent pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-[#00e5ff]/10 relative z-10">
          <div>
            <h2 className="text-sm font-['Space_Grotesk'] font-bold tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Historical Density Spectrum</h2>
            <p className="text-xs text-white/50 mt-1 font-['Inter'] tracking-widest uppercase">Aggregated throughput vs network saturation peaks.</p>
          </div>
          <div className="flex gap-2 bg-[#0c1324]/80 backdrop-blur-md p-1 mt-4 sm:mt-0 rounded border border-[#00e5ff]/20 shadow-[inset_0_0_10px_rgba(0,229,255,0.1)]">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
               <button 
                 key={p} 
                 onClick={() => setReportPeriod(p)}
                 className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded transition-all duration-300 ${reportPeriod === p ? "bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 shadow-[0_0_10px_rgba(0,229,255,0.2)]" : "text-muted-foreground hover:text-white/80 border border-transparent"}`}
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
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="report_date" 
              stroke="rgba(255,255,255,0.3)" 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter' }}
              tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
               stroke="rgba(255,255,255,0.3)" 
               tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter' }}
               axisLine={false}
               tickLine={false}
               dx={-10}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Space Grotesk' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontFamily: 'Inter' }}
              labelFormatter={(v) => new Date(v).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontFamily: 'Inter' }} iconType="rect" />
            <Bar 
               dataKey="avg_vehicles" 
               name="Baseline Flow" 
               fill="url(#colorAvg)" 
               radius={[4, 4, 0, 0]}
               barSize={20}
               style={{ filter: "drop-shadow(0 0 10px rgba(0,229,255,0.2))" }}
            />
            <Line 
               type="monotone" 
               dataKey="peak_vehicles" 
               name="Max Surge Flow" 
               stroke="#e9b3ff" 
               strokeWidth={3} 
               dot={{ r: 4, fill: "#e9b3ff", strokeWidth: 0, style: { filter: "drop-shadow(0 0 5px #e9b3ff)" } }}
               activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative z-10">
        <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Vector Insight Log</h2>
        <div className="space-y-4">
          {insights.length > 0 ? (
            insights.map((item) => (
              <div
                key={item.id}
                className="rounded border border-[#00e5ff]/20 bg-[#00e5ff]/5 p-4 text-xs font-['Inter'] tracking-widest uppercase hover:bg-[#00e5ff]/10 transition-colors shadow-[inset_0_0_10px_rgba(0,229,255,0.05)] text-white/80"
              >
                <span className="text-[#00e5ff] mr-2 font-bold font-['Space_Grotesk']">›</span> {item.insight}
              </div>
            ))
          ) : (
            <div className="rounded border border-white/5 bg-background/50 p-4 text-xs font-['Inter'] tracking-widest text-white/50 text-center uppercase">
              Neural engine aggregating base flows...
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}