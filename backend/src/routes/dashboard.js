const router = require("express").Router();
const trafficStore = require("../store/trafficStore");

router.get("/stats", (req, res) => {
  const latest = trafficStore.latestAnalysis;

  const unreadAlerts = trafficStore.alerts.filter((a) => !a.is_read).length;

  res.json({
    success: true,
    data: {
      totalVehicles: latest.totalVehicles,
      density: latest.density,
      alerts: unreadAlerts,
      vehicleTypes: latest.vehicleTypes,
      laneDensity: latest.laneDensity,
      trafficTrend: latest.trafficTrend,
      recommendedSignalTime: latest.recommendedSignalTime,
      updatedAt: latest.updatedAt,
      videoPath: latest.videoPath || null,
    },
  });
});

module.exports = router;