const Message = require("../models/Message");
const connectDB = require("../config/db");

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: "senderId, receiverId and message are required" });
    }

    const saved = await Message.createMessage({
      senderId,
      receiverId,
      message,
      timestamp: new Date(),
    });

    return res.status(201).json(saved);
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

async function findSupportAdmin() {
  const db = await connectDB();
  const admin = await db
    .collection("user")
    .find({ role: "admin" })
    .sort({ createdAt: 1 })
    .limit(1)
    .toArray();

  return admin[0] || null;
}

function normalizeText(text) {
  return String(text || "").trim();
}

exports.getMySupportConversation = async (req, res) => {
  try {
    const sender = req.user;
    const targetUserId = sender.role === "admin" ? req.params.userId : sender.id;

    if (!targetUserId) {
      return res.status(400).json({ message: "userId is required for admin" });
    }

    const admin = await findSupportAdmin();
    if (!admin) {
      return res.status(404).json({ message: "No admin account available for support" });
    }

    const messages = await Message.listConversationBetweenUsers(String(targetUserId), String(admin._id));

    if (sender.role === "admin") {
      await Message.markMessagesAsRead({ fromUserId: targetUserId, toUserId: String(admin._id) });
    } else {
      await Message.markMessagesAsRead({ fromUserId: String(admin._id), toUserId: sender.id });
    }

    return res.json({
      admin: { id: String(admin._id), name: admin.name || "Support Admin" },
      messages,
    });
  } catch (err) {
    console.error("GET SUPPORT CONVERSATION ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.sendSupportMessage = async (req, res) => {
  try {
    const sender = req.user;
    const admin = await findSupportAdmin();

    if (!admin) {
      return res.status(404).json({ message: "No admin account available for support" });
    }

    const text = normalizeText(req.body.message);
    if (!text) {
      return res.status(400).json({ message: "message is required" });
    }

    const receiverId =
      sender.role === "admin"
        ? String(req.body.receiverId || "").trim()
        : String(admin._id);

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required for admin" });
    }

    const saved = await Message.createMessage({
      senderId: String(sender.id),
      receiverId,
      message: text,
      timestamp: new Date(),
      readByReceiver: false,
    });

    return res.status(201).json(saved);
  } catch (err) {
    console.error("SEND SUPPORT MESSAGE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getSupportConversationsForAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const adminId = String(req.user.id);
    const db = await connectDB();
    const users = await db.collection("user").find({}).toArray();
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    const messages = await Message.listSupportMessagesForAdmin(adminId);
    const byConversation = new Map();

    for (const item of messages) {
      const senderId = String(item.senderId);
      const receiverId = String(item.receiverId);
      const participantId = senderId === adminId ? receiverId : senderId;

      if (!participantId || participantId === adminId) {
        continue;
      }

      if (!byConversation.has(participantId)) {
        byConversation.set(participantId, {
          userId: participantId,
          userName: userMap.get(participantId)?.name || "Unknown User",
          userRole: userMap.get(participantId)?.role || "user",
          lastMessage: item.message,
          lastMessageAt: item.timestamp,
          unreadCount: 0,
        });
      }

      const current = byConversation.get(participantId);
      if (senderId !== adminId && !item.readByReceiver) {
        current.unreadCount += 1;
      }
    }

    return res.json(Array.from(byConversation.values()));
  } catch (err) {
    console.error("GET ADMIN SUPPORT CONVERSATIONS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
