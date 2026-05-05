const { ObjectId } = require("mongodb");
const connectDB = require("../config/db");

const COLLECTION = "drivers";

async function getCollection() {
    const db = await connectDB();
    return db.collection(COLLECTION);
}

async function findByUserId(userId) {
    return (await getCollection()).findOne({ userId });
}

async function upsertByUserId(userId, payload) {
    await (await getCollection()).updateOne(
        { userId },
        {
            $set: {
                ...payload,
                userId,
                updatedAt: new Date(),
            },
            $setOnInsert: {
                createdAt: new Date(),
                totalReviews: 0,
                ratingAvg: 0,
            },
        },
        { upsert: true }
    );

    return findByUserId(userId);
}

async function findById(id) {
    return (await getCollection()).findOne({ _id: new ObjectId(id) });
}

async function listByFilter(filter) {
    return (await getCollection()).find(filter).toArray();
}

module.exports = {
    findByUserId,
    upsertByUserId,
    findById,
    listByFilter,
};