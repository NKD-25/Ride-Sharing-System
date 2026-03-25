// src/middleware/auth.js
// authenticate  — verifies the JWT and attaches req.user
// requireRole   — factory that produces a middleware enforcing a specific role

const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config');
const AppError = require('../utils/AppError');

/**
 * Verify the Bearer token in the Authorization header.
 * On success, sets req.user = { id, email, role, name }.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new AppError('Authentication token missing.', 401, 'NO_TOKEN'));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, jwtConfig.secret);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
  }
}

/**
 * Returns a middleware that allows only users with the given role.
 * Must be used after authenticate.
 *
 * Usage:
 *   router.post('/rides', authenticate, requireRole('driver'), ridesController.create);
 */
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401, 'NOT_AUTHENTICATED'));
    }
    if (req.user.role !== role) {
      return next(
        new AppError(
          `This action requires the "${role}" role.`,
          403,
          'FORBIDDEN'
        )
      );
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
