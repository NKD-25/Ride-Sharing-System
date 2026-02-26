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
  res.json(rides);
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

  const filtered = rides.filter(r => r.id !== req.params.id);

  writeFile("rides.json", filtered);

  res.json({ message: "Ride deleted successfully" });
};