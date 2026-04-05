const { mongoose } = require("../mongo")

const ReviewSchema = new mongoose.Schema(
  {
    rideId: { type: String, required: true },
    fromUserId: { type: String, required: true },
    toUserId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Review", ReviewSchema)
