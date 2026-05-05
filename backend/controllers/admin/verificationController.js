const { ObjectId } = require("mongodb");
const connectDB = require("../../config/db");
const Report = require("../../models/Report");
const Transaction = require("../../models/Transaction");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");

const COMMISSION_PERCENTAGE = 0.15; // 15% commission

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
    try {
      const userIdStr = String(driver?.userId || "");
      if (userIdStr) {
        const notif = {
          _id: new ObjectId(),
          type: "verification",
          status: String(status).toLowerCase(),
          message: `Your profile verification has been ${String(status).toLowerCase()}`,
          data: { driverId: String(driver._id) },
          read: false,
          createdAt: new Date(),
        };

        await db.collection("user").updateOne(
          { _id: new ObjectId(userIdStr) },
          { $push: { notifications: notif }, $set: { updatedAt: new Date() } }
        );

        try {
          const socketManager = require("../../socket/socketManager");
          const io = socketManager.getIo();
          io.to(`user:${userIdStr}`).emit("verification:updated", notif);
        } catch (err) {
          console.warn("Socket emit failed:", err.message);
        }
      }
    } catch (err) {
      console.warn("Create notification failed:", err.message);
    }

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
          suspendedAt: new Date(),
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

exports.resumeUser = async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("user").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          suspended: false,
          resumedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const user = await db.collection("user").findOne({ _id: new ObjectId(req.params.id) });
    return res.json(user);
  } catch (err) {
    console.error("RESUME USER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const db = await connectDB();
    const drivers = await db.collection("drivers").find({}).sort({ createdAt: -1 }).toArray();
    return res.json(drivers);
  } catch (err) {
    console.error("GET ALL DRIVERS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getSuspendedUsers = async (req, res) => {
  try {
    const db = await connectDB();
    const users = await db.collection("user").find({ suspended: true }).sort({ suspendedAt: -1 }).toArray();
    return res.json(users);
  } catch (err) {
    console.error("GET SUSPENDED USERS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const reports = await Report.findAll(filter);
    return res.json(reports);
  } catch (err) {
    console.error("GET REPORTS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { reportedById, reportedUserId, reason, description, type } = req.body;
    if (!reportedById || !reportedUserId || !reason) {
      return res.status(400).json({ message: "reportedById, reportedUserId, and reason are required" });
    }

    const report = await Report.createReport({
      reportedById,
      reportedUserId,
      reason,
      description,
      type: type || "misconduct",
      status: "open",
    });

    return res.status(201).json(report);
  } catch (err) {
    console.error("CREATE REPORT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { resolution } = req.body;
    if (!resolution) {
      return res.status(400).json({ message: "resolution is required" });
    }

    const report = await Report.updateReport(req.params.id, {
      status: "resolved",
      resolution,
      resolvedAt: new Date(),
    });

    return res.json(report);
  } catch (err) {
    console.error("RESOLVE REPORT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.ownerId) filter.ownerId = req.query.ownerId;

    const transactions = await Transaction.findAll(filter);
    return res.json(transactions);
  } catch (err) {
    console.error("GET TRANSACTIONS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.processHireConfirmation = async (req, res) => {
  try {
    const { hireId, ownerId, salary, stripeCustomerId } = req.body;
    if (!hireId || !ownerId || !salary) {
      return res.status(400).json({ message: "hireId, ownerId, and salary are required" });
    }

    const commission = Math.round(Number(salary) * COMMISSION_PERCENTAGE * 100) / 100;
    const ownerAmount = Math.round((Number(salary) - commission) * 100) / 100;

    let stripePaymentIntentId = null;

    if (stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(salary * 100), // Convert to cents
          currency: "bdt",
          customer: stripeCustomerId,
          description: `Hire payment for hire ${hireId}`,
          metadata: { hireId, ownerId },
        });
        stripePaymentIntentId = paymentIntent.id;
      } catch (err) {
        console.warn("Stripe payment intent creation failed:", err.message);
      }
    }

    const transaction = await Transaction.createTransaction({
      hireId,
      ownerId,
      amount: Number(salary),
      commission,
      ownerAmount,
      stripePaymentIntentId,
      status: stripePaymentIntentId ? "pending_payment" : "completed",
      type: "hire_confirmation",
    });

    return res.status(201).json(transaction);
  } catch (err) {
    console.error("PROCESS HIRE CONFIRMATION ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.completeTransaction = async (req, res) => {
  try {
    const { stripePaymentIntentId } = req.body;
    if (!stripePaymentIntentId && !req.params.id) {
      return res.status(400).json({ message: "Transaction ID or Stripe Payment Intent ID is required" });
    }

    const db = await connectDB();
    const query = req.params.id
      ? { _id: new ObjectId(req.params.id) }
      : { stripePaymentIntentId };

    const transaction = await Transaction.findAll(query);
    if (!transaction || transaction.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const updated = await Transaction.updateTransaction(
      transaction[0]._id.toString(),
      { status: "completed", completedAt: new Date() }
    );

    return res.json(updated);
  } catch (err) {
    console.error("COMPLETE TRANSACTION ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const db = await connectDB();

    const totalDrivers = await db.collection("drivers").countDocuments({});
    const verifiedDrivers = await db.collection("drivers").countDocuments({
      "documents.status": "approved",
    });
    const pendingVerifications = await db.collection("drivers").countDocuments({
      "documents.status": "pending",
    });
    const suspendedUsers = await db.collection("user").countDocuments({ suspended: true });

    const transactions = await Transaction.findAll({});
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.commission || 0), 0);
    const completedTransactions = transactions.filter((t) => t.status === "completed").length;

    const reports = await Report.findAll({});
    const openReports = reports.filter((r) => r.status === "open").length;

    return res.json({
      totalDrivers,
      verifiedDrivers,
      pendingVerifications,
      suspendedUsers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      completedTransactions,
      openReports,
    });
  } catch (err) {
    console.error("GET DASHBOARD STATS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
