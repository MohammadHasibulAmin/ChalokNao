const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

// CREATE / UPDATE DRIVER PROFILE
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const db = await connectDB();
    const { userId, age, experience, licenseNumber, workType, salaryExpectation, location } = req.body;

    if (!userId) return res.status(400).json({ message: "userId is required" });

    const driverCollection = db.collection("drivers");

    // Check if driver profile exists
    let driver = await driverCollection.findOne({ userId });

    if (driver) {
      // update existing
      const updateResult = await driverCollection.updateOne(
        { userId },
        {
          $set: { age, experience, licenseNumber, workType, salaryExpectation, location },
        }
      );
      driver = await driverCollection.findOne({ userId });
    } else {
      // create new
      const insertResult = await driverCollection.insertOne({
        userId,
        age,
        experience,
        licenseNumber,
        workType,
        salaryExpectation,
        location,
      });
      driver = await driverCollection.findOne({ _id: insertResult.insertedId });
    }

    res.json(driver);

  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// SEARCH DRIVERS BY LOCATION
exports.searchDrivers = async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) return res.status(400).json({ message: "location query is required" });

    const db = await connectDB();
    const drivers = await db.collection("drivers").find({ location }).toArray();

    res.json(drivers);

  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};