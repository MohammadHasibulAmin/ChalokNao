const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    photo: String,
    age: Number,
    experience: String,
    licenseNumber: String,
    workType: { type: String, enum: ["full-time","temporary"] },
    salaryExpectation: Number,
    status: { type: String, enum: ["Available","Employed"], default: "Available" },
    location: String,
    badges: [String],
    trainingModules: [{
        name: String,
        score: Number,
        certificate: String
    }]
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);