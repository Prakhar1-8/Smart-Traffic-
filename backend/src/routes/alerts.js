const router = require("express").Router();
const trafficStore = require("../store/trafficStore");

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: trafficStore.alerts,
  });
});

router.put("/:id/read", (req, res) => {
  const { id } = req.params;

  trafficStore.alerts = trafficStore.alerts.map((alert) =>
    alert.id === Number(id) ? { ...alert, is_read: true } : alert
  );

  trafficStore.latestAnalysis.alerts = trafficStore.alerts.filter(
    (a) => !a.is_read
  ).length;

  res.json({
    success: true,
    message: "Alert marked as read",
    data: trafficStore.alerts,
  });
});

router.put("/mark-all-read", (req, res) => {
  trafficStore.alerts = trafficStore.alerts.map((alert) => ({
    ...alert,
    is_read: true,
  }));

  trafficStore.latestAnalysis.alerts = 0;

  res.json({
    success: true,
    message: "All alerts marked as read",
    data: trafficStore.alerts,
  });
});

module.exports = router;