const Offer = require("../models/Offer");

exports.createOffer = async (req, res) => {
  try {
    const { ownerId, driverId, amount } = req.body;
    if (!ownerId || !driverId || !amount) {
      return res.status(400).json({ message: "ownerId, driverId and amount are required" });
    }

    const offer = await Offer.createOffer({
      ownerId,
      driverId,
      amount: Number(amount),
      status: "pending",
    });

    return res.status(201).json(offer);
  } catch (err) {
    console.error("CREATE OFFER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
