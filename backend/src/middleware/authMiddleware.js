const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ success: false });

  try {
    req.user = jwt.verify(token, "SECRET");
    next();
  } catch {
    res.status(401).json({ success: false });
  }
};