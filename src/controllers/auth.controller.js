// src/controllers/authController.js

const { v4: uuid } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig, bcrypt: bcryptConfig } = require('../config');
const usersDA = require('../data-access/users');
const AppError = require('../utils/AppError');
const { validateRegister, validateLogin } = require('../utils/validate');

/**
 * POST /api/auth/register
 * Body: { name, email, password, role }
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const check = validateRegister({ name, email, password, role });
    if (!check.valid) {
      throw new AppError(check.message, 400, 'VALIDATION_ERROR');
    }

    // Hash the password — never store plaintext
    const passwordHash = await bcrypt.hash(password, bcryptConfig.saltRounds);

    const user = {
      id: uuid(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      averageRating: null,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
    };

    await usersDA.create(user);

    // Don't return the hash
    const { passwordHash: _omit, ...safeUser } = user;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: safeUser },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const check = validateLogin({ email, password });
    if (!check.valid) {
      throw new AppError(check.message, 400, 'VALIDATION_ERROR');
    }

    const user = await usersDA.findByEmail(email);

    // Use a constant-time compare to avoid timing attacks.
    // Even if the user doesn't exist we still run bcrypt so response time
    // doesn't leak whether the email is registered.
    const dummyHash = '$2b$12$invalidhashfortimingnormalization000000000000000000000';
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !passwordMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const { passwordHash: _omit, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: { token, user: safeUser },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
