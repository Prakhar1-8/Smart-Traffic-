const router = require("express").Router();
const jwt = require("jsonwebtoken");

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ role: "admin" }, "SECRET");
    return res.json({ success: true, data: { token } });
  }

  res.status(401).json({ success: false });
});

module.exports = router;