const express = require("express");
const router = express.Router();
const {
  createOrUpdateProfile,
  getDriverById,
  toggleStatus,
  uploadDocuments,
  addEmployment,
  updateEmployment,
  deleteEmployment,
  addAvailability,
  getAvailability,
  setLocation,
  setSalary,
  getAnalytics,
  searchDrivers,
  upload,
} = require("../controllers/driverController");

router.post("/profile", upload.single("photo"), createOrUpdateProfile);
router.put("/profile", upload.single("photo"), createOrUpdateProfile);
router.put("/status", toggleStatus);

router.post(
  "/upload-docs",
  upload.fields([
    { name: "license", maxCount: 1 },
    { name: "nid", maxCount: 1 },
  ]),
  uploadDocuments
);

router.post("/employment", addEmployment);
router.put("/employment/:id", updateEmployment);
router.delete("/employment/:id", deleteEmployment);

router.post("/availability", addAvailability);
router.get("/availability", getAvailability);

router.post("/location", setLocation);
router.put("/salary", setSalary);
router.get("/analytics", getAnalytics);
router.get("/search", searchDrivers);
router.get("/user/:userId", async (req, res) => {
  // lightweight endpoint to return driver by userId
  try {
    const Driver = require("../models/Driver");
    const driver = await Driver.findByUserId(req.params.userId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    return res.json(driver);
  } catch (err) {
    console.error("GET DRIVER BY USER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});
router.get("/:id", getDriverById);

module.exports = router;