const connectDB = require("../config/db");

const COLLECTION = "shortlists";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function addDriver(ownerId, driverId) {
  await (await getCollection()).updateOne(
    { ownerId },
    {
      $setOnInsert: { createdAt: new Date() },
      $set: { updatedAt: new Date() },
      $addToSet: { driverIds: driverId },
    },
    { upsert: true }
  );

  return (await getCollection()).findOne({ ownerId });
}

module.exports = {
  addDriver,
};
