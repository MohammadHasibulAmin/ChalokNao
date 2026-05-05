const express = require("express");
const router = express.Router();
const { verifyDriverDocument, suspendUser } = require("../../controllers/admin/verificationController");

router.put("/verify-doc/:id", verifyDriverDocument);
router.put("/suspend-user/:id", suspendUser);

module.exports = router;
