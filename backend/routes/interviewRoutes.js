const express = require("express");
const router = express.Router();
const {
  requestInterview,
  getDriverInterviews,
  getOwnerInterviews,
  respondInterview,
} = require("../controllers/interviewController");

router.post("/owner/interview", requestInterview);
router.get("/driver/:driverId", getDriverInterviews);
router.get("/owner/:ownerId", getOwnerInterviews);
router.put("/driver/interview/:id", respondInterview);

module.exports = router;