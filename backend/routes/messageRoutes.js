const express = require("express");
const router = express.Router();
const {
	sendMessage,
	sendSupportMessage,
	getMySupportConversation,
	getSupportConversationsForAdmin,
} = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", sendMessage);
router.get("/support/conversations", authMiddleware, getSupportConversationsForAdmin);
router.get("/support/:userId", authMiddleware, getMySupportConversation);
router.get("/support", authMiddleware, getMySupportConversation);
router.post("/support", authMiddleware, sendSupportMessage);

module.exports = router;
