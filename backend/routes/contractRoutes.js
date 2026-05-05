const express = require("express");
const router = express.Router();
const { createContract, getOwnerContracts } = require("../controllers/contractController");

router.post("/", createContract);
router.get("/owner/:ownerId", getOwnerContracts);

module.exports = router;
