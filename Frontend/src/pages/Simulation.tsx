import { useEffect, useMemo, useState, useRef } from "react";
import {
  getDashboardStats,
  getInsights,
  getLaneDensity,
  getHourlyCount,
  getSignals,
} from "../lib/api";
import { triggerEmergency as triggerEmergencyAPI } from "../lib/api";
import LaneMapper from "../components/LaneMapper";
import ErrorBoundary from "../components/ErrorBoundary";

type LaneDensityItem = {
  lane: string;
  density: number;
};

type TrendItem = {
  time: string;
  vehicles: number;
};

type InsightItem = {
  id: number;
  insight: string;
};

type DashboardData = {
  totalVehicles: number;
  density: number;
  alerts: number;
  vehicleTypes: {
    car: number;
    bike: number;
    bus: number;
    truck: number;
  };
  laneDensity: LaneDensityItem[];
  trafficTrend: TrendItem[];
  recommendedSignalTime: number;
  updatedAt: string | null;
  videoPath?: string | null;
};

type DashboardResponse = {
  success: boolean;
  data: DashboardData;
};

type GenericListResponse<T> = {
  success?: boolean;
  data?: T;
};

export default function Simulation() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [laneDensity, setLaneDensity] = useState<LaneDensityItem[]>([]);
  const [trafficTrend, setTrafficTrend] = useState<TrendItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [manualGreenTime, setManualGreenTime] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isSliderTouched = useRef(false);
  const [signalState, setSignalState] = useState<any>(null);
  const [emergencyActive, setEmergencyActive] = useState(false);

  const triggerEmergency = async () => {
    if (emergencyActive) return;
    setEmergencyActive(true);
    try {
      await triggerEmergencyAPI("l1", "trigger");
    } catch (e) {
      console.error(e);
    }
    // Auto-disable after trace completes
    setTimeout(async () => {
      setEmergencyActive(false);
      try {
        await triggerEmergencyAPI("l1", "clear");
      } catch (e) {}
    }, 5000);
  };

  const loadSimulationData = async () => {
    try {
      setError("");

      const [dashboardRes, laneRes, trendRes, insightRes, signalRes] = await Promise.all([
        getDashboardStats(),
        getLaneDensity(),
        getHourlyCount(),
        getInsights(),
        getSignals(1),
      ]);

      const dashboardResponse = dashboardRes as DashboardResponse;
      const laneResponse = laneRes as GenericListResponse<LaneDensityItem[]>;
      const trendResponse = trendRes as GenericListResponse<TrendItem[]>;
      const insightResponse = insightRes as GenericListResponse<InsightItem[]>;
      const signalData = (signalRes as any).data?.data || (signalRes as any).data;

      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboard(dashboardResponse.data);
        setSignalState(signalData);
        
        // Only update the slider if the user hasn't physically touched it recently
        // so it reflects the true global signal timing natively
        if (!isSliderTouched.current) {
           setManualGreenTime(signalData?.currentGreenTime || dashboardResponse.data.recommendedSignalTime || 60);
        }
      } else {
        setDashboard(null);
      }

      setLaneDensity(laneResponse.data || []);
      setTrafficTrend(trendResponse.data || []);
      setInsights(insightResponse.data || []);
    } catch (err) {
      console.error("Simulation load error:", err);
      setError("Failed to load simulation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSimulationData();

    const interval = setInterval(() => {
      loadSimulationData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const busiestLane = useMemo(() => {
    if (!laneDensity.length) return null;
    return [...laneDensity].sort((a, b) => b.density - a.density)[0];
  }, [laneDensity]);

  const avgTrendVehicles = useMemo(() => {
    if (!trafficTrend.length) return 0;
    const total = trafficTrend.reduce((sum, item) => sum + item.vehicles, 0);
    return Math.round(total / trafficTrend.length);
  }, [trafficTrend]);

  const estimatedWaitReduction = useMemo(() => {
    if (!dashboard) return 0;
    
    // Implement Webster's Delay Mathematical Formula
    const cycleLength = 120; 
    const densityPerc = dashboard.density || 50;
    const saturationRate = Math.min(densityPerc / 100, 0.95); // max mathematically bounded to 95%
    
    // Fixed Phase Delay (Base 30s green time)
    const fixedGreenRatio = 30 / cycleLength; 
    const fixedDelay = (cycleLength * Math.pow(1 - fixedGreenRatio, 2)) / (2 * (1 - saturationRate));
    
    // Adaptive Optimized Phase Delay (Evaluated from matrix testing)
    const adaptiveGreenRatio = manualGreenTime / cycleLength;
    const adaptiveDelay = (cycleLength * Math.pow(1 - adaptiveGreenRatio, 2)) / (2 * (1 - saturationRate));
    
    const secondsSavedPerCycle = fixedDelay - adaptiveDelay;
    const waitTimeReductionPerc = (secondsSavedPerCycle / fixedDelay) * 100;
    
    return Math.max(0, waitTimeReductionPerc).toFixed(1);
  }, [dashboard, manualGreenTime]);

  const estimatedFuelSaved = useMemo(() => {
    if (!dashboard) return 0;
    
    const cycleLength = 120; 
    const densityPerc = dashboard.density || 50;
    const saturationRate = Math.min(densityPerc / 100, 0.95);
    
    const fixedGreenRatio = 30 / cycleLength; 
    const fixedDelay = (cycleLength * Math.pow(1 - fixedGreenRatio, 2)) / (2 * (1 - saturationRate));
    
    const adaptiveGreenRatio = manualGreenTime / cycleLength;
    const adaptiveDelay = (cycleLength * Math.pow(1 - adaptiveGreenRatio, 2)) / (2 * (1 - saturationRate));
    
    const secondsSavedPerCycle = fixedDelay - adaptiveDelay;

    // 0.6 liters fuel per idling hour -> ~0.00016L per second saved per vehicle
    const baselineVehiclesPerDay = Math.max(dashboard.totalVehicles * 24, 1000); 
    const litersSaved = baselineVehiclesPerDay * Math.max(0, secondsSavedPerCycle) * (0.6 / 3600);
    return litersSaved.toFixed(1);
  }, [dashboard, manualGreenTime]);

  const estimatedWaitTime = useMemo(() => {
    if (!dashboard) return 0;

    // Linear conversion of density to base waiting line length
    const baseWait = dashboard.density * 1.1 + 15;
    const recommended = dashboard.recommendedSignalTime || 30;
    
    const diff = manualGreenTime - recommended;
    
    // A heavier linear wait time offset for higher physics fidelity
    const adjusted = baseWait - (diff * 0.75);
    return Math.max(10, Math.round(adjusted));
  }, [dashboard, manualGreenTime]);

  const visualSignals = useMemo(() => {
    const defaultSignals = { l1: "red", l2: "red", l3: "red", l4: "red" };
    if (!laneDensity.length) return signalState?.directions || defaultSignals;
    
    const sorted = [...laneDensity].sort((a, b) => b.density - a.density);
    const parseLaneId = (name: string) => {
        if (name.includes("1")) return "l1";
        if (name.includes("2")) return "l2";
        if (name.includes("3")) return "l3";
        if (name.includes("4")) return "l4";
        return "l1";
    };
    
    if (sorted.length > 0) {
        let mapping: any = {};
        sorted.forEach((ld, idx) => {
            const laneId = parseLaneId(ld.lane);
            if (ld.density === 0) mapping[laneId] = "red";
            else if (idx === 0) mapping[laneId] = "green";
            else if (idx === sorted.length - 1) mapping[laneId] = "red";
            else mapping[laneId] = "yellow";
        });
        
        return {
           l1: mapping["l1"] || "red",
           l2: mapping["l2"] || "red",
           l3: mapping["l3"] || "red",
           l4: mapping["l4"] || "red"
        };
    }
    
    return signalState?.directions || defaultSignals;
  }, [laneDensity, signalState]);

  if (loading) {
    return <div className="p-6 text-foreground">Loading simulation...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!dashboard) {
    return <div className="p-8 text-destructive font-display tracking-widest uppercase flex h-full items-center justify-center">No simulation core detected.</div>;
  }

  return (
    <ErrorBoundary>
      <div className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto animate-in-slide">
        <div>
        <h1 className="text-4xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2">
          Global Optimization Engine
        </h1>
        <p className="text-muted-foreground font-medium tracking-wide">
          Mathematical AI models forecasting localized matrix constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-primary/20"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Current Saturation</p>
          <h2 className="text-4xl font-display font-bold mt-3 text-white glow-text relative z-10">{dashboard.density}%</h2>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-accent/20"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Active Vector Time</p>
          <h2 className="text-4xl font-display font-bold mt-3 text-white glow-violet relative z-10">
            {signalState?.currentGreenTime || dashboard.recommendedSignalTime}s
          </h2>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-primary/20"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Flow Mean Offset</p>
          <h2 className="text-4xl font-display font-bold mt-3 text-white glow-text relative z-10">{avgTrendVehicles}</h2>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:bg-destructive/20"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest relative z-10">Critical Bottleneck</p>
          <h2 className="text-4xl font-display font-bold mt-3 text-white text-shadow-[0_0_15px_rgba(255,50,50,0.4)] relative z-10">
            {busiestLane ? busiestLane.lane : "N/A"}
          </h2>
        </div>
      </div>

      <div className="glass-card p-8 space-y-8 border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-display font-bold text-white/90">Signal Timing Matrix Sandbox</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1 tracking-wide">
              Adjust the heuristic threshold parameter below to recalculate anticipated wait distribution shifts globally.
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-center bg-background/30 backdrop-blur-md rounded-2xl p-6 border border-white/5 relative z-10">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
               <span>10s Floor</span>
               <span className="px-4 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-xl glow-green tracking-widest">
                 Testing Phase: {manualGreenTime}s
               </span>
               <span>120s Ceiling</span>
            </div>
            <input
              type="range"
              min={10}
              max={120}
              value={manualGreenTime}
              onChange={(e) => {
                isSliderTouched.current = true;
                setManualGreenTime(Number(e.target.value));
              }}
              className="w-full cursor-pointer appearance-none bg-white/10 h-2 rounded-full overflow-hidden outline-none outline-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(0,240,255,1)]"
            />
          </div>

          <div className="flex gap-4 w-full xl:w-auto">
            <div className="bg-background/40 border border-white/5 px-6 py-5 rounded-xl text-center min-w-[160px] flex-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wait Time Reduction</p>
              <p className="text-3xl font-display font-bold mt-2 text-primary glow-text">{estimatedWaitReduction}%</p>
            </div>
            <div className="bg-background/40 border-primary/20 px-6 py-5 rounded-xl text-center min-w-[160px] flex-1 transition-all duration-300">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Est. Fuel Saved</p>
              <p className="text-3xl font-display font-bold mt-2 text-primary glow-text">
                {estimatedFuelSaved}L
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[100px] -mr-40 -mt-40 transition-opacity duration-1000 pointer-events-none opacity-0 group-hover:opacity-100"></div>
        
        <div className="flex flex-col xl:flex-row gap-8 items-start relative z-10">
          <div className="flex-1 w-full space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-white/90">Emergency Responder Vector Matrix</h2>
              <p className="text-sm font-medium text-muted-foreground mt-1 tracking-wide">
                Simulate autonomous rerouting algorithms when a critical Priority-1 vehicle approaches gridlock.
              </p>
            </div>

            <div className="space-y-4 text-sm font-medium">
              <div className="bg-background/50 border border-white/5 rounded-xl p-4">
                <p className="text-muted-foreground mb-2 tracking-widest uppercase text-[10px]">Matrix Status</p>
                {emergencyActive ? (
                  <p className="text-destructive font-bold animate-pulse">CRITICAL OVERRIDE: Calculating bypass trajectory...</p>
                ) : (
                  <p className="text-primary glow-text">Monitoring baseline flow vectors.</p>
                )}
              </div>
            </div>

            <button
               onClick={triggerEmergency}
               disabled={emergencyActive}
               className={`w-full py-4 rounded-xl font-display font-bold tracking-widest uppercase transition-all duration-500 shadow-lg ${
                 emergencyActive 
                 ? "bg-destructive/20 text-destructive/50 border border-destructive/20 cursor-not-allowed" 
                 : "bg-destructive text-white hover:bg-destructive/90 border border-destructive/50 hover:shadow-[0_0_20px_rgba(255,50,50,0.6)]"
               }`}
            >
              {emergencyActive ? "Override Active" : "Deploy Emergency Vehicle"}
            </button>
          </div>

          <div className="w-full xl:w-[600px] h-[350px] bg-background/80 rounded-2xl border border-white/10 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] flex-shrink-0">
             {/* Map Grid Rendering - 4 Way Crossroad */}
             <svg width="100%" height="100%" viewBox="0 0 600 350" className="absolute inset-0">
               <defs>
                 <linearGradient id="neonRed" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" stopColor="hsl(0, 100%, 60%)" />
                   <stop offset="100%" stopColor="hsl(330, 100%, 60%)" />
                 </linearGradient>
                 <filter id="severeGlow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="6" result="blur" />
                   <feComposite in="SourceGraphic" in2="blur" operator="over" />
                 </filter>
                 <style>
                   {`
                     @keyframes drawLine {
                       to { stroke-dashoffset: 0; }
                     }
                   `}
                 </style>
               </defs>

               {/* City Blocks (Background Buildings - 4 corners) */}
               <rect x="0" y="0" width="250" height="125" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
               <rect x="350" y="0" width="250" height="125" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
               <rect x="0" y="225" width="250" height="125" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
               <rect x="350" y="225" width="250" height="125" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />

               {/* Main Avenues / Streets (The Crossroad) */}
               {/* Horizontal Street */}
               <path d="M 0 175 L 600 175" stroke="rgba(255,255,255,0.1)" strokeWidth="100" />
               <path d="M 0 175 L 250 175" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10 10" />
               <path d="M 350 175 L 600 175" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10 10" />

               {/* Vertical Street */}
               <path d="M 300 0 L 300 350" stroke="rgba(255,255,255,0.1)" strokeWidth="100" />
               <path d="M 300 0 L 300 125" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10 10" />
               <path d="M 300 225 L 300 350" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10 10" />

               {/* Traffic Lights (Nodes with bound colors) */}
               {/* L1 - North */}
               <g transform="translate(230, 110)">
                 <rect width="16" height="40" rx="4" fill="#222" />
                 <circle cx="8" cy="8" r="5" fill={visualSignals.l1 === "red" ? "red" : "#222"} />
                 <circle cx="8" cy="20" r="5" fill={visualSignals.l1 === "yellow" ? "yellow" : "#222"} />
                 <circle cx="8" cy="32" r="5" fill={visualSignals.l1 === "green" ? "lime" : "#222"} />
                 <text x="-20" y="25" fill="white" fontSize="12" fontWeight="bold">L1</text>
               </g>

               {/* L2 - South */}
               <g transform="translate(354, 200)">
                 <rect width="16" height="40" rx="4" fill="#222" />
                 <circle cx="8" cy="8" r="5" fill={visualSignals.l2 === "red" ? "red" : "#222"} />
                 <circle cx="8" cy="20" r="5" fill={visualSignals.l2 === "yellow" ? "yellow" : "#222"} />
                 <circle cx="8" cy="32" r="5" fill={visualSignals.l2 === "green" ? "lime" : "#222"} />
                 <text x="25" y="25" fill="white" fontSize="12" fontWeight="bold">L2</text>
               </g>

               {/* L3 - East (Right side) */}
               <g transform="translate(360, 100)">
                 <rect width="40" height="16" rx="4" fill="#222" />
                 <circle cx="8" cy="8" r="5" fill={visualSignals.l3 === "red" ? "red" : "#222"} />
                 <circle cx="20" cy="8" r="5" fill={visualSignals.l3 === "yellow" ? "yellow" : "#222"} />
                 <circle cx="32" cy="8" r="5" fill={visualSignals.l3 === "green" ? "lime" : "#222"} />
                 <text x="12" y="-10" fill="white" fontSize="12" fontWeight="bold">L3</text>
               </g>

               {/* L4 - West (Left side) */}
               <g transform="translate(200, 234)">
                 <rect width="40" height="16" rx="4" fill="#222" />
                 <circle cx="32" cy="8" r="5" fill={visualSignals.l4 === "red" ? "red" : "#222"} />
                 <circle cx="20" cy="8" r="5" fill={visualSignals.l4 === "yellow" ? "yellow" : "#222"} />
                 <circle cx="8" cy="8" r="5" fill={visualSignals.l4 === "green" ? "lime" : "#222"} />
                 <text x="12" y="32" fill="white" fontSize="12" fontWeight="bold">L4</text>
               </g>

               {/* LANE GREEN COLOR MOVING ANIMATION */}
               {visualSignals.l1 === "green" && (
                 <circle cx="325" cy="0" r="3" fill="lime" filter="url(#severeGlow)">
                   <animateMotion dur="2s" repeatCount="indefinite" path="M 0 -50 L 0 400" />
                 </circle>
               )}
               {visualSignals.l2 === "green" && (
                 <circle cx="275" cy="350" r="3" fill="lime" filter="url(#severeGlow)">
                   <animateMotion dur="2s" repeatCount="indefinite" path="M 0 50 L 0 -400" />
                 </circle>
               )}
               {visualSignals.l3 === "green" && (
                 <circle cx="600" cy="150" r="3" fill="lime" filter="url(#severeGlow)">
                   <animateMotion dur="2s" repeatCount="indefinite" path="M 50 0 L -650 0" />
                 </circle>
               )}
               {visualSignals.l4 === "green" && (
                 <circle cx="0" cy="200" r="3" fill="lime" filter="url(#severeGlow)">
                   <animateMotion dur="2s" repeatCount="indefinite" path="M -50 0 L 650 0" />
                 </circle>
               )}

               {/* THE EMERGENCY TRACE */}
               {emergencyActive && (
                 <path 
                   d="M 280 -50 L 280 400" 
                   stroke="url(#neonRed)" 
                   strokeWidth="6" 
                   strokeLinecap="round"
                   fill="none"
                   style={{
                     filter: "url(#severeGlow)",
                     strokeDasharray: "450",
                     strokeDashoffset: "450",
                     animation: "drawLine 3s ease-in-out forwards"
                   }}
                 />
               )}
               {emergencyActive && (
                 <circle cx="0" cy="0" r="8" fill="#fff" filter="url(#severeGlow)">
                   <animateMotion dur="3s" fill="freeze" path="M 280 -50 L 280 400" />
                 </circle>
               )}
             </svg>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 border-white/5">
        <h2 className="text-xl font-display font-bold mb-6 text-white/90">Vector Density Mapping</h2>

        <div className="space-y-6">
          {laneDensity.map((lane, index) => (
            <div key={index} className="group">
              <div className="flex items-center justify-between text-sm mb-2 font-medium">
                <span className="text-white/80 tracking-wide">{lane.lane}</span>
                <span className="text-accent glow-violet tracking-wider">{lane.density}% mass</span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${lane.density}%`,
                    background: `linear-gradient(90deg, hsl(var(--accent)/0.5) 0%, hsl(var(--accent)) 100%)`, 
                    boxShadow: `0 0 10px hsl(var(--accent)/0.5)`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="glass-card p-8 border-white/5">
          <h2 className="text-xl font-display font-bold mb-6 text-white/90">Execution Summary</h2>

          <div className="space-y-4 text-sm text-foreground/80 font-medium tracking-wide">
            <div className="rounded-xl border border-white/5 bg-background/50 p-4 transition-colors hover:bg-white/5">
              Current network density registers at <span className="font-display font-bold text-accent glow-violet">{dashboard.density}%</span> of theoretical max flow.
            </div>

            <div className="rounded-xl border border-white/5 bg-background/50 p-4 transition-colors hover:bg-white/5">
              {busiestLane
                ? `Sector ${busiestLane.lane} is experiencing critical bottlenecking at ${busiestLane.density}% local density.`
                : "Awaiting sector flow data."}
            </div>

            <div className="rounded-xl border border-white/5 bg-background/50 p-4 transition-colors hover:bg-white/5">
              Adaptive Neural Engine mathematically dictates <span className="font-display font-bold text-primary glow-text">{dashboard.recommendedSignalTime}s</span> heuristic for optimal phase clearing based on vector tracking and queue depths.
            </div>

            <div className="rounded-xl border border-white/5 bg-background/50 p-4 transition-colors hover:bg-white/5">
              Manual offset parameter test at <span className="font-display font-bold text-white">{manualGreenTime}s</span> anticipates a theoretical wait reduction of <span className="font-display font-bold text-primary">{estimatedWaitReduction}%</span> and saves {" "}
              <span className="font-display font-bold text-primary">
                {estimatedFuelSaved} Liters
              </span> of global fuel per day.
            </div>
          </div>
        </div>

        <div className="glass-card p-8 border-white/5">
          <h2 className="text-xl font-display font-bold mb-6 text-white/90 text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Heuristic Inference Logs</h2>

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
                Neural heuristics currently establishing baseline matrix...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render the interactive Lane Mapper vector tool */}
      <div className="mt-8">
         <LaneMapper cameraId={1} cameraUrl="rtsp://junction-alpha/primary-feed" />
      </div>

    </div>
    </ErrorBoundary>
  );
}
