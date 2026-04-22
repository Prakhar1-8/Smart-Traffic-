const express = require("express");
const router = express.Router();
const os = require("os");
const { pool } = require("../db");

router.get("/", async (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: process.memoryUsage(),
    cpuLoad: os.loadavg(),
    dbState: "unknown",
  };

  try {
    // Explicit Database Liveliness Check
    await pool.query("SELECT 1");
    healthData.dbState = "connected";
    
    // Overall system status heuristic
    const status = healthData.memory.heapUsed > (500 * 1024 * 1024) ? "degraded" : "healthy";

    res.status(200).json({ status, ...healthData });
  } catch (error) {
    healthData.dbState = "disconnected";
    healthData.error = error.message;
    // Explicit 503 Service Unavailable so React layout catches global faults
    res.status(503).json({ status: "critical", ...healthData });
  }
});

module.exports = router;
