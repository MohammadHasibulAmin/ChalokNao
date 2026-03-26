const express = require("express");
const router = express.Router();
const { createHire, confirmHire, getHireStatus } = require("../controllers/hireController");

// POST /api/hire/request
router.post("/request", createHire);

// POST /api/hire/confirm/:id
router.post("/confirm/:id", confirmHire);

// GET /api/hire/:id
router.get("/:id", getHireStatus);

module.exports = router;