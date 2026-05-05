const connectDB = require("../config/db");

const COLLECTION = "trainings";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function listTrainings() {
  return (await getCollection()).find({}).sort({ createdAt: -1 }).toArray();
}

module.exports = {
  listTrainings,
};
