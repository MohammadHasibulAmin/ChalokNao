const express = require("express");
const router = express.Router();
const {
	sendMessage,
	getDirectConversation,
	sendDirectMessage,
	sendSupportMessage,
	getMySupportConversation,
	getSupportConversationsForAdmin,
} = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", sendMessage);
router.get("/direct/:otherUserId", authMiddleware, getDirectConversation);
router.post("/direct", authMiddleware, sendDirectMessage);
router.get("/support/conversations", authMiddleware, getSupportConversationsForAdmin);
router.get("/support/:userId", authMiddleware, getMySupportConversation);
router.get("/support", authMiddleware, getMySupportConversation);
router.post("/support", authMiddleware, sendSupportMessage);

module.exports = router;
