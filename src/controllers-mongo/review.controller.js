const { v4: uuidv4 } = require("uuid")
const Review = require("../models/Review")
const Booking = require("../models/Booking")

exports.createReview = async (req, res) => {
  const { rideId, toUserId, rating, comment } = req.body || {}
  const fromUserId = req.user?.id
  if (!fromUserId) return res.status(401).json({ message: "Unauthorized" })
  if (!rideId || !toUserId || !rating) return res.status(400).json({ message: "Missing fields" })
  const r = Number(rating)
  if (isNaN(r) || r < 1 || r > 5) return res.status(400).json({ message: "Invalid rating" })
  try {
    const participation = await Booking.findOne({ rideId, $or: [{ riderId: fromUserId }, { driverId: fromUserId }] }).lean()
    if (!participation) return res.status(403).json({ message: "Not part of this ride" })
    const dup = await Review.findOne({ rideId, fromUserId, toUserId }).lean()
    if (dup) return res.status(400).json({ message: "Already reviewed" })
    const id = uuidv4()
    const created = await Review.create({ _id: id, rideId, fromUserId, toUserId, rating: r, comment: comment || null })
    res.status(201).json({ id: created._id, rideId, fromUserId, toUserId, rating: r, comment: comment || null, createdAt: created.createdAt })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.getReviewsForUser = async (req, res) => {
  try {
    const rows = await Review.find({ toUserId: req.params.userId }).sort({ createdAt: -1 }).lean()
    const avgAgg = await Review.aggregate([
      { $match: { toUserId: req.params.userId } },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ])
    const average = avgAgg[0]?.avg || 0
    res.json({ average, reviews: rows })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.getReviewsForRide = async (req, res) => {
  try {
    const rows = await Review.find({ rideId: req.params.rideId }).sort({ createdAt: -1 }).lean()
    res.json(rows)
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}
