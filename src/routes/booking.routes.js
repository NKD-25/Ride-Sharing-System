const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/", authMiddleware, bookingController.bookRide);

router.get("/driver", authMiddleware, bookingController.getDriverBookings);

router.put("/:id", authMiddleware, bookingController.updateBookingStatus);

module.exports = router;