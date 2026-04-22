const router = require("express").Router();
const { pool } = require("../db");

router.get("/", async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || 1; 
    const { rows } = await pool.query(
        "SELECT * FROM alerts WHERE tenant_id = $1 ORDER BY created_at DESC", 
        [tenantId]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Alerts Fetch Error:", err);
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

router.put("/:id/read", async (req, res) => {
  const { id } = req.params;

  try {
    const tenantId = req.user?.tenantId || 1; 
    await pool.query(
        "UPDATE alerts SET is_read = true WHERE id = $1 AND tenant_id = $2",
        [Number(id), tenantId]
    );

    const { rows } = await pool.query(
        "SELECT * FROM alerts WHERE tenant_id = $1 ORDER BY created_at DESC", 
        [tenantId]
    );

    res.json({
      success: true,
      message: "Alert marked as read",
      data: rows,
    });
  } catch (err) {
    console.error("Alerts Update Error:", err);
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

router.put("/mark-all-read", async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || 1; 
    await pool.query(
        "UPDATE alerts SET is_read = true WHERE tenant_id = $1",
        [tenantId]
    );

    const { rows } = await pool.query(
        "SELECT * FROM alerts WHERE tenant_id = $1 ORDER BY created_at DESC", 
        [tenantId]
    );

    res.json({
      success: true,
      message: "All alerts marked as read",
      data: rows,
    });
  } catch (err) {
    console.error("Alerts Mark All Error:", err);
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

module.exports = router;