import { useEffect, useMemo, useState } from "react";
import { getCameras, getCameraById, getDashboardStats } from "../lib/api";

type Camera = {
  id: number;
  junction_id: number;
  camera_name: string;
  stream_url: string;
  status: string;
  last_active_at: string;
  processingStatus?: string;
  hasVideo?: boolean;
};

type DashboardStatsResponse = {
  success: boolean;
  data?: {
    videoPath?: string | null;
  };
};

type CamerasResponse = {
  success: boolean;
  data?: Camera[];
};

type CameraResponse = {
  success: boolean;
  data?: Camera;
};

export default function LiveFeed() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);

  const loadCameras = async () => {
    try {
      const res: CamerasResponse | Camera[] = await getCameras();

      const cameraData = Array.isArray(res)
        ? res
        : Array.isArray(res.data)
        ? res.data
        : [];

      setCameras(cameraData);

      if (cameraData.length > 0) {
        setSelectedCamera((prev) => prev ?? cameraData[0]);
      }
    } catch (err) {
      console.error("Cameras fetch error:", err);
    }
  };

  const loadLatestVideo = async () => {
    try {
      const res: DashboardStatsResponse = await getDashboardStats();

      if (res?.success && res?.data?.videoPath) {
        setVideoPath(res.data.videoPath);
      } else {
        setVideoPath(null);
      }
    } catch (err) {
      console.error("Latest video fetch error:", err);
      setVideoPath(null);
    } finally {
      setVideoLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadCameras(), loadLatestVideo()]);
      setLoading(false);
    };

    init();

    const interval = setInterval(() => {
      loadCameras();
      loadLatestVideo();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectCamera = async (cameraId: number) => {
    try {
      const res: CameraResponse | Camera = await getCameraById(cameraId);

      const cameraData =
        "id" in (res as Camera)
          ? (res as Camera)
          : (res as CameraResponse).data || null;

      if (cameraData) {
        setSelectedCamera(cameraData);
      }
    } catch (err) {
      console.error("Camera details error:", err);
    }
  };

  const videoFileName = useMemo(() => {
    if (!videoPath) return null;
    return videoPath.split("\\").pop()?.split("/").pop() || null;
  }, [videoPath]);

  const videoUrl =
    selectedCamera?.id === 1 && videoFileName
      ? `http://localhost:5000/uploads/${videoFileName}`
      : null;

  if (loading) {
    return <div className="p-6 text-white">Loading live feeds...</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-2xl font-bold">Live Feed</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-4">
          <h2 className="text-lg font-semibold">Available Cameras</h2>

          {cameras.length === 0 ? (
            <div className="text-sm text-gray-400">No cameras available</div>
          ) : (
            cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => handleSelectCamera(camera.id)}
                className={`w-full text-left p-4 rounded-lg border ${
                  selectedCamera?.id === camera.id
                    ? "border-cyan-400 bg-cyan-500/20"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{camera.camera_name}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      camera.status === "online"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {camera.status}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Junction ID: {camera.junction_id}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-black/30 p-4">
          {selectedCamera ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">
                  {selectedCamera.camera_name}
                </h2>

                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      selectedCamera.status === "online"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {selectedCamera.status}
                  </span>

                  <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {selectedCamera.id === 1 && videoUrl
                      ? "video available"
                      : "no video available"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border border-white/10 bg-black">
                {videoLoading ? (
                  <div className="w-full h-[420px] flex items-center justify-center text-gray-400">
                    Loading video...
                  </div>
                ) : selectedCamera.id === 1 && videoUrl ? (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    muted
                    className="w-full h-[420px] object-cover bg-black"
                  />
                ) : (
                  <div className="w-full h-[420px] flex items-center justify-center text-gray-400">
                    No video available
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-gray-400">Camera ID</p>
                  <p className="font-semibold">{selectedCamera.id}</p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-gray-400">Junction ID</p>
                  <p className="font-semibold">{selectedCamera.junction_id}</p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-gray-400">Last Active</p>
                  <p className="font-semibold">
                    {selectedCamera.last_active_at
                      ? new Date(selectedCamera.last_active_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-gray-400">Processing Status</p>
                  <p className="font-semibold">
                    {selectedCamera.id === 1 && videoUrl ? "Completed" : "Idle"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">No camera selected</div>
          )}
        </div>
      </div>
    </div>
  );
}