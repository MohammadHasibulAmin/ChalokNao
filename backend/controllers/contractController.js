const Contract = require("../models/Contract");
const Transaction = require("../models/Transaction");

exports.createContract = async (req, res) => {
  try {
    const { ownerId, driverId, duration, amount } = req.body;
    if (!ownerId || !driverId || !duration || !amount) {
      return res.status(400).json({ message: "ownerId, driverId, duration and amount are required" });
    }

    const contract = await Contract.createContract({
      ownerId,
      driverId,
      duration,
      amount: Number(amount),
      paymentStatus: "pending",
    });

    const commissionRate = 0.1;
    const commission = Number(amount) * commissionRate;

    await Transaction.createTransaction({
      contractId: String(contract._id),
      amount: Number(amount),
      commission,
      date: new Date(),
    });

    return res.status(201).json(contract);
  } catch (err) {
    console.error("CREATE CONTRACT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getOwnerContracts = async (req, res) => {
  try {
    const contracts = await Contract.listByOwner(req.params.ownerId);
    return res.json(contracts);
  } catch (err) {
    console.error("GET OWNER CONTRACTS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
