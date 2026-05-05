const express = require("express");
const router = express.Router();
const {
  verifyDriverDocument,
  suspendUser,
  resumeUser,
  getAllDrivers,
  getSuspendedUsers,
  getReports,
  createReport,
  resolveReport,
  getTransactions,
  processHireConfirmation,
  completeTransaction,
  getDashboardStats,
} = require("../../controllers/admin/verificationController");

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Driver Verification
router.get("/drivers", getAllDrivers);
router.put("/verify-doc/:id", verifyDriverDocument);

// User Suspension
router.put("/suspend-user/:id", suspendUser);
router.put("/resume-user/:id", resumeUser);
router.get("/users/suspended", getSuspendedUsers);

// Reports
router.get("/reports", getReports);
router.post("/reports", createReport);
router.put("/reports/:id", resolveReport);

// Transactions & Commission
router.get("/transactions", getTransactions);
router.post("/process-hire", processHireConfirmation);
router.put("/transactions/:id", completeTransaction);

module.exports = router;
