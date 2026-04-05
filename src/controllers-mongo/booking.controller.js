const { v4: uuidv4 } = require("uuid")
const Booking = require("../models/Booking")
const Ride = require("../models/Ride")
const User = require("../models/User")

exports.bookRide = async (req, res) => {
  const { rideId } = req.body || {};
  const riderId = req.user?.id;
  if (!riderId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.driverId === riderId) return res.status(400).json({ message: "Cannot book own ride" });
    if (ride.availableSeats <= 0) return res.status(400).json({ message: "No seats available" });

    const today = new Date().toISOString().slice(0, 10);
    const hasActive = await Booking.findOne({
      riderId,
      status: "accepted"
    }).lean();

    if (hasActive) {
      const activeRide = await Ride.findById(hasActive.rideId).lean();
      if (activeRide && activeRide.date >= today) {
        return res.status(400).json({ message: "You already have an accepted upcoming ride" });
      }
    }

    const status = ride.isInstantBooking ? "accepted" : "pending";
    const id = uuidv4();

    const booking = new Booking({
      _id: id,
      rideId,
      riderId,
      driverId: ride.driverId,
      status
    });

    await booking.save();

    if (status === "accepted") {
      ride.availableSeats -= 1;
      await ride.save();
    }

    res.status(201).json({ id: booking._id, rideId: booking.rideId, riderId: booking.riderId, driverId: booking.driverId, status: booking.status });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDriverBookings = async (req, res) => {
  try {
    const rows = await Booking.find({ driverId: req.user.id }).lean()
    const riderIds = Array.from(new Set(rows.map(x => x.riderId)))
    const users = await User.find({ _id: { $in: riderIds } }).lean()
    const map = new Map(users.map(u => [u._id, u]))
    const out = rows.map(b => ({ ...b, riderName: map.get(b.riderId)?.name, riderEmail: map.get(b.riderId)?.email }))
    res.json(out)
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.getRiderBookings = async (req, res) => {
  try {
    const rows = await Booking.find({ riderId: req.user.id }).lean()
    res.json(rows)
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body
  const allowed = ["pending", "accepted", "rejected", "cancelled"]
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" })
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: "Booking not found" })
    if (booking.driverId !== req.user.id) return res.status(403).json({ message: "Not authorized to update this booking" })
    const prev = booking.status
    if (status === "accepted" && prev !== "accepted") {
      const ride = await Ride.findById(booking.rideId)
      if (!ride) return res.status(404).json({ message: "Ride not found" })
      const seats = Number(ride.availableSeats || 0)
      if (seats <= 0) return res.status(400).json({ message: "No seats available" })
      ride.availableSeats = seats - 1
      await ride.save()
    } else if ((status === "rejected" || status === "cancelled") && prev === "accepted") {
      const ride = await Ride.findById(booking.rideId)
      if (ride) {
        const seats = Number(ride.availableSeats || 0)
        ride.availableSeats = seats + 1
        await ride.save()
      }
    }
    booking.status = status
    await booking.save()
    const u = await User.findById(booking.riderId).lean()
    res.json({ id: booking._id, rideId: booking.rideId, riderId: booking.riderId, driverId: booking.driverId, status: booking.status, riderName: u?.name, riderEmail: u?.email })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.cancelBookingByRider = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: "Booking not found" })
    if (booking.riderId !== req.user.id) return res.status(403).json({ message: "Not authorized to cancel this booking" })
    if (booking.status === "accepted") {
      const ride = await Ride.findById(booking.rideId)
      if (ride) {
        const seats = Number(ride.availableSeats || 0)
        ride.availableSeats = seats + 1
        await ride.save()
      }
    }
    booking.status = "cancelled"
    await booking.save()
    const u = await User.findById(booking.riderId).lean()
    res.json({ id: booking._id, rideId: booking.rideId, riderId: booking.riderId, driverId: booking.driverId, status: booking.status, riderName: u?.name, riderEmail: u?.email })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}
