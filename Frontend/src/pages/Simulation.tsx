import { useEffect, useMemo, useState } from "react";
import {
  getDashboardStats,
  getInsights,
  getLaneDensity,
  getHourlyCount,
} from "../lib/api";

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

  const loadSimulationData = async () => {
    try {
      setError("");

      const [dashboardRes, laneRes, trendRes, insightRes] = await Promise.all([
        getDashboardStats(),
        getLaneDensity(),
        getHourlyCount(),
        getInsights(),
      ]);

      const dashboardResponse = dashboardRes as DashboardResponse;
      const laneResponse = laneRes as GenericListResponse<LaneDensityItem[]>;
      const trendResponse = trendRes as GenericListResponse<TrendItem[]>;
      const insightResponse = insightRes as GenericListResponse<InsightItem[]>;

      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboard(dashboardResponse.data);
        setManualGreenTime(dashboardResponse.data.recommendedSignalTime || 60);
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

  const estimatedCongestionChange = useMemo(() => {
    if (!dashboard) return 0;

    const recommended = dashboard.recommendedSignalTime || 30;
    const diff = manualGreenTime - recommended;

    if (diff >= 15) return -12;
    if (diff >= 5) return -6;
    if (diff <= -15) return 14;
    if (diff <= -5) return 7;
    return 0;
  }, [dashboard, manualGreenTime]);

  const estimatedWaitTime = useMemo(() => {
    if (!dashboard) return 0;

    const baseWait =
      dashboard.density >= 90
        ? 95
        : dashboard.density >= 75
        ? 70
        : dashboard.density >= 50
        ? 45
        : 25;

    const adjusted = baseWait - Math.max(0, manualGreenTime - 30) * 0.8;
    return Math.max(15, Math.round(adjusted));
  }, [dashboard, manualGreenTime]);

  if (loading) {
    return <div className="p-6 text-white">Loading simulation...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!dashboard) {
    return <div className="p-6 text-red-500">No simulation data available</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Traffic Simulation</h1>
        <p className="text-sm text-white/60 mt-1">
          AI-extracted traffic data based decision simulation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Current Density</p>
          <h2 className="text-3xl font-bold mt-2">{dashboard.density}%</h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Recommended Green Time</p>
          <h2 className="text-3xl font-bold mt-2">
            {dashboard.recommendedSignalTime}s
          </h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Average Vehicles</p>
          <h2 className="text-3xl font-bold mt-2">{avgTrendVehicles}</h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Busiest Lane</p>
          <h2 className="text-3xl font-bold mt-2">
            {busiestLane ? busiestLane.lane : "N/A"}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-5 space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Signal Timing Simulation</h2>
          <p className="text-sm text-white/60 mt-1">
            Test how changing green timing may affect congestion and average wait time
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="w-full md:w-72">
            <label className="block text-sm text-white/70 mb-2">
              Test Green Time: {manualGreenTime}s
            </label>
            <input
              type="range"
              min={10}
              max={120}
              value={manualGreenTime}
              onChange={(e) => setManualGreenTime(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm text-white/70">Estimated Wait Time</p>
            <p className="text-2xl font-bold">{estimatedWaitTime}s</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm text-white/70">Estimated Congestion Impact</p>
            <p className="text-2xl font-bold">
              {estimatedCongestionChange > 0 ? "+" : ""}
              {estimatedCongestionChange}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
            <p className="text-sm text-cyan-200">Current AI Recommendation</p>
            <p className="text-2xl font-bold mt-2">
              {dashboard.recommendedSignalTime}s
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">Simulation Input</p>
            <p className="text-2xl font-bold mt-2">{manualGreenTime}s</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">System Status</p>
            <p className="text-2xl font-bold mt-2">
              {dashboard.density >= 75 ? "High Load" : "Stable"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-xl font-semibold mb-4">Lane Impact View</h2>

        <div className="space-y-4">
          {laneDensity.map((lane, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{lane.lane}</span>
                <span>{lane.density}% density</span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-cyan-400 h-3 rounded-full"
                  style={{ width: `${lane.density}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-xl font-semibold mb-4">Simulation Summary</h2>

          <div className="space-y-3 text-sm text-white/80">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              Current traffic density is <span className="font-semibold">{dashboard.density}%</span>.
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              {busiestLane
                ? `${busiestLane.lane} is currently the busiest lane at ${busiestLane.density}% density.`
                : "No lane data available."}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              AI currently recommends <span className="font-semibold">{dashboard.recommendedSignalTime}s</span> green time for smoother traffic movement.
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              Testing <span className="font-semibold">{manualGreenTime}s</span> may change congestion by approximately{" "}
              <span className="font-semibold">
                {estimatedCongestionChange > 0 ? "+" : ""}
                {estimatedCongestionChange}%
              </span>.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-xl font-semibold mb-4">AI Insights</h2>

          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  {item.insight}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                No insights available right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}