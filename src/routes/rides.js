// src/data-access/rides.js

const { readAll, transaction } = require('../utils/fileStore');
const AppError = require('../utils/AppError');

const FILE = 'rides';

async function findAll() {
  return readAll(FILE);
}

async function findById(id) {
  const rides = await readAll(FILE);
  return rides.find((r) => r.id === id) || null;
}

/**
 * Returns rides that:
 *  - Have not yet departed (departureTime >= now)
 *  - Still have available seats
 *  - Have status 'available'
 *  - Optionally match query filters: from, to, date, minSeats
 */
async function findAvailable({ from, to, date, minSeats } = {}) {
  const now = new Date();
  let rides = await readAll(FILE);

  rides = rides.filter((r) => {
    if (r.status !== 'available') return false;
    if (new Date(r.departureTime) <= now) return false;
    if (r.availableSeats <= 0) return false;
    return true;
  });

  if (from) {
    rides = rides.filter((r) =>
      r.from.toLowerCase().includes(from.toLowerCase())
    );
  }
  if (to) {
    rides = rides.filter((r) =>
      r.to.toLowerCase().includes(to.toLowerCase())
    );
  }
  if (date) {
    rides = rides.filter((r) => r.departureTime.startsWith(date));
  }
  if (minSeats) {
    rides = rides.filter((r) => r.availableSeats >= parseInt(minSeats, 10));
  }

  return rides;
}

async function findByDriverId(driverId) {
  const rides = await readAll(FILE);
  return rides.filter((r) => r.driverId === driverId);
}

async function create(rideData) {
  await transaction(FILE, (rides) => {
    rides.push(rideData);
    return rides;
  });
  return rideData;
}

/**
 * Update fields on a ride by id (under lock). Returns updated ride or null.
 */
async function updateById(id, fields) {
  let updated = null;
  await transaction(FILE, (rides) => {
    const idx = rides.findIndex((r) => r.id === id);
    if (idx === -1) return rides;
    rides[idx] = { ...rides[idx], ...fields };
    updated = rides[idx];
    return rides;
  });
  return updated;
}

/**
 * Atomically decrement availableSeats by 1.
 * Throws 409 if the ride is full or unavailable by the time the lock is acquired
 * — this is the fix for the race condition.
 */
async function decrementSeats(id) {
  let updated = null;
  await transaction(FILE, (rides) => {
    const idx = rides.findIndex((r) => r.id === id);
    if (idx === -1) throw new AppError('Ride not found.', 404, 'RIDE_NOT_FOUND');
    if (rides[idx].availableSeats <= 0) {
      throw new AppError('No seats available on this ride.', 409, 'RIDE_FULL');
    }
    if (rides[idx].status !== 'available') {
      throw new AppError('This ride is no longer available.', 409, 'RIDE_UNAVAILABLE');
    }
    rides[idx].availableSeats -= 1;
    if (rides[idx].availableSeats === 0) {
      rides[idx].status = 'full';
    }
    updated = rides[idx];
    return rides;
  });
  return updated;
}

/**
 * Atomically increment availableSeats by 1 (on booking cancellation).
 */
async function incrementSeats(id) {
  let updated = null;
  await transaction(FILE, (rides) => {
    const idx = rides.findIndex((r) => r.id === id);
    if (idx === -1) return rides; // ride might have been deleted; silently skip
    rides[idx].availableSeats += 1;
    // Re-open if it was marked full
    if (rides[idx].status === 'full') {
      rides[idx].status = 'available';
    }
    updated = rides[idx];
    return rides;
  });
  return updated;
}

async function deleteById(id) {
  let deleted = null;
  await transaction(FILE, (rides) => {
    const idx = rides.findIndex((r) => r.id === id);
    if (idx === -1) return rides;
    deleted = rides[idx];
    rides.splice(idx, 1);
    return rides;
  });
  return deleted;
}

module.exports = {
  findAll,
  findById,
  findAvailable,
  findByDriverId,
  create,
  updateById,
  decrementSeats,
  incrementSeats,
  deleteById,
};
