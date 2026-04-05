const { mongoose } = require("../mongo")

const RideSchema = new mongoose.Schema(
  {
    driverId: { type: String, required: true },
    from: { type: String },
    to: { type: String },
    date: { type: String },
    price: { type: Number },
    availableSeats: { type: Number },
    isLadiesOnly: { type: Boolean, default: false },
    isInstantBooking: { type: Boolean, default: false },
    stops: [{ type: String }],
    carModel: { type: String },
    distanceKm: { type: Number },
    etaMinutes: { type: Number }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Ride", RideSchema)
