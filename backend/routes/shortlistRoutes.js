const express = require("express");
const router = express.Router();
const { addToShortlist } = require("../controllers/shortlistController");

router.post("/", addToShortlist);

module.exports = router;
