const Offer = require("../models/Offer");
const Driver = require("../models/Driver");
const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

exports.createOffer = async (req, res) => {
  try {
    const { ownerId, driverId, salary, duration, hireId, driverName } = req.body;
    if (!ownerId || !driverId || !salary) {
      return res.status(400).json({ message: "ownerId, driverId and salary are required" });
    }

    const offer = await Offer.createOffer({
      ownerId,
      driverId,
      hireId: hireId || null,
      driverName: driverName || "Unknown",
      salary: Number(salary),
      duration: duration || null,
      status: "pending",
    });

    // Send notification to driver
    try {
      const db = await connectDB();
      const driverIdStr = String(driverId || "");
      if (driverIdStr) {
        const notif = {
          _id: new ObjectId(),
          type: "offer",
          status: "pending",
          message: `You have received a job offer with salary $${salary}`,
          data: { offerId: String(offer._id), hireId: hireId || null },
          read: false,
          createdAt: new Date(),
        };

        await db.collection("user").updateOne(
          { _id: new ObjectId(driverIdStr) },
          { $push: { notifications: notif }, $set: { updatedAt: new Date() } }
        );

        try {
          const socketManager = require("../socket/socketManager");
          const io = socketManager.getIo();
          io.to(`user:${driverIdStr}`).emit("offer:created", notif);
        } catch (err) {
          console.warn("Offer socket emit failed:", err.message);
        }
      }
    } catch (err) {
      console.warn("Offer notification creation failed:", err.message);
    }

    return res.status(201).json(offer);
  } catch (err) {
    console.error("CREATE OFFER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getOffersByDriver = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const offers = await Offer.getOffersByDriverId(userId);
    return res.json(offers || []);
  } catch (err) {
    console.error("GET DRIVER OFFERS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getOffersByOwner = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const offers = await Offer.getOffersByOwnerId(userId);
    return res.json(offers || []);
  } catch (err) {
    console.error("GET OWNER OFFERS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.updateOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const offer = await Offer.updateOfferStatus(offerId, status);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // If driver accepts the offer, update the hire status to AwaitingPayment
    if (status === "accepted" && offer.hireId) {
      try {
        const Hire = require("../models/Hire");
        const hire = await Hire.findById(offer.hireId);
        if (hire) {
          // Update hire with driver confirmation and set status to AwaitingPayment
          const Transaction = require("../models/Transaction");
          const COMMISSION_PERCENTAGE = 0.15; // 15% commission
          
          const commission = Math.round(Number(hire.salary) * COMMISSION_PERCENTAGE * 100) / 100;
          const ownerAmount = Math.round((Number(hire.salary) - commission) * 100) / 100;

          const tx = await Transaction.createTransaction({
            hireId: String(hire._id),
            ownerId: hire.ownerId,
            driverId: hire.driverId,
            amount: Number(hire.salary),
            commission,
            ownerAmount,
            status: "pending",
            type: "hire_confirmation",
          });

          await Hire.updateHire(offer.hireId, {
            driverConfirm: true,
            status: "AwaitingPayment",
            transactionId: String(tx._id),
          });

          // Send notification to owner
          try {
            const db = await connectDB();
            const ownerIdStr = String(hire.ownerId || "");
            if (ownerIdStr) {
              const notif = {
                _id: new ObjectId(),
                type: "offer",
                status: "accepted",
                message: "Driver has accepted the job offer. Proceed to payment.",
                data: { offerId: String(offer._id), hireId: String(hire._id) },
                read: false,
                createdAt: new Date(),
              };

              await db.collection("user").updateOne(
                { _id: new ObjectId(ownerIdStr) },
                { $push: { notifications: notif }, $set: { updatedAt: new Date() } }
              );

              try {
                const socketManager = require("../socket/socketManager");
                const io = socketManager.getIo();
                io.to(`user:${ownerIdStr}`).emit("offer:accepted", notif);
              } catch (err) {
                console.warn("Offer accepted socket emit failed:", err.message);
              }
            }
          } catch (err) {
            console.warn("Offer acceptance notification creation failed:", err.message);
          }
        }
      } catch (err) {
        console.warn("Hire update after offer acceptance failed:", err.message);
      }
    }

    // If driver rejects the offer, send notification to owner
    if (status === "rejected") {
      try {
        const db = await connectDB();
        const ownerIdStr = String(offer.ownerId || "");
        if (ownerIdStr) {
          const notif = {
            _id: new ObjectId(),
            type: "offer",
            status: "rejected",
            message: "Driver has rejected the job offer.",
            data: { offerId: String(offer._id), hireId: offer.hireId || null },
            read: false,
            createdAt: new Date(),
          };

          await db.collection("user").updateOne(
            { _id: new ObjectId(ownerIdStr) },
            { $push: { notifications: notif }, $set: { updatedAt: new Date() } }
          );

          try {
            const socketManager = require("../socket/socketManager");
            const io = socketManager.getIo();
            io.to(`user:${ownerIdStr}`).emit("offer:rejected", notif);
          } catch (err) {
            console.warn("Offer rejected socket emit failed:", err.message);
          }
        }
      } catch (err) {
        console.warn("Offer rejection notification creation failed:", err.message);
      }
    }

    return res.json(offer);
  } catch (err) {
    console.error("UPDATE OFFER STATUS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getOfferById = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.getOfferById(offerId);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    return res.json(offer);
  } catch (err) {
    console.error("GET OFFER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const deleted = await Offer.deleteOffer(offerId);

    if (!deleted) {
      return res.status(404).json({ message: "Offer not found" });
    }

    return res.json({ message: "Offer deleted successfully" });
  } catch (err) {
    console.error("DELETE OFFER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
