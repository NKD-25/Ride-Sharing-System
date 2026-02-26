const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const rideRoutes = require("./routes/ride.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);

module.exports = app;