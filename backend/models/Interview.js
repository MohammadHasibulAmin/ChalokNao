const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: Date,
    mode: { type: String, enum: ["online","offline","chat"] },
    status: { type: String, enum: ["Pending","Accepted","Rejected"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Interview", interviewSchema);