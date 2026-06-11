import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo, processVideo, checkJobStatus } from "../lib/api";
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

type ProcessResponse = {
  success: boolean;
  message: string;
  data?: UploadResultData;
  alerts?: AlertItem[];
};

export default function UploadVideo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Phase 1 States
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // Phase 2 States
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResultData | null>(null);
  const [generatedAlerts, setGeneratedAlerts] = useState<AlertItem[]>([]);

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadedFileName(null);
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
      
      const response = await uploadVideo(selectedFile);

      if (response.success && response.fileName) {
        setUploadedFileName(response.fileName);
        setSuccessMessage("Phase 1 Complete: Video uploaded to node sector! Awaiting Analysis Trigger.");
      } else {
        setError("Network upload completed but explicit filename was discarded.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Video File Transmission Failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadedFileName) return;

    try {
      setProcessing(true);
      setError("");
      setSuccessMessage("");

      const response: any = await processVideo(uploadedFileName);

      if (response.success && response.job_id) {
        setSuccessMessage("Phase 2 Complete: Job dispatched to Background AI Nodes. Polling status...");
        
        const interval = setInterval(async () => {
            try {
               const statusRes = await checkJobStatus(response.job_id);
               if (statusRes.status === "completed") {
                  clearInterval(interval);
                  setSuccessMessage("AI Engine parsing finished flawlessly");
                  setResult(statusRes.data || null);
                  setGeneratedAlerts(statusRes.alerts || []);
                  localStorage.setItem("isDataAvailable", "true");
                  setProcessing(false);
               } else if (statusRes.status === "failed") {
                  clearInterval(interval);
                  setError(statusRes.message || "AI Engine Failure");
                  setProcessing(false);
               }
            } catch (pollErr) {
               console.error("Continuous polling error", pollErr);
            }
        }, 2500);
        
      } else {
        setError("Analysis Phase Dispatch Failed!");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Processing error:", err);
      setError("Fast-forward Engine failed to securely dispatch.");
      setProcessing(false);
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto relative overflow-hidden bg-[#0c1324] min-h-[calc(100vh-4rem)]"
    >
      <div className="absolute inset-0 grid-bg pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30"></div>

      <motion.div variants={itemVariants} className="relative z-10">
        <h1 className="text-4xl font-['Space_Grotesk'] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white/60 mb-2 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)] uppercase">
          Traffic Video Upload
        </h1>
        <p className="text-xs font-['Inter'] text-white/50 tracking-widest uppercase drop-shadow-sm">
          Perform a 2-step operation: First transmit your video, then manually trigger the AI Frame-Skip analysis engine.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-8 border-white/5 relative z-10 space-y-6">
        <div className="rounded-xl border border-dashed border-cyan-400/40 bg-cyan-500/5 p-6 text-center">
          <p className="text-lg font-semibold">Choose Traffic Video</p>
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
            <p className="text-sm text-white/70">Selected File Tracker</p>
            <p className="font-semibold mt-1">{selectedFile.name}</p>
            <p className="text-sm text-white/60 mt-1">
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {/* Phase 1 Button */}
          {!uploadedFileName && (
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-5 py-2.5 rounded-lg border border-cyan-400 bg-cyan-500/20 disabled:opacity-50 text-cyan-100 uppercase tracking-widest font-semibold"
            >
              {uploading ? "Transmitting..." : "Phase 1: Upload File"}
            </button>
          )}

          {/* Phase 2 Button */}
          {uploadedFileName && (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="px-5 py-2.5 rounded-lg border border-emerald-400 bg-emerald-500/20 disabled:opacity-50 text-emerald-100 uppercase tracking-widest font-semibold"
            >
              {processing ? "Executing Engine..." : "Phase 2: Run Analysis"}
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5"
          >
            Dashboard
          </button>
        </div>

        {uploading && (
           <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
            <p className="font-medium">File transmitting to server memory node...</p>
          </div>
        )}

        {processing && (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="font-medium">Analysis protocol initialized...</p>
            <p className="text-sm text-white/70 mt-1">
              AI Object Locator running fast-forward tracking (skipping alt frames). Please standby.
            </p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-green-400/20 bg-green-500/10 p-4 text-green-300 font-medium">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}
      </motion.div>

      {result && (
        <motion.div variants={itemVariants} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 animate-in zoom-in transition-all">
              <p className="text-sm text-emerald-400">Total Vehicles Tracked</p>
              <h2 className="text-3xl font-bold mt-2 text-emerald-50">{result.totalVehicles}</h2>
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
              <h2 className="text-3xl font-bold mt-2">{result.recommendedSignalTime}s</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-xl font-semibold mb-4 text-cyan-200">Vehicle Types (Live Count)</h2>
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between items-center bg-white/5 p-2 rounded"><span>Detected Cars</span><span className="text-cyan-400 text-lg">{result.vehicleTypes.car}</span></div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded"><span>Detected Bikes</span><span className="text-yellow-400 text-lg">{result.vehicleTypes.bike}</span></div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded"><span>Detected Buses</span><span className="text-orange-400 text-lg">{result.vehicleTypes.bus}</span></div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded"><span>Detected Trucks</span><span className="text-red-400 text-lg">{result.vehicleTypes.truck}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-xl font-semibold mb-4 text-cyan-200">Lane Density Summary</h2>
              <div className="space-y-3">
                {result.laneDensity.map((lane, index) => (
                  <div key={index}>
                     <div className="flex justify-between text-sm mb-1 uppercase tracking-wider text-white/80">
                      <span>{lane.lane}</span>
                      <span>{lane.density}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${lane.density}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-white/10 bg-black/30 p-5">
            <h2 className="text-xl font-semibold mb-4">Generated Alerts</h2>
            {generatedAlerts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {generatedAlerts.map((alert) => {
                  const classes = getSeverityClasses(alert.severity);
                  return (
                    <div key={alert.id} className={`rounded-lg border p-4 ${classes.card}`}>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm ${classes.badge}`}>{alert.severity}</span>
                      </div>
                      <p className="text-sm text-white/80 mb-2">{alert.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/50 text-center py-4 font-['Space_Grotesk'] tracking-widest text-xs uppercase">No structural alerts triggered during scan.</p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}