const { mongoose } = require("../mongo")

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    chattiness: { type: String, enum: ["Bla", "BlaBla", "BlaBlaBla"], default: "BlaBla" },
    carDetails: {
      model: String,
      color: String,
      plateNumber: String
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    govIdVerified: { type: Boolean, default: false },
    gender: { type: String, enum: ["male", "female", "other"] }
  },
  { timestamps: true }
)

module.exports = mongoose.model("User", UserSchema)
