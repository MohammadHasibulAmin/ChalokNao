// backend/controllers/driverController.js
const connectDB = require("../config/db");
const multer = require("multer");
const path = require("path");

// Multer storage config
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/"); // make sure this folder exists
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Export upload middleware
const upload = multer({ storage });
exports.upload = upload;

// CREATE / UPDATE DRIVER PROFILE
exports.createOrUpdateProfile = async (req, res) => {
    try {
        const db = await connectDB();

        // All fields come from FormData
        const { userId, age, experience, licenseNumber, workType, salaryExpectation, location } = req.body;

        if (!userId) return res.status(400).json({ message: "userId is required" });

        const driverCollection = db.collection("drivers");

        // Check if driver exists
        let driver = await driverCollection.findOne({ userId });

        const driverData = {
            userId,
            age,
            experience,
            licenseNumber,
            workType,
            salaryExpectation,
            location,
            photo: req.file ? req.file.filename : null
        };

        if (driver) {
            // Update driver
            await driverCollection.updateOne({ userId }, { $set: driverData });
            driver = await driverCollection.findOne({ userId });
        } else {
            // Insert new driver
            const result = await driverCollection.insertOne(driverData);
            driver = await driverCollection.findOne({ _id: result.insertedId });
        }

        res.json(driver);
    } catch (err) {
        console.error("FULL ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};

// SEARCH DRIVERS
exports.searchDrivers = async (req, res) => {
    try {
        const db = await connectDB();
        const { location } = req.query;
        const drivers = await db.collection("drivers").find({ location }).toArray();
        res.json(drivers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};