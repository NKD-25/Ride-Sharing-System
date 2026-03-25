// src/utils/AppError.js
// Extend the native Error with a statusCode and an optional machine-readable
// `code` string so the global error handler can send consistent JSON.

class AppError extends Error {
  /**
   * @param {string} message   - Human-readable message sent to the client.
   * @param {number} status    - HTTP status code (400, 401, 403, 404, 409, 500…).
   * @param {string} [code]    - Optional machine-readable code for the frontend.
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
