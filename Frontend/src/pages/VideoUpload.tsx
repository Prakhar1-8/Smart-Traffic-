import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../lib/api";

type AlertItem = {
  id: number;
  severity: "warning" | "critical" | string;
  title: string;
  description: string;
  location: string;
  is_read: boolean;
  created_at: string;
};

type UploadResultData = {
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
  updatedAt: string;
  videoPath: string;
};

type UploadResponse = {
  success: boolean;
  message: string;
  data?: UploadResultData;
  alerts?: AlertItem[];
};

export default function UploadVideo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResultData | null>(null);
  const [generatedAlerts, setGeneratedAlerts] = useState<AlertItem[]>([]);

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setSuccessMessage("");
    setError("");
    setResult(null);
    setGeneratedAlerts([]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a video file first");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccessMessage("");
      setResult(null);
      setGeneratedAlerts([]);

      const response: UploadResponse = await uploadVideo(selectedFile);

      if (response.success) {
        setSuccessMessage(response.message || "Upload and analysis completed");
        setResult(response.data || null);
        setGeneratedAlerts(response.alerts || []);
      } else {
        setError("Upload completed but analysis failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Video upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getSeverityClasses = (severity: string) => {
    if (severity === "critical") {
      return {
        card: "border-red-400/30 bg-red-500/10",
        badge: "bg-red-500/20 text-red-300 border border-red-400/40",
      };
    }

    return {
      card: "border-yellow-400/30 bg-yellow-500/10",
      badge: "bg-yellow-500/20 text-yellow-300 border border-yellow-400/40",
    };
  };

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Traffic Video</h1>
        <p className="text-sm text-white/60 mt-1">
          Upload a traffic video to run AI analysis and update the dashboard, live feed, analytics, simulation, and alerts.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-6 space-y-5">
        <div className="rounded-xl border border-dashed border-cyan-400/40 bg-cyan-500/5 p-6 text-center">
          <p className="text-lg font-semibold">Choose Traffic Video</p>
          <p className="text-sm text-white/60 mt-2">
            Recommended input: clear daytime MP4 traffic footage
          </p>

          <div className="mt-5">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-white"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">Selected File</p>
            <p className="font-semibold mt-1">{selectedFile.name}</p>
            <p className="text-sm text-white/60 mt-1">
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-5 py-2.5 rounded-lg border border-cyan-400 bg-cyan-500/20 disabled:opacity-50"
          >
            {uploading ? "Uploading & Processing..." : "Upload and Analyze"}
          </button>

          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5"
          >
            Go to Dashboard
          </button>

          <button
            onClick={() => navigate("/live-feed")}
            className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5"
          >
            Open Live Feed
          </button>

          <button
            onClick={() => navigate("/alerts")}
            className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5"
          >
            Open Alerts
          </button>
        </div>

        {uploading && (
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
            <p className="font-medium">Processing in progress...</p>
            <p className="text-sm text-white/70 mt-1">
              AI engine is extracting vehicle count, density, lane load, traffic trend, signal timing, and alerts.
            </p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-green-400/20 bg-green-500/10 p-4 text-green-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-white/70">Total Vehicles</p>
              <h2 className="text-3xl font-bold mt-2">{result.totalVehicles}</h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-white/70">Traffic Density</p>
              <h2 className="text-3xl font-bold mt-2">{result.density}%</h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-white/70">Active Alerts</p>
              <h2 className="text-3xl font-bold mt-2">{result.alerts}</h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-white/70">Recommended Signal Time</p>
              <h2 className="text-3xl font-bold mt-2">
                {result.recommendedSignalTime}s
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-xl font-semibold mb-4">Detected Vehicle Types</h2>
              <div className="space-y-2 text-sm">
                <div>Detected Cars: {result.vehicleTypes.car}</div>
                <div>Detected Bikes: {result.vehicleTypes.bike}</div>
                <div>Detected Buses: {result.vehicleTypes.bus}</div>
                <div>Detected Trucks: {result.vehicleTypes.truck}</div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-xl font-semibold mb-4">Lane Density Summary</h2>
              <div className="space-y-3">
                {result.laneDensity.map((lane, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{lane.lane}</span>
                      <span>{lane.density}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-3 rounded-full"
                        style={{ width: `${lane.density}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-5">
            <h2 className="text-xl font-semibold mb-4">Generated Alerts</h2>

            {generatedAlerts.length > 0 ? (
              <div className="space-y-3">
                {generatedAlerts.map((alert) => {
                  const classes = getSeverityClasses(alert.severity);

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-lg border p-4 ${classes.card}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <span
                          className={`text-xs uppercase px-2 py-1 rounded-full ${classes.badge}`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <p className="text-sm text-white/80 mb-2">
                        {alert.description}
                      </p>

                      <div className="text-xs text-white/60 space-y-1">
                        <p>Location: {alert.location}</p>
                        <p>
                          Time:{" "}
                          {alert.created_at
                            ? new Date(alert.created_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-white/70">
                No alert generated for this upload.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-5">
            <h2 className="text-xl font-semibold mb-4">Next Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 rounded-lg border border-cyan-400 bg-cyan-500/20"
              >
                View Dashboard
              </button>

              <button
                onClick={() => navigate("/analytics")}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5"
              >
                Open Analytics
              </button>

              <button
                onClick={() => navigate("/simulation")}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5"
              >
                Run Simulation View
              </button>

              <button
                onClick={() => navigate("/live-feed")}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5"
              >
                Open Live Feed
              </button>

              <button
                onClick={() => navigate("/alerts")}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5"
              >
                Open Full Alerts Page
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}