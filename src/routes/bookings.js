// src/data-access/bookings.js

const { readAll, transaction } = require('../utils/fileStore');

const FILE = 'bookings';

async function findAll() {
  return readAll(FILE);
}

async function findById(id) {
  const bookings = await readAll(FILE);
  return bookings.find((b) => b.id === id) || null;
}

async function findByRiderId(riderId) {
  const bookings = await readAll(FILE);
  return bookings.filter((b) => b.riderId === riderId);
}

async function findByDriverId(driverId) {
  const bookings = await readAll(FILE);
  return bookings.filter((b) => b.driverId === driverId);
}

async function findByRideId(rideId) {
  const bookings = await readAll(FILE);
  return bookings.filter((b) => b.rideId === rideId);
}

async function create(bookingData) {
  await transaction(FILE, (bookings) => {
    bookings.push(bookingData);
    return bookings;
  });
  return bookingData;
}

async function updateById(id, fields) {
  let updated = null;
  await transaction(FILE, (bookings) => {
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx === -1) return bookings;
    bookings[idx] = { ...bookings[idx], ...fields };
    updated = bookings[idx];
    return bookings;
  });
  return updated;
}

/**
 * Cancel all bookings for a given ride (used when a driver cancels the ride).
 * Returns the list of affected booking ids.
 */
async function cancelByRideId(rideId) {
  const affected = [];
  await transaction(FILE, (bookings) => {
    bookings.forEach((b, idx) => {
      if (b.rideId === rideId && b.status !== 'cancelled') {
        bookings[idx].status = 'cancelled';
        bookings[idx].cancelledAt = new Date().toISOString();
        affected.push(b.id);
      }
    });
    return bookings;
  });
  return affected;
}

module.exports = {
  findAll,
  findById,
  findByRiderId,
  findByDriverId,
  findByRideId,
  create,
  updateById,
  cancelByRideId,
};
