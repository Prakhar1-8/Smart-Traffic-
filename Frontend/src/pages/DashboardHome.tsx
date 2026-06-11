import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Activity, RefreshCw } from "lucide-react";
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
      {/* Corner Brackets */}
      <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e5ff]/40"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e5ff]/40"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00e5ff]/40"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00e5ff]/40"></div>
      </div>
      
      {/* Scanning Line overlay */}
      <div className="absolute top-0 left-0 w-full h-[200%] pointer-events-none bg-gradient-to-b from-transparent via-[#00e5ff]/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[scan_3s_linear_infinite] z-0"></div>

      <div style={{ transform: "translateZ(30px)" }} className="relative z-20 h-full p-6 flex flex-col justify-between">
         {children}
      </div>
    </motion.div>
  );
};

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
  const [isDataAvailable, setIsDataAvailable] = useState<boolean>(() => {
    return localStorage.getItem("isDataAvailable") === "true";
  });

  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    density: 0,
    alerts: 0,
    vehicleTypes: { car: 0, bike: 0, bus: 0, truck: 0 },
    laneDensity: [],
    trafficTrend: [],
    recommendedSignalTime: 30,
    updatedAt: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardStats = async () => {
    if (!isDataAvailable) return;
    
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
    // We only poll if data is available
    if (!isDataAvailable) return;
    
    setLoading(true);
    fetchDashboardStats();

    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [isDataAvailable]);

  const handleResetSession = () => {
    localStorage.removeItem("isDataAvailable");
    setIsDataAvailable(false);
    setStats({
      totalVehicles: 0,
      density: 0,
      alerts: 0,
      vehicleTypes: { car: 0, bike: 0, bus: 0, truck: 0 },
      laneDensity: [],
      trafficTrend: [],
      recommendedSignalTime: 30,
      updatedAt: null,
    });
  };

  if (!isDataAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center animate-in fade-in duration-700">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full glass-card p-10 flex flex-col items-center space-y-6 border border-white/5 bg-background-secondary/30 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-2xl relative z-10">
            <Activity className="w-10 h-10 text-muted-foreground" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl font-display font-bold tracking-tight text-white">No Traffic Data Available</h2>
            <p className="text-muted-foreground text-sm">Upload a video or connect a live feed to initialize the AI analysis engine.</p>
          </div>
          
          <Link to="/upload-video" className="w-full relative z-10">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold tracking-wide uppercase text-sm flex items-center justify-center gap-2 transition-colors glow-green shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            >
              <Upload className="w-4 h-4" />
              Upload Traffic Video
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading && !stats.updatedAt) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-muted-foreground animate-pulse font-medium tracking-widest uppercase text-sm">Synchronizing Data Streams...</p>
    </div>
  );
  
  if (error) return <div className="p-6 text-destructive font-bold">{error}</div>;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto relative overflow-hidden bg-[#0c1324] min-h-[calc(100vh-4rem)]"
    >
      <style>{`
        @keyframes scan {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0%); }
        }
        .grid-bg {
            background-size: 40px 40px;
            background-image: linear-gradient(to right, rgba(0, 229, 255, 0.05) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(0, 229, 255, 0.05) 1px, transparent 1px);
        }
      `}</style>
      
      {/* Background Grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30"></div>

      <motion.div variants={itemVariants} className="flex items-end justify-between mb-10 relative z-10">
        <div>
          <h1 className="text-4xl font-['Space_Grotesk'] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white/60 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
            SYSTEM OVERVIEW
          </h1>
          <p className="text-muted-foreground mt-2 font-['Inter'] font-medium tracking-widest uppercase text-xs">Live tracking and analytics aggregation.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleResetSession}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-[#00e5ff] bg-slate-950/40 hover:bg-[#00e5ff]/10 border border-[#00e5ff]/20 rounded transition-colors shadow-[0_0_10px_rgba(0,229,255,0.1)]"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Session
          </button>
          <div className="text-[10px] font-bold text-[#00e5ff] px-4 py-2 rounded border border-[#00e5ff]/40 bg-[#00e5ff]/10 backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.2)] tracking-widest uppercase">
            {stats.updatedAt ? "LIVE STREAM ACTIVE" : "AWAITING DATA"}
          </div>
        </div>
      </motion.div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-[#00e5ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#00e5ff]/70 uppercase tracking-widest">Total Vehicles</p>
          <h2 className="text-6xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">{stats.totalVehicles}</h2>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#e9b3ff]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-[#e9b3ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#e9b3ff]/70 uppercase tracking-widest">Global Density</p>
          <h2 className="text-6xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(233,179,255,0.5)]">{stats.density}<span className="text-3xl text-white/50 ml-1">%</span></h2>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard className="border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-red-500/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-red-400/70 uppercase tracking-widest">Critical Alerts</p>
          <h2 className="text-6xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">{stats.alerts}</h2>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-[#00e5ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#00e5ff]/70 uppercase tracking-widest">Rec. Signal Time</p>
          <h2 className="text-6xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">{stats.recommendedSignalTime}<span className="text-3xl text-white/50 ml-1">s</span></h2>
        </TiltCard></motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-10">
        {/* VEHICLE TYPES */}
        <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 xl:col-span-1 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden group">
          <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
             <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e5ff]/40"></div>
             <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e5ff]/40"></div>
          </div>
          <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Entity Classification</h2>
          <div className="space-y-4">
            {Object.entries(stats.vehicleTypes).map(([type, count]) => (
               <div key={type} className="flex justify-between items-center group/item border-b border-[#00e5ff]/10 pb-2">
                 <span className="uppercase text-xs tracking-widest text-white/60 font-['Inter']">{type}</span>
                 <span className="font-['Space_Grotesk'] font-bold text-2xl group-hover/item:text-[#00e5ff] transition-colors drop-shadow-[0_0_5px_rgba(0,229,255,0.2)]">{count}</span>
               </div>
            ))}
          </div>
        </motion.div>

        {/* LANE DENSITY */}
        <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 xl:col-span-2 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden">
          <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
             <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e5ff]/40"></div>
             <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00e5ff]/40"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#00e5ff]/5 blur-[100px] pointer-events-none"></div>
          
          <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)] relative z-10">Vector Density Mapping</h2>

          <div className="space-y-6 relative z-10">
            {stats.laneDensity.map((lane, i) => (
              <div key={i} className="group cursor-default">
                <div className="flex justify-between mb-2">
                  <span className="font-['Inter'] text-xs uppercase tracking-widest text-white/60">{lane.lane}</span>
                  <span className="font-['Space_Grotesk'] font-bold text-[#e9b3ff] drop-shadow-[0_0_8px_rgba(233,179,255,0.5)]">{lane.density}%</span>
                </div>
                <div className="w-full bg-[#00e5ff]/10 h-2 rounded-full overflow-hidden border border-[#00e5ff]/20">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out flex group-hover:opacity-100"
                    style={{ 
                       width: `${lane.density}%`,
                       background: `linear-gradient(90deg, rgba(233,179,255,0.5) 0%, rgba(233,179,255,1) 100%)`, 
                       boxShadow: `0 0 10px rgba(233,179,255,0.5)`
                     }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* TRAFFIC TREND */}
      <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative z-10">
        <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
           <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00e5ff]/40"></div>
           <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00e5ff]/40"></div>
        </div>
        <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Temporal Flow Matrix</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.trafficTrend.map((item, i) => (
            <div key={i} className="bg-[#00e5ff]/5 border border-[#00e5ff]/20 p-4 text-center rounded hover:bg-[#00e5ff]/10 transition-colors group shadow-[inset_0_0_10px_rgba(0,229,255,0.05)]">
              <div className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-2 font-['Inter']">{item.time}</div>
              <div className="text-3xl font-['Space_Grotesk'] font-bold group-hover:text-[#00e5ff] transition-colors drop-shadow-[0_0_5px_rgba(0,229,255,0.3)]">{item.vehicles}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* LAST UPDATED */}
      <motion.div variants={itemVariants} className="text-xs text-white/40 font-['Inter'] tracking-widest text-right relative z-10 uppercase">
        System Sync:{" "}
        <span className="text-[#00e5ff]/80">
          {stats.updatedAt
            ? new Date(stats.updatedAt).toLocaleString()
            : "N/A"}
        </span>
      </motion.div>
    </motion.div>
  );
}