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
router.get("/:id", getDriverById);

module.exports = router;