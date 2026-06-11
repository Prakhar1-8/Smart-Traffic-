import { useEffect, useMemo, useState } from "react";
import { getSignals, updateSignalMode, updateSignalTiming, updateSignal } from "../lib/api";
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

type Direction = "l1" | "l2" | "l3" | "l4";
type LightColor = "red" | "yellow" | "green";
type SignalMode = "auto" | "manual";

interface SignalState {
  mode: SignalMode;
  currentGreenTime: number;
  recommendedGreenTime: number;
  manualOverride: boolean;
  junctionId: number;
  directions: Record<Direction, LightColor>;
}

const initialSignalState: SignalState = {
  mode: "auto",
  currentGreenTime: 30,
  recommendedGreenTime: 30,
  manualOverride: false,
  junctionId: 1,
  directions: {
    l1: "red",
    l2: "red",
    l3: "red",
    l4: "red",
  },
};

export default function Signals() {
  const isDataAvailable = localStorage.getItem("isDataAvailable") === "true";
  const [signalState, setSignalState] = useState<SignalState>(initialSignalState);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [manualTime, setManualTime] = useState<number>(30);

  const loadSignals = async () => {
    try {
      const res = await getSignals(1);
      const data = res.data.data || res.data;

      setSignalState(data);
      setManualTime(data.currentGreenTime ?? 30);
    } catch (err) {
      console.error("Signals fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDataAvailable) return;
    loadSignals();

    const interval = setInterval(() => {
      loadSignals();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleModeChange = async (mode: SignalMode) => {
    try {
      setActionLoading(`mode-${mode}`);
      const res = await updateSignalMode(1, mode);
      const data = res.data.data || res.data;
      setSignalState(data);
      setManualTime(data.currentGreenTime ?? 30);
    } catch (err) {
      console.error("Signal mode update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTimingUpdate = async () => {
    try {
      setActionLoading("timing");
      const res = await updateSignalTiming(1, Number(manualTime));
      const data = res.data.data || res.data;
      setSignalState(data);
    } catch (err) {
      console.error("Signal timing update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDirectionChange = async (direction: Direction, color: LightColor) => {
    try {
      setActionLoading(`${direction}-${color}`);
      const res = await updateSignal(1, direction, color);
      const data = res.data.data || res.data;
      setSignalState(data);
    } catch (err) {
      console.error("Signal update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusText = useMemo(() => {
    if (signalState.mode === "auto") {
      return "System is using AI-recommended signal timing.";
    }
    return "Manual override is active. Operator controls are enabled.";
  }, [signalState.mode]);

  const renderSignal = (direction: Direction) => {
    const active = signalState.directions[direction];

    return (
      <div className="p-6 rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/5 shadow-[inset_0_0_15px_rgba(0,229,255,0.05)] relative group/signal transition-all duration-300 hover:bg-[#00e5ff]/10">
        <div className="absolute inset-2 border border-[#00e5ff]/10 pointer-events-none z-10"></div>
        <h3 className="text-sm font-['Space_Grotesk'] font-bold uppercase tracking-widest mb-6 text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
          Node_ID: {direction}
        </h3>

        <div className="flex gap-3 mb-6 flex-wrap relative z-20">
          {(["red", "yellow", "green"] as LightColor[]).map((color) => {
             const isRed = color === "red";
             const isYellow = color === "yellow";
             const isGreen = color === "green";
             
             let activeColorClass = "";
             if (active === color) {
                if (isRed) activeColorClass = "border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
                if (isYellow) activeColorClass = "border-yellow-400 bg-yellow-400/20 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.5)]";
                if (isGreen) activeColorClass = "border-[#00e5ff] bg-[#00e5ff]/20 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.5)]";
             } else {
                activeColorClass = "border-white/10 bg-black/40 text-white/40 hover:border-white/30";
             }

             return (
              <button
                key={color}
                onClick={() => handleDirectionChange(direction, color)}
                disabled={signalState.mode !== "manual" || actionLoading !== null}
                className={`px-6 py-2 rounded border uppercase text-[10px] font-bold tracking-widest disabled:opacity-30 transition-all duration-300 font-['Inter'] ${activeColorClass}`}
              >
                {color}
              </button>
             );
          })}
        </div>

        <p className="text-[10px] font-['Inter'] tracking-widest uppercase text-white/50">
          State Matrix:{" "}
          <span className={`font-['Space_Grotesk'] font-bold ${active === 'red' ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' : active === 'yellow' ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]'}`}>
             {active}
          </span>
        </p>
      </div>
    );
  };

  if (!isDataAvailable) {
    return <EmptyState />;
  }

  if (loading) {
    return <div className="p-6 text-[#00e5ff] font-['Space_Grotesk'] tracking-widest uppercase text-xs animate-pulse">Initializing Signal Matrix...</div>;
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
        <h1 className="text-4xl font-['Space_Grotesk'] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white/60 mb-2 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
          SIGNAL CONTROL
        </h1>
        <p className="text-xs font-['Inter'] text-white/50 tracking-widest uppercase drop-shadow-sm">{statusText}</p>
      </motion.div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[#00e5ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#00e5ff]/70 uppercase tracking-widest">Signal Mode</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] uppercase">{signalState.mode}</h2>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e9b3ff]/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[#e9b3ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#e9b3ff]/70 uppercase tracking-widest">Active Green Protocol</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(233,179,255,0.5)]">{signalState.currentGreenTime}s</h2>
        </TiltCard></motion.div>

        <motion.div variants={itemVariants} className="h-full"><TiltCard>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[#00e5ff]/20 pointer-events-none"></div>
          <p className="text-xs font-['Inter'] font-semibold text-[#00e5ff]/70 uppercase tracking-widest">AI Recommended Delta</p>
          <h2 className="text-5xl font-['Space_Grotesk'] font-bold mt-4 text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            {signalState.recommendedGreenTime}s
          </h2>
        </TiltCard></motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* MODE CONTROL */}
        <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden h-full">
          <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
             <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e5ff]/40"></div>
          </div>
          <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">System Override Protocol</h2>

          <div className="flex gap-4 flex-wrap relative z-20">
            <button
              onClick={() => handleModeChange("auto")}
              disabled={actionLoading !== null}
              className={`px-6 py-3 rounded border text-[10px] uppercase font-bold tracking-widest disabled:opacity-30 transition-all duration-300 font-['Inter'] ${
                signalState.mode === "auto"
                  ? "border-[#00e5ff] bg-[#00e5ff]/20 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/30"
              }`}
            >
              {actionLoading === "mode-auto" ? "CALCULATING..." : "NEURAL_AUTO"}
            </button>

            <button
              onClick={() => handleModeChange("manual")}
              disabled={actionLoading !== null}
              className={`px-6 py-3 rounded border text-[10px] uppercase font-bold tracking-widest disabled:opacity-30 transition-all duration-300 font-['Inter'] ${
                signalState.mode === "manual"
                  ? "border-[#e9b3ff] bg-[#e9b3ff]/20 text-[#e9b3ff] shadow-[0_0_15px_rgba(233,179,255,0.3)]"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/30"
              }`}
            >
              {actionLoading === "mode-manual" ? "BYPASSING..." : "MANUAL_OVERRIDE"}
            </button>
          </div>
        </motion.div>

        {/* MANUAL TIMING */}
        <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden h-full">
          <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
             <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e5ff]/40"></div>
          </div>
          <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Manual Timing Parameters</h2>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center relative z-20">
            <input
              type="number"
              min={10}
              max={120}
              value={manualTime}
              onChange={(e) => setManualTime(Number(e.target.value))}
              disabled={signalState.mode !== "manual" || actionLoading !== null}
              className="w-full sm:w-40 rounded border border-[#00e5ff]/30 bg-[#0c1324] px-4 py-3 text-white font-['Space_Grotesk'] font-bold outline-none disabled:opacity-30 focus:border-[#00e5ff] focus:shadow-[0_0_10px_rgba(0,229,255,0.2)] transition-all"
            />

            <button
              onClick={handleTimingUpdate}
              disabled={signalState.mode !== "manual" || actionLoading !== null}
              className="px-6 py-3 rounded border border-[#00e5ff] bg-[#00e5ff]/20 text-[#00e5ff] disabled:opacity-30 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30 text-[10px] uppercase font-bold tracking-widest transition-all duration-300 font-['Inter'] hover:bg-[#00e5ff]/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
            >
              {actionLoading === "timing" ? "UPLOADING..." : "EXECUTE TIMING"}
            </button>
          </div>

          <p className="text-[10px] text-white/40 mt-4 tracking-widest uppercase font-['Inter']">
            Parameters locked between 10s and 120s limit.
          </p>
        </motion.div>
      </div>

      {/* DIRECTION CONTROLS */}
      <motion.div variants={itemVariants} className="bg-slate-950/40 backdrop-blur-xl border border-[#00e5ff]/20 p-8 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden z-10">
        <div className="absolute inset-2 border border-[#00e5ff]/5 pointer-events-none z-10">
             <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00e5ff]/40"></div>
             <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00e5ff]/40"></div>
        </div>
        <h2 className="text-sm font-['Space_Grotesk'] font-bold mb-6 tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Node Distribution Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20">
          {renderSignal("l1")}
          {renderSignal("l2")}
          {renderSignal("l3")}
          {renderSignal("l4")}
        </div>
      </motion.div>
    </motion.div>
  );
}