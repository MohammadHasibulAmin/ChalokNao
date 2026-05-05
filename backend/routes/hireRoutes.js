const express = require("express");
const router = express.Router();
const { createHire, confirmHire, getHireStatus, getOwnerHires, createPaymentSession, finalizePayment, webhookHandler } = require("../controllers/hireController");

router.post("/request", createHire);
router.put("/confirm/:id", confirmHire);
router.post("/pay/:id", createPaymentSession);
router.post("/payment/complete", finalizePayment);
// Stripe webhook expects raw body for signature verification
router.post("/webhook", express.raw({ type: "application/json" }), webhookHandler);
router.get("/owner/:ownerId", getOwnerHires);
router.get("/:id", getHireStatus);

module.exports = router;