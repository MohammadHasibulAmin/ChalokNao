const RequestModel = require("../models/Request");

exports.createShortTermRequest = async (req, res) => {
  try {
    const { ownerId, driverId, startDate, endDate } = req.body;
    if (!ownerId || !driverId || !startDate || !endDate) {
      return res.status(400).json({ message: "ownerId, driverId, startDate and endDate are required" });
    }

    const request = await RequestModel.createRequest({
      ownerId,
      driverId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "pending",
    });

    return res.status(201).json(request);
  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
