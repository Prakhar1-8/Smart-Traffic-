const router = require("express").Router();
const multer = require("multer");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const trafficStore = require("../store/trafficStore");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

let ioInstance;

const setIO = (io) => {
  ioInstance = io;
};

function createAlert({ severity, title, description, location = "Central Junction" }) {
  const alert = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    severity,
    title,
    description,
    location,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  trafficStore.alerts.unshift(alert);
  return alert;
}

function clearOldSystemAlerts() {
  trafficStore.alerts = trafficStore.alerts.filter(
    (alert) =>
      ![
        "Critical Congestion",
        "High Traffic Density",
        "Lane 1 Congestion",
        "Lane 2 Congestion",
        "Lane 3 Congestion",
        "Lane 4 Congestion",
        "Moderate Congestion",
      ].includes(alert.title)
  );
}

function generateAlertsFromAnalysis(result) {
  clearOldSystemAlerts();

  const newAlerts = [];
  const density = Number(result.density || 0);
  const laneDensity = Array.isArray(result.laneDensity) ? result.laneDensity : [];

  console.log("Generating alerts for density:", density);

  if (density >= 90) {
    console.log("Creating critical congestion alert");
    newAlerts.push(
      createAlert({
        severity: "critical",
        title: "Critical Congestion",
        description:
          "Traffic density crossed 90%. Immediate intervention recommended.",
      })
    );
  } else if (density >= 75) {
    console.log("Creating high traffic density alert");
    newAlerts.push(
      createAlert({
        severity: "warning",
        title: "High Traffic Density",
        description:
          "Traffic density crossed 75%. Congestion is building up.",
      })
    );
  } else if (density >= 50) {
    console.log("Creating moderate congestion alert");
    newAlerts.push(
      createAlert({
        severity: "warning",
        title: "Moderate Congestion",
        description:
          "Traffic density is moderate. Signal timing should be monitored.",
      })
    );
  }

  laneDensity.forEach((lane) => {
    if ((lane.density || 0) >= 85) {
      console.log(`Creating lane congestion alert for ${lane.lane}`);
      newAlerts.push(
        createAlert({
          severity: "warning",
          title: `${lane.lane} Congestion`,
          description: `${lane.lane} is showing unusually high congestion.`,
        })
      );
    }
  });

  trafficStore.latestAnalysis.alerts = trafficStore.alerts.filter(
    (a) => !a.is_read
  ).length;

  return newAlerts;
}

function applyAnalysisResult(result, videoPath) {
  trafficStore.latestAnalysis = {
    totalVehicles: result.totalVehicles ?? 0,
    density: result.density ?? 0,
    alerts: trafficStore.alerts.filter((a) => !a.is_read).length,
    vehicleTypes: result.vehicleTypes || {
      car: 0,
      bike: 0,
      bus: 0,
      truck: 0,
    },
    laneDensity: result.laneDensity || [],
    trafficTrend: result.trafficTrend || [],
    recommendedSignalTime: result.recommendedSignalTime ?? 30,
    updatedAt: new Date().toISOString(),
    videoPath,
  };

  trafficStore.signalState.recommendedGreenTime =
    result.recommendedSignalTime ?? 30;

  trafficStore.signalState.currentGreenTime =
    trafficStore.signalState.manualOverride
      ? trafficStore.signalState.currentGreenTime
      : result.recommendedSignalTime ?? 30;

  trafficStore.cameras[0].processingStatus = "completed";
  trafficStore.cameras[0].status = "online";
  trafficStore.cameras[0].lastUpdated = new Date().toISOString();

  const newAlerts = generateAlertsFromAnalysis(result);

  trafficStore.latestAnalysis.alerts = trafficStore.alerts.filter(
    (a) => !a.is_read
  ).length;

  if (ioInstance) {
    ioInstance.emit("traffic:update", trafficStore.latestAnalysis);
    ioInstance.emit("alert:update", trafficStore.alerts);

    if (newAlerts.length > 0) {
      ioInstance.emit("alert:new", newAlerts);
    }

    ioInstance.emit("signal:update", trafficStore.signalState);
  }

  return newAlerts;
}

router.get("/test-existing", async (req, res) => {
  try {
    let videoPath = path.join(__dirname, "../../uploads/traffic.mp4");
    
    if (!fs.existsSync(videoPath)) {
      const uploadDirFiles = fs.readdirSync(uploadDir);
      const mp4File = uploadDirFiles.find(f => f.endsWith('.mp4'));
      if (mp4File) {
        videoPath = path.join(uploadDir, mp4File);
      } else {
        return res.status(404).json({ success: false, message: "No .mp4 video found in uploads directory" });
      }
    }

    trafficStore.cameras[0].processingStatus = "processing";
    trafficStore.cameras[0].lastUpdated = new Date().toISOString();

    const response = await axios.post("http://localhost:8001/analyze-video", {
      videoPath,
    });

    const result = response.data;

    if (!result.success) {
      trafficStore.cameras[0].processingStatus = "failed";

      return res.status(500).json({
        success: false,
        message: result.message || "AI analysis failed",
      });
    }

    applyAnalysisResult(result, videoPath);

    return res.json({
      success: true,
      message: "Existing video analyzed successfully",
      data: trafficStore.latestAnalysis,
      alerts: trafficStore.alerts,
    });
  } catch (err) {
    console.error("Existing video test error:", err.message);

    trafficStore.cameras[0].processingStatus = "failed";

    return res.status(500).json({
      success: false,
      message: "Existing video analysis failed",
      error: err.message,
    });
  }
});

router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No video file uploaded",
      });
    }

    const videoPath = req.file.path;

    trafficStore.cameras[0].processingStatus = "processing";
    trafficStore.cameras[0].lastUpdated = new Date().toISOString();

    const response = await axios.post("http://localhost:8001/analyze-video", {
      videoPath,
    });

    const result = response.data;

    if (!result.success) {
      trafficStore.cameras[0].processingStatus = "failed";

      return res.status(500).json({
        success: false,
        message: result.message || "AI analysis failed",
      });
    }

    applyAnalysisResult(result, videoPath);

    return res.json({
      success: true,
      message: "Video uploaded and analyzed successfully",
      data: trafficStore.latestAnalysis,
      alerts: trafficStore.alerts,
    });
  } catch (err) {
    console.error("Video processing error:", err.message);

    trafficStore.cameras[0].processingStatus = "failed";

    return res.status(500).json({
      success: false,
      message: "Video processing failed",
      error: err.message,
    });
  }
});

module.exports = { router, setIO };