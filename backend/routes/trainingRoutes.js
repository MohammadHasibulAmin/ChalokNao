const express = require("express");
const router = express.Router();
const { getTrainingList, createProgress, getDriverProgress } = require("../controllers/trainingController");

router.get("/", getTrainingList);
router.get("/progress/:driverId", getDriverProgress);
router.post("/progress", createProgress);

module.exports = router;
