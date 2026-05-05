const Offer = require("../models/Offer");
const Driver = require("../models/Driver");
const connectDB = require("../config/db");

exports.createOffer = async (req, res) => {
  try {
    const { ownerId, driverId, amount } = req.body;
    if (!ownerId || !driverId || !amount) {
      return res.status(400).json({ message: "ownerId, driverId and amount are required" });
    }

    // Get driver details for the offer
    const driver = await Driver.findByUserId(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const offer = await Offer.createOffer({
      ownerId,
      driverId,
      driverName: driver.name || "Unknown",
      amount: Number(amount),
      status: "pending",
    });

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
