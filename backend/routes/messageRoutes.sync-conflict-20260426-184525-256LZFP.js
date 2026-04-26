const express = require("express");
const router = express.Router();
const { sendMessage } = require("../controllers/messageController");

router.post("/", sendMessage);

module.exports = router;
