// src/controllers/ridesController.js

const { v4: uuid } = require('uuid');
const ridesDA = require('../data-access/rides');
const bookingsDA = require('../data-access/bookings');
const AppError = require('../utils/AppError');
const { validateCreateRide } = require('../utils/validate');

/**
 * GET /api/rides
 * Query params: from, to, date (YYYY-MM-DD), minSeats, page, limit
 * Returns paginated available rides.
 */
async function getAvailable(req, res, next) {
  try {
    const { from, to, date, minSeats, page = 1, limit = 20 } = req.query;

    const rides = await ridesDA.findAvailable({ from, to, date, minSeats });

    // Sort soonest departure first
    rides.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const total = rides.length;
    const start = (pageNum - 1) * limitNum;
    const paginated = rides.slice(start, start + limitNum);

    return res.status(200).json({
      success: true,
      data: {
        rides: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/rides/history
 * Returns all past rides for the logged-in driver or client.
 * Drivers see rides they created; clients see rides they were booked on.
 */
async function getHistory(req, res, next) {
  try {
    const now = new Date();
    const { id: userId, role } = req.user;
    let rides = [];

    if (role === 'driver') {
      const all = await ridesDA.findByDriverId(userId);
      rides = all.filter((r) => new Date(r.departureTime) < now);
    } else {
      // client — find rides via their bookings
      const bookings = await bookingsDA.findByRiderId(userId);
      const rideIds = [...new Set(bookings.map((b) => b.rideId))];
      const all = await ridesDA.findAll();
      rides = all.filter(
        (r) => rideIds.includes(r.id) && new Date(r.departureTime) < now
      );
    }

    rides.sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime));

    return res.status(200).json({ success: true, data: { rides } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/rides
 * Body: { from, to, departureTime, totalSeats, price?, description? }
 * Driver only.
 */
async function create(req, res, next) {
  try {
    const { from, to, departureTime, totalSeats, price, description } = req.body;

    const check = validateCreateRide({ from, to, departureTime, totalSeats, price });
    if (!check.valid) {
      throw new AppError(check.message, 400, 'VALIDATION_ERROR');
    }

    const seats = parseInt(totalSeats, 10);

    const ride = {
      id: uuid(),
      driverId: req.user.id,
      driverName: req.user.name,
      from: from.trim(),
      to: to.trim(),
      departureTime: new Date(departureTime).toISOString(),
      totalSeats: seats,
      availableSeats: seats,
      price: price !== undefined ? parseFloat(price) : null,
      description: description ? description.trim() : null,
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    const created = await ridesDA.create(ride);

    return res.status(201).json({
      success: true,
      message: 'Ride created successfully.',
      data: { ride: created },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/rides/:id
 * Driver only. Cancels the ride and cascades cancellation to all bookings.
 */
async function cancel(req, res, next) {
  try {
    const { id } = req.params;

    const ride = await ridesDA.findById(id);
    if (!ride) {
      throw new AppError('Ride not found.', 404, 'RIDE_NOT_FOUND');
    }
    if (ride.driverId !== req.user.id) {
      throw new AppError('You can only cancel your own rides.', 403, 'FORBIDDEN');
    }
    if (ride.status === 'cancelled') {
      throw new AppError('This ride is already cancelled.', 409, 'ALREADY_CANCELLED');
    }

    // Mark the ride as cancelled
    const updatedRide = await ridesDA.updateById(id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });

    // Cascade: cancel all pending/accepted bookings for this ride
    const affectedBookings = await bookingsDA.cancelByRideId(id);

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully.',
      data: {
        ride: updatedRide,
        cancelledBookings: affectedBookings.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAvailable, getHistory, create, cancel };
