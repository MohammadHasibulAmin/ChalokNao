const Offer = require("../models/Offer");
const Driver = require("../models/Driver");
const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

async function resolveDriverRecipientId(driverRef) {
  const driverKey = String(driverRef || "").trim();
  if (!driverKey) return null;

  try {
    const driverByUser = await Driver.findByUserId(driverKey);
    if (driverByUser?.userId) {
      return String(driverByUser.userId);
    }
  } catch (_) {
    // fall through to collection lookup
  }

  try {
    const db = await connectDB();
    const driverDoc = await db.collection("drivers").findOne({
      $or: [
        ...(String(driverKey).length === 24 && /^[0-9a-fA-F]{24}$/.test(driverKey) ? [{ _id: new ObjectId(driverKey) }] : []),
        { userId: driverKey },
      ],
    });

    if (driverDoc?.userId) {
      return String(driverDoc.userId);
    }
  } catch (err) {
    console.warn("Failed to resolve driver recipient:", err.message);
  }

  return driverKey;
}

function buildUserLookupQuery(userId) {
  const key = String(userId || "").trim();
  if (!key) return null;

  const or = [{ _id: key }];
  if (key.length === 24 && /^[0-9a-fA-F]{24}$/.test(key)) {
    try {
      or.push({ _id: new ObjectId(key) });
    } catch (_) {
      // ignore invalid object id conversion
    }
  }

  return { $or: or };
}

exports.createOffer = async (req, res) => {
  try {
    const { ownerId, driverId, salary, amount, duration, hireId, driverName } = req.body;
    if (!ownerId || !driverId) {
      return res.status(400).json({ message: "ownerId and driverId are required" });
    }

    const salaryValue = salary !== undefined ? salary : amount;
    const salaryVal = (salaryValue !== undefined && salaryValue !== null && salaryValue !== "") ? Number(salaryValue) : null;

    const offer = await Offer.createOffer({
      ownerId,
      driverId,
      hireId: hireId || null,
      driverName: driverName || "Unknown",
      salary: salaryVal,
      duration: duration || null,
      status: "pending",
    });

    const driverRecipientId = await resolveDriverRecipientId(driverId);

    // Send notification to driver
    try {
      const db = await connectDB();
      if (driverRecipientId) {
        const notif = {
          _id: new ObjectId(),
          type: "offer",
          status: "pending",
          message: salaryVal ? `You have received a job offer with salary $${salaryVal}` : "You have received a job request",
          data: {
            offerId: String(offer._id),
            hireId: hireId || null,
            recipientUserId: driverRecipientId,
            recipientRole: "driver",
          },
          read: false,
          createdAt: new Date(),
        };

        await db.collection("user").updateOne(
          buildUserLookupQuery(driverRecipientId),
          { $push: { notifications: notif }, $set: { updatedAt: new Date() } }
        );

        try {
          const socketManager = require("../socket/socketManager");
          const io = socketManager.getIo();
          io.to(`user:${driverRecipientId}`).emit("offer:created", notif);
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
          // Update hire salary to the accepted offer salary
          const acceptedSalary = offer.salary || offer.amount || hire.salary;
          
          // Update hire with driver confirmation and set status to AwaitingPayment
          const Transaction = require("../models/Transaction");
          const COMMISSION_PERCENTAGE = 0.15; // 15% commission
          
          const commission = Math.round(Number(acceptedSalary) * COMMISSION_PERCENTAGE * 100) / 100;
          const ownerAmount = Math.round((Number(acceptedSalary) - commission) * 100) / 100;

          const tx = await Transaction.createTransaction({
            hireId: String(hire._id),
            ownerId: hire.ownerId,
            driverId: hire.driverId,
            amount: Number(acceptedSalary),
            commission,
            ownerAmount,
            status: "pending",
            type: "hire_confirmation",
          });

          await Hire.updateHire(offer.hireId, {
            driverConfirm: true,
            status: "AwaitingPayment",
            salary: acceptedSalary, // Update the hire salary
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
                data: {
                  offerId: String(offer._id),
                  hireId: String(hire._id),
                  recipientUserId: String(hire.ownerId),
                  recipientRole: "owner",
                },
                read: false,
                createdAt: new Date(),
              };

              await db.collection("user").updateOne(
                buildUserLookupQuery(ownerIdStr),
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
            data: {
              offerId: String(offer._id),
              hireId: offer.hireId || null,
              recipientUserId: String(offer.ownerId),
              recipientRole: "owner",
            },
            read: false,
            createdAt: new Date(),
          };

          await db.collection("user").updateOne(
            buildUserLookupQuery(ownerIdStr),
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
