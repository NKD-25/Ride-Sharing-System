const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { init } = require("./utils/db");
const { connectMongo } = require("./utils/mongo");

const useMongo = !!process.env.MONGO_URI;
const authRoutes = useMongo ? require("./routes/auth.routes.mongo") : require("./routes/auth.routes");
const rideRoutes = useMongo ? require("./routes/ride.routes.mongo") : require("./routes/ride.routes");
const bookingRoutes = useMongo ? require("./routes/booking.routes.mongo") : require("./routes/booking.routes");
const reviewRoutes = useMongo ? require("./routes/review.routes.mongo") : require("./routes/review.routes");
const verifyRoutes = useMongo ? require("./routes/verify.routes.mongo") : require("./routes/verify.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/verify", verifyRoutes);

if (useMongo) {
  connectMongo(process.env.MONGO_URI).then(() => {}).catch(() => {});
} else {
  init().then(() => {}).catch(() => {});
}
module.exports = app;
