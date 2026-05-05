const Interview = require("../models/Interview");

exports.requestInterview = async (req, res) => {
  try {
    const { ownerId, driverId, type, date, location, locationLat, locationLng } = req.body;

    if (!ownerId || !driverId || !type || !date) {
      return res.status(400).json({ message: "ownerId, driverId, type and date are required" });
    }

    // If interview is offline, require a location/address. For other types, location should be omitted.
    if (String(type).toLowerCase() === "offline" && !location) {
      return res.status(400).json({ message: "Location/address is required for offline interviews" });
    }

    const shouldStoreLocation = String(type).toLowerCase() === "offline";
    const coords =
      Number.isFinite(Number(locationLat)) && Number.isFinite(Number(locationLng))
        ? { lat: Number(locationLat), lng: Number(locationLng) }
        : null;

    const interview = await Interview.createInterview({
      ownerId,
      driverId,
      type,
      date: new Date(date),
      location: shouldStoreLocation ? (location || null) : null,
      locationCoordinates: shouldStoreLocation ? coords : null,
      status: "pending",
    });

    return res.status(201).json(interview);
  } catch (err) {
    console.error("REQUEST INTERVIEW ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.respondInterview = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(String(status || "").toLowerCase())) {
      return res.status(400).json({ message: "status must be accepted or rejected" });
    }

    const interview = await Interview.updateInterviewStatus(req.params.id, String(status).toLowerCase());
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    return res.json(interview);
  } catch (err) {
    console.error("RESPOND INTERVIEW ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getDriverInterviews = async (req, res) => {
  try {
    const interviews = await Interview.listByDriver(req.params.driverId);
    return res.json(interviews);
  } catch (err) {
    console.error("GET DRIVER INTERVIEWS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getOwnerInterviews = async (req, res) => {
  try {
    const interviews = await Interview.listByOwner(req.params.ownerId);
    return res.json(interviews);
  } catch (err) {
    console.error("GET OWNER INTERVIEWS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};