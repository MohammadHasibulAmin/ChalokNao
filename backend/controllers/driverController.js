const multer = require("multer");
const path = require("path");
const { ObjectId } = require("mongodb");
const connectDB = require("../config/db");
const Driver = require("../models/Driver");
const { calculateBadges } = require("../utils/badgeUtils");

const storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function filename(req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
exports.upload = upload;

exports.createOrUpdateProfile = async (req, res) => {
  try {
    const {
      userId,
      name,
      age,
      experienceYears,
      licenseNumber,
      workType,
      expectedSalaryMonthly,
      expectedSalaryDaily,
      status,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const existing = await Driver.findByUserId(userId);
    const payload = {
      name,
      age: Number(age || 0),
      experienceYears: Number(experienceYears || 0),
      licenseNumber,
      workType,
      expectedSalary: {
        monthly: Number(expectedSalaryMonthly || 0),
        daily: Number(expectedSalaryDaily || 0),
      },
      status: status || existing?.status || "Available",
      photo: req.file ? req.file.filename : existing?.photo || null,
    };

    payload.badges = calculateBadges({ ...existing, ...payload });

    const updated = await Driver.upsertByUserId(userId, payload);
    return res.json(updated);
  } catch (err) {
    console.error("PROFILE UPSERT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    return res.json(driver);
  } catch (err) {
    console.error("GET DRIVER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ message: "userId and status are required" });
    }

    const updated = await Driver.upsertByUserId(userId, { status });
    return res.json(updated);
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.uploadDocuments = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const db = await connectDB();
    const licenseFile = req.files?.license?.[0]?.filename || null;
    const nidFile = req.files?.nid?.[0]?.filename || null;

    await db.collection("drivers").updateOne(
      { userId },
      {
        $set: {
          documents: {
            licenseUrl: licenseFile,
            nidUrl: nidFile,
            status: "pending",
          },
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const driver = await db.collection("drivers").findOne({ userId });
    return res.json(driver);
  } catch (err) {
    console.error("UPLOAD DOCS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.addEmployment = async (req, res) => {
  try {
    const { userId, employerName, duration, description } = req.body;
    if (!userId || !employerName) {
      return res.status(400).json({ message: "userId and employerName are required" });
    }

    const item = {
      _id: new ObjectId(),
      employerName,
      duration,
      description,
    };

    const db = await connectDB();
    await db.collection("drivers").updateOne(
      { userId },
      {
        $push: { employmentHistory: item },
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const driver = await db.collection("drivers").findOne({ userId });
    return res.json(driver);
  } catch (err) {
    console.error("ADD EMPLOYMENT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.updateEmployment = async (req, res) => {
  try {
    const { userId, employerName, duration, description } = req.body;
    const { id } = req.params;

    const db = await connectDB();
    await db.collection("drivers").updateOne(
      { userId, "employmentHistory._id": new ObjectId(id) },
      {
        $set: {
          "employmentHistory.$.employerName": employerName,
          "employmentHistory.$.duration": duration,
          "employmentHistory.$.description": description,
          updatedAt: new Date(),
        },
      }
    );

    const driver = await db.collection("drivers").findOne({ userId });
    return res.json(driver);
  } catch (err) {
    console.error("UPDATE EMPLOYMENT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteEmployment = async (req, res) => {
  try {
    const { userId } = req.query;
    const { id } = req.params;

    const db = await connectDB();
    await db.collection("drivers").updateOne(
      { userId },
      {
        $pull: { employmentHistory: { _id: new ObjectId(id) } },
        $set: { updatedAt: new Date() },
      }
    );

    const driver = await db.collection("drivers").findOne({ userId });
    return res.json(driver);
  } catch (err) {
    console.error("DELETE EMPLOYMENT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.addAvailability = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;

    const db = await connectDB();
    await db.collection("drivers").updateOne(
      { userId },
      {
        $push: {
          availability: {
            _id: new ObjectId(),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
        },
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const driver = await db.collection("drivers").findOne({ userId });
    return res.json(driver?.availability || []);
  } catch (err) {
    console.error("ADD AVAILABILITY ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const db = await connectDB();
    const driver = await db.collection("drivers").findOne({ userId: req.query.userId });
    return res.json(driver?.availability || []);
  } catch (err) {
    console.error("GET AVAILABILITY ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.setLocation = async (req, res) => {
  try {
    const { userId, city, lat, lng, serviceAreas } = req.body;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const existing = await Driver.findByUserId(userId);

    const normalizedServiceAreas = Array.isArray(serviceAreas)
      ? serviceAreas
          .map((area) => {
            const locationCity = String(area?.city || area?.name || area || "").trim();

            if (!locationCity) {
              return null;
            }

            const areaLat = Number(area?.coordinates?.lat ?? area?.lat);
            const areaLng = Number(area?.coordinates?.lng ?? area?.lng);

            return {
              city: locationCity,
              coordinates: {
                lat: Number.isFinite(areaLat) ? areaLat : null,
                lng: Number.isFinite(areaLng) ? areaLng : null,
              },
            };
          })
          .filter(Boolean)
      : [];

    const primaryCity = String(city || normalizedServiceAreas[0]?.city || existing?.location?.city || "").trim();

    const updated = await Driver.upsertByUserId(userId, {
      location: {
        city: primaryCity,
        coordinates: {
          lat: Number.isFinite(parsedLat) ? parsedLat : null,
          lng: Number.isFinite(parsedLng) ? parsedLng : null,
        },
        serviceAreas: normalizedServiceAreas,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("SET LOCATION ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.setSalary = async (req, res) => {
  try {
    const { userId, monthly, daily } = req.body;

    const updated = await Driver.upsertByUserId(userId, {
      expectedSalary: {
        monthly: Number(monthly || 0),
        daily: Number(daily || 0),
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("SET SALARY ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { userId } = req.query;
    const db = await connectDB();

    const [interviews, hires, driver] = await Promise.all([
      db.collection("interviews").countDocuments({ driverId: userId }),
      db.collection("hires").countDocuments({ driverId: userId, status: "Confirmed" }),
      db.collection("drivers").findOne({ userId }),
    ]);

    return res.json({
      totalInterviews: interviews,
      totalHires: hires,
      ratingAvg: Number(driver?.ratingAvg || 0),
    });
  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.searchDrivers = async (req, res) => {
  try {
    const { salary, location, rating, workType, status } = req.query;
    const db = await connectDB();

    const driverUsers = await db
      .collection("user")
      .find({ role: "driver" }, { projection: { name: 1, email: 1 } })
      .toArray();

    const driverUserIds = driverUsers.map((user) => String(user._id));

    const existingDriverDocs = driverUserIds.length
      ? await db
          .collection("drivers")
          .find({ userId: { $in: driverUserIds } }, { projection: { userId: 1 } })
          .toArray()
      : [];

    const existingUserIdSet = new Set(existingDriverDocs.map((doc) => String(doc.userId)));
    const missingDriverUsers = driverUsers.filter((user) => !existingUserIdSet.has(String(user._id)));

    if (missingDriverUsers.length) {
      await db.collection("drivers").bulkWrite(
        missingDriverUsers.map((user) => ({
          updateOne: {
            filter: { userId: String(user._id) },
            update: {
              $setOnInsert: {
                userId: String(user._id),
                name: user.name || "",
                status: "Available",
                experienceYears: 0,
                expectedSalary: { monthly: 0, daily: 0 },
                location: { city: "", coordinates: {} },
                ratingAvg: 0,
                totalReviews: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
            upsert: true,
          },
        }))
      );
    }

    const query = {};

    if (location) {
      query.$or = [
        { "location.city": { $regex: location, $options: "i" } },
        { location: { $regex: location, $options: "i" } },
        { locationCity: { $regex: location, $options: "i" } },
      ];
    }

    if (rating) {
      query.ratingAvg = { $gte: Number(rating) };
    }

    if (salary) {
      query["expectedSalary.monthly"] = { $lte: Number(salary) };
    }

    if (workType) {
      query.workType = { $regex: `^${workType}$`, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    const drivers = await Driver.listByFilter(query);

    const userMap = new Map(driverUsers.map((user) => [String(user._id), user]));

    const normalizedDrivers = drivers.map((driver) => {
      const linkedUser = userMap.get(String(driver.userId));
      const locationCity = typeof driver.location === "string"
        ? driver.location
        : driver.location?.city || "";

      return {
        ...driver,
        name: driver.name || linkedUser?.name || "",
        userName: linkedUser?.name || "",
        userEmail: linkedUser?.email || "",
        locationCity,
      };
    });

    return res.json(normalizedDrivers);
  } catch (err) {
    console.error("SEARCH DRIVERS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};