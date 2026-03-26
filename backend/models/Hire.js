const mongoose = require("mongoose");

const hireSchema = new mongoose.Schema({
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    salary: Number,
    driverConfirm: { type: Boolean, default: false },
    ownerConfirm: { type: Boolean, default: false },
    status: { type: String, enum: ["Pending","Confirmed"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Hire", hireSchema);