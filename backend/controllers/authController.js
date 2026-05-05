const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const User = require("../models/User");
const connectDB = require("../config/db");

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const passwordMatches = async (plainPassword, storedPassword) => {
  if (!storedPassword) {
    return false;
  }

  if (await bcrypt.compare(plainPassword, storedPassword)) {
    return true;
  }

  return plainPassword === storedPassword;
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await User.createUser({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (role === "driver") {
      const db = await connectDB();
      await db.collection("drivers").updateOne(
        { userId: String(created._id) },
        {
          $setOnInsert: {
            userId: String(created._id),
            name,
            status: "Available",
            experienceYears: 0,
            expectedSalary: { monthly: 0, daily: 0 },
            location: { city: "", coordinates: {}, serviceAreas: [] },
            ratingAvg: 0,
            totalReviews: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return res.status(201).json({
      message: "Registered successfully",
      userId: created._id,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await passwordMatches(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (user.password === password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const db = await connectDB();
      await db.collection("user").updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        notifications: Array.isArray(user.notifications) ? user.notifications.filter((notification) => !notification.read) : [],
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    if (!notificationId) {
      return res.status(400).json({ message: "notificationId is required" });
    }

    const db = await connectDB();
    const result = await db.collection("user").updateOne(
      { _id: new ObjectId(req.user.id), "notifications._id": new ObjectId(notificationId) },
      {
        $set: {
          "notifications.$.read": true,
          "notifications.$.readAt": new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("MARK NOTIFICATION READ ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};