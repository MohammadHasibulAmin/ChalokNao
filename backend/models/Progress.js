const connectDB = require("../config/db");

const COLLECTION = "progress";

async function getCollection() {
  const db = await connectDB();
  return db.collection(COLLECTION);
}

async function createProgress(payload) {
  const result = await (await getCollection()).insertOne({
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return (await getCollection()).findOne({ _id: result.insertedId });
}

async function upsertProgress({ driverId, trainingId, completed, score, moduleTitle, certificateIssued }) {
  await (await getCollection()).updateOne(
    { driverId: String(driverId), trainingId: String(trainingId) },
    {
      $set: {
        completed: Boolean(completed),
        score: Number(score || 0),
        moduleTitle: moduleTitle || "",
        certificateIssued: Boolean(certificateIssued),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return (await getCollection()).findOne({ driverId: String(driverId), trainingId: String(trainingId) });
}

async function listProgressByDriver(driverId) {
  return (await getCollection())
    .find({ driverId: String(driverId) })
    .sort({ updatedAt: -1 })
    .toArray();
}

module.exports = {
  createProgress,
  upsertProgress,
  listProgressByDriver,
};
