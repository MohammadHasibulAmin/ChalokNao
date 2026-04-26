const { ObjectId } = require("mongodb");
const connectDB = require("../../config/db");

exports.verifyDriverDocument = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(String(status || "").toLowerCase())) {
      return res.status(400).json({ message: "status must be approved, rejected or pending" });
    }

    const db = await connectDB();
    await db.collection("drivers").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          "documents.status": String(status).toLowerCase(),
          updatedAt: new Date(),
        },
      }
    );

    const driver = await db.collection("drivers").findOne({ _id: new ObjectId(req.params.id) });
    return res.json(driver);
  } catch (err) {
    console.error("VERIFY DOCUMENT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("user").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          suspended: true,
          updatedAt: new Date(),
        },
      }
    );

    const user = await db.collection("user").findOne({ _id: new ObjectId(req.params.id) });
    return res.json(user);
  } catch (err) {
    console.error("SUSPEND USER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
