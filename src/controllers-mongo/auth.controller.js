const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { v4: uuidv4 } = require("uuid")
const User = require("../models/User")
const secret = process.env.JWT_SECRET || "secretkey"

exports.register = async (req, res) => {
  const { name, email, password, gender, chattiness } = req.body
  try {
    const existing = await User.findOne({ email }).lean()
    if (existing) return res.status(400).json({ message: "Email already exists" })

    const hashed = await bcrypt.hash(password, 10)
    const id = uuidv4()
    await User.create({
      _id: id,
      name,
      email,
      password: hashed,
      gender,
      chattiness: chattiness || "BlaBla"
    })
    res.status(201).json({ message: "User registered successfully" })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.updateProfile = async (req, res) => {
  const { name, gender, chattiness, carDetails } = req.body
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  try {
    const user = await User.findOne({ _id: userId })
    if (!user) return res.status(404).json({ message: "User not found" })

    if (name) user.name = name
    if (gender) user.gender = gender
    if (chattiness) user.chattiness = chattiness
    if (carDetails) user.carDetails = { ...user.carDetails, ...carDetails }

    await user.save()
    res.json({ message: "Profile updated successfully" })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.getProfile = async (req, res) => {
  const userId = req.params.id || req.user?.id
  try {
    const user = await User.findOne({ _id: userId }).select("-password").lean()
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch {
    res.status(500).json({ message: "Server error" })
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id },
      secret,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = (req, res) => {
  res.json({ message: "Logout successful (delete token on frontend)" })
}
