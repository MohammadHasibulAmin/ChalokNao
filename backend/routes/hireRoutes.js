const express = require("express");
const router = express.Router();
const { createHire, confirmHire, getHireStatus, getOwnerHires } = require("../controllers/hireController");

router.post("/request", createHire);
router.put("/confirm/:id", confirmHire);
router.get("/owner/:ownerId", getOwnerHires);
router.get("/:id", getHireStatus);

module.exports = router;