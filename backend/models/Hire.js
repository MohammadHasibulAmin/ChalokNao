const { ObjectId } = require("mongodb");
const connectDB = require("../config/db");

const COLLECTION = "hires";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function createHire(payload) {
  const result = await (await getCollection()).insertOne({
    ...payload,
    status: "Pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return (await getCollection()).findOne({ _id: result.insertedId });
}

async function updateHire(id, payload) {
  await (await getCollection()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...payload, updatedAt: new Date() } }
  );
  return (await getCollection()).findOne({ _id: new ObjectId(id) });
}

async function findById(id) {
  return (await getCollection()).findOne({ _id: new ObjectId(id) });
}

async function listByOwner(ownerId) {
  return (await getCollection()).find({ ownerId }).sort({ createdAt: -1 }).toArray();
}

module.exports = {
  createHire,
  updateHire,
  findById,
  listByOwner,
};