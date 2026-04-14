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
} from "recharts";
import {
  getVehicleTypes,
  getHourlyCount,
  getLaneDensity,
  getInsights,
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
        { name: "Detected Cars", value: vehicleData.car || 0, color: "#00ff88" },
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
    return <div className="p-6 text-white">Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 text-white space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Total Detected Vehicles</p>
          <h2 className="text-3xl font-bold mt-2">{totalDetectedVehicles}</h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Peak Traffic Point</p>
          <h2 className="text-3xl font-bold mt-2">
            {peakTrend ? `${peakTrend.vehicles}` : "0"}
          </h2>
          <p className="text-sm text-white/60 mt-1">
            {peakTrend ? `Observed at ${peakTrend.time}` : "No trend data"}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Busiest Lane</p>
          <h2 className="text-3xl font-bold mt-2">
            {busiestLane ? busiestLane.lane : "N/A"}
          </h2>
          <p className="text-sm text-white/60 mt-1">
            {busiestLane ? `${busiestLane.density}% density` : "No lane data"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="text-lg font-semibold mb-4">Vehicle Type Distribution</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={vehicleTypes}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label
              >
                {vehicleTypes.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="text-lg font-semibold mb-4">Traffic Trend</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={hourlyCount}>
              <CartesianGrid stroke="#1a1a2e" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="vehicles"
                stroke="#00ff88"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              {peakTrend && (
                <ReferenceDot
                  x={peakTrend.time}
                  y={peakTrend.vehicles}
                  r={8}
                  fill="#ef4444"
                  stroke="#ffffff"
                  label={{
                    value: "Peak",
                    position: "top",
                    fill: "#ef4444",
                  }}
                />
              )}
              {lowestTrend && (
                <ReferenceDot
                  x={lowestTrend.time}
                  y={lowestTrend.vehicles}
                  r={8}
                  fill="#fbbf24"
                  stroke="#ffffff"
                  label={{
                    value: "Low",
                    position: "bottom",
                    fill: "#fbbf24",
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h2 className="text-lg font-semibold mb-4">Lane Density Comparison</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={laneDensity}>
            <CartesianGrid stroke="#1a1a2e" strokeDasharray="3 3" />
            <XAxis dataKey="lane" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Legend />
            <Bar dataKey="density" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h2 className="text-lg font-semibold mb-4">AI Insights</h2>
        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-white/10 p-3 bg-white/5"
              >
                {item.insight}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 p-3 bg-white/5">
              No insights available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}