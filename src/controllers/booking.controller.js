const { v4: uuidv4 } = require("uuid");
const { readFile, writeFile } = require("../utils/file.util");

// Rider books ride
exports.bookRide = (req, res) => {
  const { rideId } = req.body;

  const rides = readFile("rides.json");
  const bookings = readFile("bookings.json");

  const ride = rides.find(r => r.id === rideId);
  if (!ride) return res.status(404).json({ message: "Ride not found" });

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

  const driverBookings = bookings.filter(
    b => b.driverId === req.user.id
  );

  res.json(driverBookings);
};

// Driver accepts or rejects booking
exports.updateBookingStatus = (req, res) => {
  const { status } = req.body;

  let bookings = readFile("bookings.json");

  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking)
    return res.status(404).json({ message: "Booking not found" });

  booking.status = status;

  writeFile("bookings.json", bookings);

  res.json(booking);
};