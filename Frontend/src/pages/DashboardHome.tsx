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
    <div className="p-6 text-white space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-xl">
          <p>Total Vehicles</p>
          <h2 className="text-3xl">{stats.totalVehicles}</h2>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl">
          <p>Density</p>
          <h2 className="text-3xl">{stats.density}%</h2>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl">
          <p>Alerts</p>
          <h2 className="text-3xl">{stats.alerts}</h2>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl">
          <p>Signal Time</p>
          <h2 className="text-3xl">{stats.recommendedSignalTime}s</h2>
        </div>
      </div>

      {/* VEHICLE TYPES */}
      <div className="bg-slate-800 p-5 rounded-xl">
        <h2 className="text-xl mb-3">Vehicle Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>Cars: {stats.vehicleTypes.car}</div>
          <div>Bikes: {stats.vehicleTypes.bike}</div>
          <div>Buses: {stats.vehicleTypes.bus}</div>
          <div>Trucks: {stats.vehicleTypes.truck}</div>
        </div>
      </div>

      {/* LANE DENSITY */}
      <div className="bg-slate-800 p-5 rounded-xl">
        <h2 className="text-xl mb-3">Lane Density</h2>

        {stats.laneDensity.map((lane, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between">
              <span>{lane.lane}</span>
              <span>{lane.density}%</span>
            </div>

            <div className="w-full bg-gray-700 h-3 rounded">
              <div
                className="bg-green-500 h-3 rounded"
                style={{ width: `${lane.density}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* TRAFFIC TREND */}
      <div className="bg-slate-800 p-5 rounded-xl">
        <h2 className="text-xl mb-3">Traffic Trend</h2>

        <div className="grid grid-cols-5 gap-2">
          {stats.trafficTrend.map((item, i) => (
            <div key={i} className="bg-gray-700 p-2 text-center rounded">
              <div>{item.time}</div>
              <div className="text-xl">{item.vehicles}</div>
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