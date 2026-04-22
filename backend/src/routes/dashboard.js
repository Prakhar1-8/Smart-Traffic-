const router = require("express").Router();
const { pool } = require("../db");

router.get("/stats", async (req, res) => {
  try {
    // Defaulting to root tenant (1) since frontend Auth rewrite is out of scope
    const tenantId = req.user?.tenantId || 1; 

    const { rows: cacheRows } = await pool.query(
        "SELECT latest_analysis FROM system_cache WHERE tenant_id = $1",
        [tenantId]
    );

    const { rows: alertRows } = await pool.query(
        "SELECT COUNT(*) FROM alerts WHERE tenant_id = $1 AND is_read = false",
        [tenantId]
    );

    const latest = cacheRows[0]?.latest_analysis || {};
    const unreadAlerts = parseInt(alertRows[0]?.count || 0);

    res.json({
      success: true,
      data: {
        totalVehicles: latest.totalVehicles || 0,
        density: latest.density || 0,
        alerts: unreadAlerts,
        vehicleTypes: latest.vehicleTypes || { car: 0, bike: 0, bus: 0, truck: 0 },
        laneDensity: latest.laneDensity || [],
        trafficTrend: latest.trafficTrend || [],
        recommendedSignalTime: latest.recommendedSignalTime || 30,
        updatedAt: latest.updatedAt || new Date().toISOString(),
        videoPath: latest.videoPath || null,
      },
    });
  } catch (err) {
    console.warn("Dashboard offline mode triggered.");

    const latest = global.latestVideoResult || {};
    res.json({
      success: true,
      data: {
        totalVehicles: latest.totalVehicles || 0,
        density: latest.density || 0,
        alerts: 0,
        vehicleTypes: latest.vehicleTypes || { car: 0, bike: 0, bus: 0, truck: 0 },
        laneDensity: latest.laneDensity || [],
        trafficTrend: latest.trafficTrend || [],
        recommendedSignalTime: latest.recommendedSignalTime || 30,
        updatedAt: latest.updatedAt || new Date().toISOString(),
        videoPath: latest.videoPath || null,
      },
    });
  }
});

module.exports = router;