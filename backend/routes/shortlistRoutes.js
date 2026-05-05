const express = require("express");
const router = express.Router();
const { addToShortlist, getShortlist, removeFromShortlist } = require("../controllers/shortlistController");

router.post("/", addToShortlist);
router.get("/:ownerId", getShortlist);
router.delete("/:ownerId/:driverId", removeFromShortlist);

module.exports = router;
