const { v4: uuidv4 } = require("uuid");
const { readFile, writeFile } = require("../utils/file.util");

exports.createRide = (req, res) => {
  const rides = readFile("rides.json");

  const newRide = {
    id: uuidv4(),
    driverId: req.user.id,
    from: req.body.from,
    to: req.body.to,
    date: req.body.date,
    price: req.body.price,
    availableSeats: req.body.availableSeats
  };

  rides.push(newRide);
  writeFile("rides.json", rides);

  res.status(201).json(newRide);
};

exports.getAllRides = (req, res) => {
  const rides = readFile("rides.json");
  const today = new Date().toISOString().slice(0, 10);
  const available = rides.filter(r => {
    const seats = Number(r.availableSeats || 0);
    const hasSeats = seats > 0;
    const hasDate = !!r.date;
    const notPast = !hasDate || r.date >= today;
    return hasSeats && notPast;
  });
  res.json(available);
};

exports.getRideById = (req, res) => {
  const rides = readFile("rides.json");
  const ride = rides.find(r => r.id === req.params.id);

  if (!ride) return res.status(404).json({ message: "Ride not found" });

  res.json(ride);
};

exports.updateRide = (req, res) => {
  let rides = readFile("rides.json");

  const index = rides.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Ride not found" });

  rides[index] = { ...rides[index], ...req.body };
  writeFile("rides.json", rides);

  res.json(rides[index]);
};

exports.deleteRide = (req, res) => {
  let rides = readFile("rides.json");
  let bookings = readFile("bookings.json");

  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) return res.status(404).json({ message: "Ride not found" });
  if (ride.driverId !== req.user.id) {
    return res.status(403).json({ message: "Not authorized to delete this ride" });
  }

  const filtered = rides.filter(r => r.id !== req.params.id);

  writeFile("rides.json", filtered);

  // cascade cancel related bookings
  bookings = bookings.map(b => (b.rideId === req.params.id ? { ...b, status: "cancelled" } : b));
  writeFile("bookings.json", bookings);

  res.json({ message: "Ride deleted successfully" });
};
