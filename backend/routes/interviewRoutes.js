const express = require("express");
const router = express.Router();
const { requestInterview, getDriverInterviews, respondInterview } = require("../controllers/interviewController");

// POST /api/interviews/request
router.post("/request", requestInterview);

// GET /api/interviews/driver/:driverId
router.get("/driver/:driverId", getDriverInterviews);

// POST /api/interviews/respond/:id
router.post("/respond/:id", respondInterview);

module.exports = router;