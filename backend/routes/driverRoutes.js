// backend/routes/driverRoutes.js
const express = require("express");
const router = express.Router();
const { createOrUpdateProfile, searchDrivers, upload } = require("../controllers/driverController");

// Create or update driver profile with photo upload
router.post("/profile", upload.single("photo"), createOrUpdateProfile);

// Search drivers
router.get("/search", searchDrivers);

module.exports = router;