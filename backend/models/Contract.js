const connectDB = require("../config/db");

const COLLECTION = "contracts";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function createContract(payload) {
  const result = await (await getCollection()).insertOne({
    ...payload,
    paymentStatus: payload.paymentStatus || "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return (await getCollection()).findOne({ _id: result.insertedId });
}

async function listByOwner(ownerId) {
  return (await getCollection()).find({ ownerId }).sort({ createdAt: -1 }).toArray();
}

module.exports = {
  createContract,
  listByOwner,
};
