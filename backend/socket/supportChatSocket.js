const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");
const Message = require("../models/Message");

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

function setupSupportChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const currentUserId = String(socket.user.id);
    const role = socket.user.role;

    socket.join(`user:${currentUserId}`);
    if (role === "admin") {
      socket.join("support:admins");
    }

    socket.on("support:send", async (payload, callback) => {
      try {
        const text = String(payload?.message || "").trim();
        if (!text) {
          callback?.({ ok: false, message: "message is required" });
          return;
        }

        const admin = await findSupportAdmin();
        if (!admin) {
          callback?.({ ok: false, message: "No admin account available for support" });
          return;
        }

        const receiverId =
          role === "admin"
            ? String(payload?.receiverId || "").trim()
            : String(admin._id);

        if (!receiverId) {
          callback?.({ ok: false, message: "receiverId is required for admin" });
          return;
        }

        const saved = await Message.createMessage({
          senderId: currentUserId,
          receiverId,
          message: text,
          timestamp: new Date(),
          readByReceiver: false,
        });

        io.to(`user:${currentUserId}`).emit("support:new-message", saved);
        io.to(`user:${receiverId}`).emit("support:new-message", saved);
        io.to("support:admins").emit("support:inbox-updated", {
          userId: role === "admin" ? receiverId : currentUserId,
          timestamp: saved.timestamp,
        });

        callback?.({ ok: true, message: saved });
      } catch (err) {
        callback?.({ ok: false, message: err.message });
      }
    });
  });
}

module.exports = setupSupportChatSocket;
