// src/middleware/errorHandler.js
// A single Express error-handling middleware registered last in server.js.
// All thrown AppErrors and unexpected errors funnel here.

const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Known operational error
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  // Unexpected error — log it, don't leak internals to the client
  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
  });
}

module.exports = errorHandler;
