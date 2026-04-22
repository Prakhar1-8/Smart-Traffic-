const router = require("express").Router();
const { pool } = require("../db");

router.get("/:junctionId", async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || 1;
    const junctionId = Number(req.params.junctionId);

    const { rows } = await pool.query("SELECT * FROM signals WHERE junction_id = $1 AND tenant_id = $2", [junctionId, tenantId]);

    if(!rows || rows.length === 0) {
      return res.json({
         success: true,
         data: {
           mode: "auto",
           recommendedGreenTime: 30,
           currentGreenTime: 30,
           manualOverride: 0,
           directions: { l1: "green", l2: "red", l3: "red", l4: "red" }
         }
      });
    }

    const s = rows[0];
    res.json({
      success: true,
      data: {
        mode: s.mode,
        recommendedGreenTime: s.recommended_green_time,
        currentGreenTime: s.current_green_time,
        manualOverride: s.manual_override,
        directions: { l1: s.l1, l2: s.l2, l3: s.l3, l4: s.l4 }
      },
    });
  } catch (err) {
    console.warn("Signals Fetch Error (Offline Mode Triggered)");
    return res.json({
       success: true,
       data: {
         mode: "auto",
         recommendedGreenTime: 30,
         currentGreenTime: 30,
         manualOverride: 0,
         directions: { l1: "green", l2: "red", l3: "red", l4: "red" }
       }
    });
  }
});

router.put("/:junctionId/mode", async (req, res) => {
  const { mode } = req.body;
  const junctionId = Number(req.params.junctionId);
  const tenantId = req.user?.tenantId || 1;

  if (!["auto", "manual"].includes(mode)) {
    return res.status(400).json({ success: false, message: "Invalid mode" });
  }

  try {
    const manualOverride = mode === "manual";
    let query = "UPDATE signals SET mode = $1, manual_override = $2";
    const params = [mode, manualOverride];

    if (mode === "auto") {
      query += ", current_green_time = recommended_green_time";
    }

    query += " WHERE junction_id = $3 AND tenant_id = $4 RETURNING *";
    params.push(junctionId, tenantId);

    const { rows } = await pool.query(query, params);

    const s = rows[0];
    const signalState = {
      mode: s.mode,
      recommendedGreenTime: s.recommended_green_time,
      currentGreenTime: s.current_green_time,
      manualOverride: s.manual_override,
      directions: { l1: s.l1, l2: s.l2, l3: s.l3, l4: s.l4 }
    };

    const io = req.app.get("io");
    if (io) io.emit("signal:update", signalState);

    res.json({ success: true, message: `Signal mode changed to ${mode}`, data: signalState });
  } catch(err) {
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

router.put("/:junctionId/timing", async (req, res) => {
  const { greenTime } = req.body;
  const junctionId = Number(req.params.junctionId);
  const tenantId = req.user?.tenantId || 1;

  if (typeof greenTime !== "number" || greenTime < 10 || greenTime > 120) {
    return res.status(400).json({ success: false, message: "Green time must be between 10 and 120" });
  }

  try {
    const { rows } = await pool.query(
      "UPDATE signals SET current_green_time = $1, manual_override = true, mode = 'manual' WHERE junction_id = $2 AND tenant_id = $3 RETURNING *",
      [greenTime, junctionId, tenantId]
    );

    const s = rows[0];
    const signalState = {
      mode: s.mode,
      recommendedGreenTime: s.recommended_green_time,
      currentGreenTime: s.current_green_time,
      manualOverride: s.manual_override,
      directions: { l1: s.l1, l2: s.l2, l3: s.l3, l4: s.l4 }
    };

    const io = req.app.get("io");
    if (io) io.emit("signal:update", signalState);

    res.json({ success: true, message: "Manual timing updated", data: signalState });
  } catch(err) {
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

router.put("/:junctionId/:direction", async (req, res) => {
  const { direction } = req.params;
  const { state } = req.body;
  const junctionId = Number(req.params.junctionId);
  const tenantId = req.user?.tenantId || 1;

  if (!["l1", "l2", "l3", "l4"].includes(direction) || !["red", "yellow", "green"].includes(state)) {
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE signals SET ${direction} = $1 WHERE junction_id = $2 AND tenant_id = $3 RETURNING *`,
      [state, junctionId, tenantId]
    );

    const s = rows[0];
    const signalState = {
      mode: s.mode,
      recommendedGreenTime: s.recommended_green_time,
      currentGreenTime: s.current_green_time,
      manualOverride: s.manual_override,
      directions: { l1: s.l1, l2: s.l2, l3: s.l3, l4: s.l4 }
    };

    const io = req.app.get("io");
    if (io) io.emit("signal:update", signalState);

    res.json({ success: true, message: "Signal updated", data: signalState });
  } catch(err) {
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

const { triggerEmergencyOverride, clearEmergencyOverride } = require("../services/trafficLightEngine");

router.post("/emergency", async (req, res) => {
  const { laneId, action } = req.body;
  if (action === "trigger") {
     const success = triggerEmergencyOverride(laneId);
     if (success) return res.json({ success: true, message: `Emergency triggered for ${laneId}` });
     return res.status(400).json({ success: false, message: "Invalid lane ID" });
  } else if (action === "clear") {
     clearEmergencyOverride();
     return res.json({ success: true, message: "Emergency cleared" });
  }
  res.status(400).json({ success: false, message: "Invalid action" });
});

module.exports = router;