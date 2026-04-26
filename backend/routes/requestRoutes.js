const express = require("express");
const router = express.Router();
const { createShortTermRequest } = require("../controllers/requestController");

router.post("/", createShortTermRequest);

module.exports = router;
