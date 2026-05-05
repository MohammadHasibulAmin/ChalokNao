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

async function removeDriver(ownerId, driverId) {
  await (await getCollection()).updateOne(
    { ownerId },
    {
      $set: { updatedAt: new Date() },
      $pull: { driverIds: driverId },
    }
  );

  return (await getCollection()).findOne({ ownerId });
}

async function listByOwner(ownerId) {
  return (await getCollection()).findOne({ ownerId });
}

module.exports = {
  addDriver,
  listByOwner,
  removeDriver,
};
