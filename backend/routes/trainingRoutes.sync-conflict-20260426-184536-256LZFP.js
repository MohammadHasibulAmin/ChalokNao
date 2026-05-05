const express = require("express");
const router = express.Router();
const { getTrainingList, createProgress } = require("../controllers/trainingController");

router.get("/", getTrainingList);
router.post("/progress", createProgress);

module.exports = router;
