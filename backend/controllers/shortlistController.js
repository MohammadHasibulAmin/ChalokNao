const Shortlist = require("../models/Shortlist");

exports.addToShortlist = async (req, res) => {
  try {
    const { ownerId, driverId } = req.body;
    if (!ownerId || !driverId) {
      return res.status(400).json({ message: "ownerId and driverId are required" });
    }

    const shortlist = await Shortlist.addDriver(ownerId, driverId);
    return res.status(201).json(shortlist);
  } catch (err) {
    console.error("SHORTLIST ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getShortlist = async (req, res) => {
  try {
    const shortlist = await Shortlist.listByOwner(req.params.ownerId);
    return res.json(shortlist || { ownerId: req.params.ownerId, driverIds: [] });
  } catch (err) {
    console.error("SHORTLIST FETCH ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.removeFromShortlist = async (req, res) => {
  try {
    const { ownerId, driverId } = req.params;
    if (!ownerId || !driverId) return res.status(400).json({ message: "ownerId and driverId are required" });

    const shortlist = await Shortlist.removeDriver(ownerId, driverId);
    return res.json(shortlist || { ownerId, driverIds: [] });
  } catch (err) {
    console.error("SHORTLIST REMOVE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
