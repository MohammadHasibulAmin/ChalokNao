const { ObjectId } = require("mongodb");
const connectDB = require("../config/db");

const COLLECTION = "transactions";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function createTransaction(payload) {
  const result = await (await getCollection()).insertOne({
    ...payload,
    status: payload.status || "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return (await getCollection()).findOne({ _id: result.insertedId });
}

async function findById(id) {
  return (await getCollection()).findOne({ _id: new ObjectId(id) });
}

async function findAll(filter = {}) {
  return (await getCollection()).find(filter).sort({ createdAt: -1 }).toArray();
}

async function updateTransaction(id, payload) {
  await (await getCollection()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...payload, updatedAt: new Date() } }
  );
  return (await getCollection()).findOne({ _id: new ObjectId(id) });
}

module.exports = {
  createTransaction,
  findById,
  findAll,
  updateTransaction,
};
