const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function roleMiddleware(...allowedRoles) {
  return function roleCheck(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

module.exports = {
  authMiddleware,
  roleMiddleware,
};