const { mongoose } = require("../mongo")

const BookingSchema = new mongoose.Schema(
  {
    rideId: { type: String, required: true },
    riderId: { type: String, required: true },
    driverId: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled"], default: "pending" }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Booking", BookingSchema)
