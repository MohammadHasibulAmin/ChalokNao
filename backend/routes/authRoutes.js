const express = require("express");
const router = express.Router();
const { register, login, markNotificationRead } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.put("/notifications/:notificationId/read", authMiddleware, markNotificationRead);

module.exports = router;