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

const BACKEND_BASE = "http://localhost:5000";

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

  const loadLatestVideo = async (isInitial = false) => {
    try {
      if (isInitial) setVideoLoading(true);

      const res: DashboardStatsResponse = await getDashboardStats();

      if (res?.success && res?.data?.videoPath) {
        setVideoPath(res.data.videoPath);
      } else {
        if (isInitial) setVideoPath(null);
      }
    } catch (err) {
      console.error("Latest video fetch error:", err);
    } finally {
      if (isInitial) setVideoLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadCameras(), loadLatestVideo(true)]);
      setLoading(false);
    };

    init();

    const interval = setInterval(() => {
      loadCameras();
      loadLatestVideo(false);
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

  const videoUrl = useMemo(() => {
    if (!videoPath || typeof videoPath !== "string") {
      console.log("videoPath invalid:", videoPath);
      return null;
    }

    if (
      videoPath.startsWith("http://") ||
      videoPath.startsWith("https://")
    ) {
      console.log("Full video URL received:", videoPath);
      return videoPath;
    }

    const normalized = videoPath.replace(/\\/g, "/").trim();

    if (!normalized) {
      console.log("Normalized videoPath empty");
      return null;
    }

    let finalUrl: string;

    if (normalized.startsWith("/")) {
      finalUrl = `${BACKEND_BASE}${normalized}`;
    } else {
      finalUrl = `${BACKEND_BASE}/${normalized}`;
    }

    console.log("FINAL VIDEO URL:", finalUrl);
    return finalUrl;
  }, [videoPath]);

  if (loading) {
    return <div className="p-6 text-white">Loading live feeds...</div>;
  }

  return (
    <div className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto animate-in-slide">
      <h1 className="text-4xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-8">
        Live Surveillance Feed
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* SIDE ARCHIVE / CAMERA SELECTOR */}
        <div className="glass-card p-6 space-y-4 xl:col-span-1 border-white/5 bg-background/40 max-h-[85vh] overflow-y-auto">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest pl-2 mb-4">Network Nodes</h2>

          {cameras.length === 0 ? (
            <div className="text-sm text-foreground/40 font-medium px-4">No signal detected.</div>
          ) : (
            cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => handleSelectCamera(camera.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                  selectedCamera?.id === camera.id
                    ? "border-primary/50 bg-primary/10 shadow-[inset_0_0_20px_rgba(0,240,255,0.15)]"
                    : "border-white/5 bg-white/5 hover:bg-white/10"
                }`}
              >
                {selectedCamera?.id === camera.id && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-xl rounded-full"></div>
                )}
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-display font-bold text-white/90">{camera.camera_name}</span>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                      camera.status === "online"
                        ? "bg-primary/20 text-primary border border-primary/30 glow-green"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    {camera.status}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-2 font-medium relative z-10">
                  Junction Block: <span className="text-white/60">{camera.junction_id}</span>
                </p>
              </button>
            ))
          )}
        </div>

        <div className="xl:col-span-3 glass-card p-6 flex flex-col border-white/5">
          {selectedCamera ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                  <span className="text-primary mr-2">/</span>
                  {selectedCamera.camera_name}
                </h2>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full ${
                      selectedCamera.status === "online"
                        ? "bg-primary/20 text-primary border border-primary/30 glow-green"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    {selectedCamera.status}
                  </span>

                  <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/30 glow-violet">
                    {videoUrl && selectedCamera?.id === 1 ? "Signal Intact" : "Signal Dropped"}
                  </span>
                </div>
              </div>



              <div className="rounded-xl overflow-hidden border border-white/10 bg-background/80 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative">
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] z-10"></div>
                {videoLoading ? (
                  <div className="w-full aspect-video flex flex-col items-center justify-center text-primary/60 font-display font-semibold tracking-widest uppercase">
                    <div className="w-12 h-12 border-2 border-primary/40 border-t-primary rounded-full animate-spin mb-4 glow-green"></div>
                    Establishing connection...
                  </div>
                ) : videoUrl && selectedCamera?.id === 1 ? (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    muted
                    className="w-full aspect-video object-contain bg-black/50"
                  />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center text-muted-foreground font-display font-semibold tracking-widest uppercase">
                    {selectedCamera?.id === 1 
                      ? "Awaiting Input Stream" 
                      : `Link offline for ${selectedCamera?.camera_name}`}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <div className="bg-background/40 border border-white/5 px-5 py-4 rounded-xl text-center group hover:bg-white/5 transition-colors">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Camera Node</p>
                  <p className="text-xl font-display font-bold text-white/90 group-hover:text-primary transition-colors">#{selectedCamera.id.toString().padStart(4, '0')}</p>
                </div>

                <div className="bg-background/40 border border-white/5 px-5 py-4 rounded-xl text-center group hover:bg-white/5 transition-colors">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Junction Matrix</p>
                  <p className="text-xl font-display font-bold text-white/90 group-hover:text-accent transition-colors">{selectedCamera.junction_id}</p>
                </div>

                <div className="bg-background/40 border border-white/5 px-5 py-4 rounded-xl text-center group hover:bg-white/5 transition-colors lg:col-span-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">System Telemetry</p>
                  <p className="text-sm font-medium text-white/70">
                    {selectedCamera.last_active_at
                      ? `Pinged: ${new Date(selectedCamera.last_active_at).toLocaleString()}`
                      : "Telemetry Missing"}
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