const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { readFile, writeFile } = require("../utils/file.util");

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const users = readFile("users.json");

  const userExists = users.find(u => u.email === email);
  if (userExists) return res.status(400).json({ message: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    role
  };

  users.push(newUser);
  writeFile("users.json", users);

  res.status(201).json({ message: "User registered successfully" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const users = readFile("users.json");

  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    "secretkey",
    { expiresIn: "1h" }
  );

  res.json({ token });
};

exports.logout = (req, res) => {
  res.json({ message: "Logout successful (delete token on frontend)" });
};