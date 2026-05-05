const connectDB = require("../config/db");

const COLLECTION = "transactions";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function createTransaction(payload) {
  const result = await (await getCollection()).insertOne({
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return (await getCollection()).findOne({ _id: result.insertedId });
}

module.exports = {
  createTransaction,
};
