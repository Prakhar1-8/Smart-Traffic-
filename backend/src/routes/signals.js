const router = require("express").Router();
const trafficStore = require("../store/trafficStore");

router.get("/:junctionId", (req, res) => {
  res.json({
    success: true,
    data: trafficStore.signalState,
  });
});

router.put("/:junctionId/mode", (req, res) => {
  const { mode } = req.body;

  if (!["auto", "manual"].includes(mode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid mode",
    });
  }

  trafficStore.signalState.mode = mode;
  trafficStore.signalState.manualOverride = mode === "manual";

  if (mode === "auto") {
    trafficStore.signalState.currentGreenTime =
      trafficStore.signalState.recommendedGreenTime;
  }

  res.json({
    success: true,
    message: `Signal mode changed to ${mode}`,
    data: trafficStore.signalState,
  });
});

router.put("/:junctionId/timing", (req, res) => {
  const { greenTime } = req.body;

  if (typeof greenTime !== "number" || greenTime < 10 || greenTime > 120) {
    return res.status(400).json({
      success: false,
      message: "Green time must be between 10 and 120 seconds",
    });
  }

  trafficStore.signalState.currentGreenTime = greenTime;
  trafficStore.signalState.manualOverride = true;
  trafficStore.signalState.mode = "manual";

  res.json({
    success: true,
    message: "Manual green timing updated",
    data: trafficStore.signalState,
  });
});

router.put("/:junctionId/:direction", (req, res) => {
  const { direction } = req.params;
  const { state } = req.body;

  if (!["north", "south", "east", "west"].includes(direction)) {
    return res.status(400).json({
      success: false,
      message: "Invalid direction",
    });
  }

  if (!["red", "yellow", "green"].includes(state)) {
    return res.status(400).json({
      success: false,
      message: "Invalid signal state",
    });
  }

  trafficStore.signalState.directions[direction] = state;

  res.json({
    success: true,
    data: trafficStore.signalState,
    message: "Signal updated successfully",
  });
});

module.exports = router;