const connectDB = require("../config/db");

const COLLECTION = "user";

async function getCollection() {
	const db = await connectDB();
	return db.collection(COLLECTION);
}

async function findByEmail(email) {
	return (await getCollection()).findOne({ email });
}

async function createUser(payload) {
	const result = await (await getCollection()).insertOne(payload);
	return (await getCollection()).findOne({ _id: result.insertedId });
}

async function findById(_id) {
	return (await getCollection()).findOne({ _id });
}

module.exports = {
	findByEmail,
	createUser,
	findById,
};
