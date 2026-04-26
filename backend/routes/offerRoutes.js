const express = require("express");
const router = express.Router();
const { createOffer } = require("../controllers/offerController");

router.post("/", createOffer);

module.exports = router;
