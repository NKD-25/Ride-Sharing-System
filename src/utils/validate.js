// src/utils/validate.js
// Lightweight validation helpers. Returns { valid: true } or
// { valid: false, message: '...' } so controllers can throw with confidence.

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function isPositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0;
}

function isFutureDate(val) {
  const d = new Date(val);
  return !isNaN(d.getTime()) && d > new Date();
}

/**
 * Validate registration payload.
 */
function validateRegister({ name, email, password, role }) {
  if (!isNonEmptyString(name)) return { valid: false, message: 'Name is required.' };
  if (!isEmail(email)) return { valid: false, message: 'A valid email is required.' };
  if (!isNonEmptyString(password) || password.length < 8)
    return { valid: false, message: 'Password must be at least 8 characters.' };
  if (!['driver', 'client'].includes(role))
    return { valid: false, message: 'Role must be either "driver" or "client".' };
  return { valid: true };
}

/**
 * Validate login payload.
 */
function validateLogin({ email, password }) {
  if (!isEmail(email)) return { valid: false, message: 'A valid email is required.' };
  if (!isNonEmptyString(password)) return { valid: false, message: 'Password is required.' };
  return { valid: true };
}

/**
 * Validate create-ride payload.
 */
function validateCreateRide({ from, to, departureTime, totalSeats, price }) {
  if (!isNonEmptyString(from)) return { valid: false, message: '"from" location is required.' };
  if (!isNonEmptyString(to)) return { valid: false, message: '"to" location is required.' };
  if (!isFutureDate(departureTime))
    return { valid: false, message: '"departureTime" must be a valid date in the future.' };
  if (!isPositiveInt(totalSeats))
    return { valid: false, message: '"totalSeats" must be a positive integer.' };
  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0))
    return { valid: false, message: '"price" must be a non-negative number.' };
  return { valid: true };
}

/**
 * Validate create-booking payload.
 */
function validateCreateBooking({ rideId }) {
  if (!isNonEmptyString(rideId)) return { valid: false, message: '"rideId" is required.' };
  return { valid: true };
}

/**
 * Validate booking status update payload.
 */
function validateBookingStatus({ status }) {
  if (!['accepted', 'rejected'].includes(status))
    return { valid: false, message: '"status" must be "accepted" or "rejected".' };
  return { valid: true };
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateRide,
  validateCreateBooking,
  validateBookingStatus,
};
