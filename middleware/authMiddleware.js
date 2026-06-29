const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_time_tracker";

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No authentication token provided." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Token format must be 'Bearer <token>'." });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains { user_id: X }
    next();
  } catch (error) {
    console.error("JWT Verification error:", error.message);
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

module.exports = authMiddleware;
