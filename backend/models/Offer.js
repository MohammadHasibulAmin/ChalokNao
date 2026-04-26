const connectDB = require("../config/db");

const COLLECTION = "offers";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function createOffer(payload) {
  const result = await (await getCollection()).insertOne({
    ...payload,
    status: payload.status || "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return (await getCollection()).findOne({ _id: result.insertedId });
}

module.exports = {
  createOffer,
};
