const Hire = require("../models/Hire");

exports.createHire = async (req, res) => {
  try {
    const { ownerId, driverId, salary, duration } = req.body;
    if (!ownerId || !driverId) {
      return res.status(400).json({ message: "ownerId and driverId are required" });
    }

    const hire = await Hire.createHire({
      ownerId,
      driverId,
      salary: Number(salary || 0),
      duration: duration || null,
      ownerConfirm: true,
      driverConfirm: false,
    });

    return res.status(201).json(hire);
  } catch (err) {
    console.error("CREATE HIRE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.confirmHire = async (req, res) => {
  try {
    const { actor } = req.body;
    const hire = await Hire.findById(req.params.id);

    if (!hire) {
      return res.status(404).json({ message: "Hire not found" });
    }

    const update = {};
    if (actor === "driver") update.driverConfirm = true;
    if (actor === "owner") update.ownerConfirm = true;

    const shouldConfirm = (update.driverConfirm || hire.driverConfirm) && (update.ownerConfirm || hire.ownerConfirm);
    if (shouldConfirm) {
      update.status = "Confirmed";
    }

    const updated = await Hire.updateHire(req.params.id, update);
    return res.json(updated);
  } catch (err) {
    console.error("CONFIRM HIRE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getHireStatus = async (req, res) => {
  try {
    const hire = await Hire.findById(req.params.id);
    if (!hire) {
      return res.status(404).json({ message: "Hire not found" });
    }
    return res.json(hire);
  } catch (err) {
    console.error("GET HIRE STATUS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getOwnerHires = async (req, res) => {
  try {
    const hires = await Hire.listByOwner(req.params.ownerId);
    return res.json(hires);
  } catch (err) {
    console.error("GET OWNER HIRES ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};