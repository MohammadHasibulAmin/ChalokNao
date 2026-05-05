const connectDB = require("../config/db");

const COLLECTION = "messages";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function createMessage(payload) {
  const result = await (await getCollection()).insertOne({
    ...payload,
    timestamp: payload.timestamp || new Date(),
    readByReceiver: Boolean(payload.readByReceiver),
  });
  return (await getCollection()).findOne({ _id: result.insertedId });
}

async function listConversationBetweenUsers(userAId, userBId) {
  return (await getCollection())
    .find({
      $or: [
        { senderId: String(userAId), receiverId: String(userBId) },
        { senderId: String(userBId), receiverId: String(userAId) },
      ],
    })
    .sort({ timestamp: 1 })
    .toArray();
}

async function listSupportMessagesForAdmin(adminId) {
  return (await getCollection())
    .find({
      $or: [{ senderId: String(adminId) }, { receiverId: String(adminId) }],
    })
    .sort({ timestamp: -1 })
    .toArray();
}

async function markMessagesAsRead({ fromUserId, toUserId }) {
  const result = await (await getCollection()).updateMany(
    {
      senderId: String(fromUserId),
      receiverId: String(toUserId),
      readByReceiver: { $ne: true },
    },
    {
      $set: { readByReceiver: true },
    }
  );

  return result.modifiedCount || 0;
}

module.exports = {
  createMessage,
  listConversationBetweenUsers,
  listSupportMessagesForAdmin,
  markMessagesAsRead,
};
