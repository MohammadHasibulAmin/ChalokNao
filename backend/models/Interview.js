const { ObjectId } = require("mongodb");
const connectDB = require("../config/db");

const COLLECTION = "interviews";

async function getCollection() {
    const db = await connectDB();
    return db.collection(COLLECTION);
}

async function createInterview(payload) {
    const result = await (await getCollection()).insertOne({
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return (await getCollection()).findOne({ _id: result.insertedId });
}

async function updateInterviewStatus(id, status) {
    await (await getCollection()).updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } }
    );
    return (await getCollection()).findOne({ _id: new ObjectId(id) });
}

async function listByDriver(driverId) {
    return (await getCollection()).find({ driverId }).sort({ createdAt: -1 }).toArray();
}

async function listByOwner(ownerId) {
    return (await getCollection()).find({ ownerId }).sort({ createdAt: -1 }).toArray();
}

module.exports = {
    createInterview,
    updateInterviewStatus,
    listByDriver,
    listByOwner,
};