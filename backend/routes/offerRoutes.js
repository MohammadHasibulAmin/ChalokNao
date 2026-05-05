const express = require("express");
const router = express.Router();
const {
  createOffer,
  getOffersByDriver,
  getOffersByOwner,
  updateOfferStatus,
  getOfferById,
  deleteOffer,
} = require("../controllers/offerController");

router.post("/", createOffer);
router.get("/driver/list", getOffersByDriver);
router.get("/owner/list", getOffersByOwner);
router.get("/:offerId", getOfferById);
router.put("/:offerId/status", updateOfferStatus);
router.delete("/:offerId", deleteOffer);

module.exports = router;
