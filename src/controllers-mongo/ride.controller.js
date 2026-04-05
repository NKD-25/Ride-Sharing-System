const { v4: uuidv4 } = require("uuid")
const Ride = require("../models/Ride")

exports.createRide = async (req, res) => {
  const { from, to, date, price, availableSeats, isLadiesOnly, isInstantBooking, stops, carModel, distanceKm } = req.body || {};
  const driverId = req.user?.id;
  if (!driverId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await User.findOne({ id: driverId });
    if (!user || !user.carDetails || !user.carDetails.model) {
      return res.status(400).json({ 
        message: "Vehicle details required to publish a ride.", 
        requireVehicle: true 
      });
    }

    const id = uuidv4();
    const newRide = new Ride({
      id,
      driverId,
      from,
      to,
      date,
      price,
      availableSeats,
      isLadiesOnly,
      isInstantBooking,
      stops,
      carModel: carModel || user.carDetails.model,
      distanceKm
    });
    await newRide.save();
    res.status(201).json(newRide);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllRides = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const q = { $and: [{ $or: [{ availableSeats: null }, { availableSeats: { $gt: 0 } }] }, { $or: [{ date: null }, { date: { $gte: today } }] }] }
    if (req.query.from) q.from = new RegExp(req.query.from, "i")
    if (req.query.to) q.to = new RegExp(req.query.to, "i")
    if (req.query.date) q.date = req.query.date
    if (req.query.isLadiesOnly === "true") q.isLadiesOnly = true
    if (req.query.minPrice || req.query.maxPrice) {
      q.price = {}
      if (req.query.minPrice) q.price.$gte = Number(req.query.minPrice)
      if (req.query.maxPrice) q.price.$lte = Number(req.query.maxPrice)
    }
    const rows = await Ride.find(q).sort({ date: 1 }).lean()
    const out = rows.map(r => ({
      id: r._id,
      driverId: r.driverId,
      from: r.from,
      to: r.to,
      date: r.date,
      price: r.price,
      availableSeats: r.availableSeats,
      isLadiesOnly: r.isLadiesOnly,
      isInstantBooking: r.isInstantBooking
    }))
    res.json(out)
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.suggestPrice = (req, res) => {
  const { distanceKm } = req.query || {}
  if (!distanceKm) return res.status(400).json({ message: "Distance required" })
  
  const ratePerKm = 6 
  const suggested = Math.round(Number(distanceKm) * ratePerKm)
  res.json({ suggested, ratePerKm })
}

exports.getRideById = async (req, res) => {
  try {
    const r = await Ride.findById(req.params.id).lean()
    if (!r) return res.status(404).json({ message: "Ride not found" })
    res.json({
      id: r._id,
      driverId: r.driverId,
      from: r.from,
      to: r.to,
      date: r.date,
      price: r.price,
      availableSeats: r.availableSeats
    })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.updateRide = async (req, res) => {
  try {
    const r = await Ride.findById(req.params.id)
    if (!r) return res.status(404).json({ message: "Ride not found" })
    if (r.driverId !== req.user.id) return res.status(403).json({ message: "Not authorized to update this ride" })
    const body = req.body || {}
    if (body.from !== undefined) r.from = body.from
    if (body.to !== undefined) r.to = body.to
    if (body.date !== undefined) r.date = body.date
    if (body.price !== undefined) r.price = body.price
    if (body.availableSeats !== undefined) r.availableSeats = body.availableSeats
    await r.save()
    res.json({
      id: r._id,
      driverId: r.driverId,
      from: r.from,
      to: r.to,
      date: r.date,
      price: r.price,
      availableSeats: r.availableSeats
    })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.deleteRide = async (req, res) => {
  try {
    const r = await Ride.findById(req.params.id)
    if (!r) return res.status(404).json({ message: "Ride not found" })
    if (r.driverId !== req.user.id) return res.status(403).json({ message: "Not authorized to delete this ride" })
    await Ride.deleteOne({ _id: req.params.id })
    res.json({ message: "Ride deleted successfully" })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}
