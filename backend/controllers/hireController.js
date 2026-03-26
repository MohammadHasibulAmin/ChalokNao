const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

// CREATE / UPDATE HIRE
exports.createOrUpdateHire = async (req, res) => {
  try {
    const db = await connectDB();
    const { hireId, candidateName, position, startDate, salary } = req.body;

    const collection = db.collection("hires");

    if (hireId) {
      // Update existing hire
      await collection.updateOne(
        { _id: new ObjectId(hireId) },
        { $set: { candidateName, position, startDate, salary } }
      );
      const updated = await collection.findOne({ _id: new ObjectId(hireId) });
      return res.json(updated);
    }

    // Create new hire
    const insertResult = await collection.insertOne({
      candidateName,
      position,
      startDate,
      salary,
    });

    const newHire = await collection.findOne({ _id: insertResult.insertedId });
    res.json(newHire);

  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL HIRES
exports.getAllHires = async (req, res) => {
  try {
    const db = await connectDB();
    const hires = await db.collection("hires").find({}).toArray();
    res.json(hires);
  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET HIRE BY ID
exports.getHireById = async (req, res) => {
  try {
    const db = await connectDB();
    const hire = await db.collection("hires").findOne({ _id: new ObjectId(req.params.id) });
    if (!hire) return res.status(404).json({ message: "Hire not found" });
    res.json(hire);
  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE HIRE
exports.deleteHire = async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("hires").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Hire not found" });
    res.json({ message: "Hire deleted successfully" });
  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};