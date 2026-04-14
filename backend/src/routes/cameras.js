const router = require("express").Router();
const trafficStore = require("../store/trafficStore");

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: trafficStore.cameras,
  });
});

router.get("/:cameraId", (req, res) => {
  const cameraId = Number(req.params.cameraId);

  const camera = trafficStore.cameras.find((c) => c.id === cameraId);

  if (!camera) {
    return res.status(404).json({
      success: false,
      message: "Camera not found",
    });
  }

  res.json({
    success: true,
    data: camera,
  });
});

module.exports = router;