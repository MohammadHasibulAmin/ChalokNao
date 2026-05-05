const { ObjectId } = require("mongodb");
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

async function getOfferById(offerId) {
  return (await getCollection()).findOne({ _id: new ObjectId(offerId) });
}

async function getOffersByDriverId(driverId) {
  return (await getCollection())
    .find({ driverId })
    .sort({ createdAt: -1 })
    .toArray();
}

async function getOffersByOwnerId(ownerId) {
  return (await getCollection())
    .find({ ownerId })
    .sort({ createdAt: -1 })
    .toArray();
}

async function updateOfferStatus(offerId, status) {
  const result = await (await getCollection()).findOneAndUpdate(
    { _id: new ObjectId(offerId) },
    {
      $set: {
        status,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  return result.value;
}

async function deleteOffer(offerId) {
  const result = await (await getCollection()).deleteOne({ _id: new ObjectId(offerId) });
  return result.deletedCount > 0;
}

module.exports = {
  createOffer,
  getOfferById,
  getOffersByDriverId,
  getOffersByOwnerId,
  updateOfferStatus,
  deleteOffer,
};
