const { v4: uuidv4 } = require("uuid");
const { readFile, writeFile } = require("../utils/file.util");

// Rider books ride
exports.bookRide = (req, res) => {
  const { rideId } = req.body;

  const rides = readFile("rides.json");
  const bookings = readFile("bookings.json");

  const ride = rides.find(r => r.id === rideId);
  if (!ride) return res.status(404).json({ message: "Ride not found" });
  if (!ride.driverId) return res.status(400).json({ message: "Ride has no driver assigned" });
  if (ride.driverId === req.user.id) return res.status(400).json({ message: "Driver cannot book own ride" });
  const today = new Date().toISOString().slice(0,10);
  const hasAcceptedFuture = bookings.some(b => {
    if (b.riderId !== req.user.id || b.status !== "accepted") return false;
    const r = rides.find(x => x.id === b.rideId);
    return r && r.date && r.date >= today;
  });
  if (hasAcceptedFuture) return res.status(400).json({ message: "You already have an accepted upcoming ride" });

  const newBooking = {
    id: uuidv4(),
    rideId,
    riderId: req.user.id,
    driverId: ride.driverId,
    status: "pending"
  };

  bookings.push(newBooking);
  writeFile("bookings.json", bookings);

  res.status(201).json(newBooking);
};

// Driver views booking requests
exports.getDriverBookings = (req, res) => {
  const bookings = readFile("bookings.json");
  const users = readFile("users.json");

  const driverBookings = bookings
    .filter(b => b.driverId === req.user.id)
    .map(b => {
      const u = users.find(x => x.id === b.riderId);
      return { ...b, riderName: u ? u.name : undefined, riderEmail: u ? u.email : undefined };
    });

  res.json(driverBookings);
};

// Rider views own booking requests
exports.getRiderBookings = (req, res) => {
  const bookings = readFile("bookings.json");

  const riderBookings = bookings.filter(
    b => b.riderId === req.user.id
  );

  res.json(riderBookings);
};

// Driver accepts or rejects booking
exports.updateBookingStatus = (req, res) => {
  const { status } = req.body;

  const allowed = ["pending", "accepted", "rejected", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  let bookings = readFile("bookings.json");

  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking)
    return res.status(404).json({ message: "Booking not found" });

  // Only the driver assigned to the ride can update this booking
  if (booking.driverId !== req.user.id) {
    return res.status(403).json({ message: "Not authorized to update this booking" });
  }

  const prev = booking.status;

  // Adjust seats on accept/reject transitions
  if (status === "accepted" && prev !== "accepted") {
    const rides = readFile("rides.json");
    const ride = rides.find(r => r.id === booking.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    const seats = Number(ride.availableSeats || 0);
    if (seats <= 0) return res.status(400).json({ message: "No seats available" });
    ride.availableSeats = seats - 1;
    writeFile("rides.json", rides);
  } else if (status === "rejected" && prev === "accepted") {
    const rides = readFile("rides.json");
    const ride = rides.find(r => r.id === booking.rideId);
    if (ride) {
      const seats = Number(ride.availableSeats || 0);
      ride.availableSeats = seats + 1;
      writeFile("rides.json", rides);
    }
  } else if (status === "cancelled" && prev === "accepted") {
    const rides = readFile("rides.json");
    const ride = rides.find(r => r.id === booking.rideId);
    if (ride) {
      const seats = Number(ride.availableSeats || 0);
      ride.availableSeats = seats + 1;
      writeFile("rides.json", rides);
    }
  }

  booking.status = status;

  writeFile("bookings.json", bookings);

  const users = readFile("users.json");
  const u = users.find(x => x.id === booking.riderId);
  const enriched = { ...booking, riderName: u ? u.name : undefined, riderEmail: u ? u.email : undefined };
  res.json(enriched);
};

// Rider cancels own booking
exports.cancelBookingByRider = (req, res) => {
  let bookings = readFile("bookings.json");
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.riderId !== req.user.id) {
    return res.status(403).json({ message: "Not authorized to cancel this booking" });
  }
  const prev = booking.status;
  if (prev === "accepted") {
    const rides = readFile("rides.json");
    const ride = rides.find(r => r.id === booking.rideId);
    if (ride) {
      const seats = Number(ride.availableSeats || 0);
      ride.availableSeats = seats + 1;
      writeFile("rides.json", rides);
    }
  }
  booking.status = "cancelled";
  writeFile("bookings.json", bookings);
  const users = readFile("users.json");
  const u = users.find(x => x.id === booking.riderId);
  const enriched = { ...booking, riderName: u ? u.name : undefined, riderEmail: u ? u.email : undefined };
  res.json(enriched);
};
