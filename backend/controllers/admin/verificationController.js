const { ObjectId } = require("mongodb");
const connectDB = require("../../config/db");

exports.verifyDriverDocument = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(String(status || "").toLowerCase())) {
      return res.status(400).json({ message: "status must be approved, rejected or pending" });
    }

    const db = await connectDB();
    await db.collection("drivers").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          "documents.status": String(status).toLowerCase(),
          updatedAt: new Date(),
        },
      }
    );

    const driver = await db.collection("drivers").findOne({ _id: new ObjectId(req.params.id) });
    // create a notification for the linked user so they'll see it on next login
    try {
      const userIdStr = String(driver?.userId || "");
      if (userIdStr) {
        const notif = {
          _id: new ObjectId(),
          type: "verification",
          status: String(status).toLowerCase(),
          message: `Your profile verification has been ${String(status).toLowerCase()}`,
          data: { driverId: String(driver._id) },
          read: false,
          createdAt: new Date(),
        };

        await db.collection("user").updateOne(
          { _id: new ObjectId(userIdStr) },
          { $push: { notifications: notif }, $set: { updatedAt: new Date() } }
        );

        // emit socket event to user room if connected
        try {
          const socketManager = require("../../socket/socketManager");
          const io = socketManager.getIo();
          io.to(`user:${userIdStr}`).emit("verification:updated", notif);
        } catch (err) {
          // socket not available or emit failed - ignore silently
          console.warn("Socket emit failed:", err.message);
        }
      }
    } catch (err) {
      console.warn("Create notification failed:", err.message);
    }

    return res.json(driver);
  } catch (err) {
    console.error("VERIFY DOCUMENT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("user").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          suspended: true,
          updatedAt: new Date(),
        },
      }
    );

    const user = await db.collection("user").findOne({ _id: new ObjectId(req.params.id) });
    return res.json(user);
  } catch (err) {
    console.error("SUSPEND USER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
