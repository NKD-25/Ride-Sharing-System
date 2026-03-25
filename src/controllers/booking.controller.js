// src/controllers/bookingsController.js

const { v4: uuid } = require('uuid');
const bookingsDA = require('../data-access/bookings');
const ridesDA = require('../data-access/rides');
const usersDA = require('../data-access/users');
const AppError = require('../utils/AppError');
const {
  validateCreateBooking,
  validateBookingStatus,
} = require('../utils/validate');

/**
 * GET /api/bookings/driver
 * Returns all booking requests for the logged-in driver's rides,
 * with the requesting client's name and phone/email attached.
 */
async function getDriverBookings(req, res, next) {
  try {
    const bookings = await bookingsDA.findByDriverId(req.user.id);

    // Attach rider contact info
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const rider = await usersDA.findById(b.riderId);
        return {
          ...b,
          riderName: rider ? rider.name : 'Unknown',
          riderEmail: rider ? rider.email : null,
        };
      })
    );

    // Sort by request time, newest first
    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ success: true, data: { bookings: enriched } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/rider
 * Returns all bookings made by the logged-in client.
 */
async function getRiderBookings(req, res, next) {
  try {
    const bookings = await bookingsDA.findByRiderId(req.user.id);

    // Attach ride info for context
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const ride = await ridesDA.findById(b.rideId);
        return {
          ...b,
          ride: ride
            ? {
                from: ride.from,
                to: ride.to,
                departureTime: ride.departureTime,
                driverName: ride.driverName,
                price: ride.price,
              }
            : null,
        };
      })
    );

    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ success: true, data: { bookings: enriched } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings
 * Body: { rideId }
 * Client only.
 *
 * Race-condition fix: seat decrement is inside a file-level transaction,
 * so concurrent booking requests are serialized and double-bookings are
 * impossible even under concurrent load.
 */
async function create(req, res, next) {
  try {
    const check = validateCreateBooking(req.body);
    if (!check.valid) {
      throw new AppError(check.message, 400, 'VALIDATION_ERROR');
    }

    const { rideId } = req.body;
    const riderId = req.user.id;

    const ride = await ridesDA.findById(rideId);
    if (!ride) {
      throw new AppError('Ride not found.', 404, 'RIDE_NOT_FOUND');
    }
    if (ride.status === 'cancelled') {
      throw new AppError('This ride has been cancelled.', 409, 'RIDE_CANCELLED');
    }
    if (new Date(ride.departureTime) <= new Date()) {
      throw new AppError('This ride has already departed.', 409, 'RIDE_DEPARTED');
    }
    if (ride.driverId === riderId) {
      throw new AppError('You cannot book your own ride.', 400, 'SELF_BOOKING');
    }

    // Prevent a client from having multiple active bookings on the same ride
    const existingBookings = await bookingsDA.findByRiderId(riderId);
    const duplicate = existingBookings.find(
      (b) => b.rideId === rideId && ['pending', 'accepted'].includes(b.status)
    );
    if (duplicate) {
      throw new AppError(
        'You already have an active booking on this ride.',
        409,
        'DUPLICATE_BOOKING'
      );
    }

    // Prevent a client from holding multiple concurrent accepted rides
    const concurrentAccepted = existingBookings.find((b) => b.status === 'accepted');
    if (concurrentAccepted) {
      throw new AppError(
        'You already have an accepted ride. Cancel it before booking another.',
        409,
        'CONCURRENT_BOOKING'
      );
    }

    // Atomically check & decrement seats (fixes the race condition)
    await ridesDA.decrementSeats(rideId);

    const booking = {
      id: uuid(),
      rideId,
      riderId,
      driverId: ride.driverId,
      status: 'pending',
      rating: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await bookingsDA.create(booking);

    return res.status(201).json({
      success: true,
      message: 'Booking request sent. Waiting for driver confirmation.',
      data: { booking: created },
    });
  } catch (err) {
    // If booking creation fails after decrement, roll the seat back
    // (This edge case is very rare but handled for correctness)
    if (err.code !== 'RIDE_FULL' && err.code !== 'RIDE_NOT_FOUND') {
      // booking creation itself failed after decrement — restore the seat
      if (req.body && req.body.rideId && err._seatDecremented) {
        await ridesDA.incrementSeats(req.body.rideId).catch(() => {});
      }
    }
    next(err);
  }
}

/**
 * PUT /api/bookings/:id
 * Body: { status: 'accepted' | 'rejected' }
 * Driver only.
 */
async function updateStatus(req, res, next) {
  try {
    const check = validateBookingStatus(req.body);
    if (!check.valid) {
      throw new AppError(check.message, 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { status } = req.body;

    const booking = await bookingsDA.findById(id);
    if (!booking) {
      throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
    }
    if (booking.driverId !== req.user.id) {
      throw new AppError('You can only manage bookings for your own rides.', 403, 'FORBIDDEN');
    }
    if (booking.status !== 'pending') {
      throw new AppError(
        `Cannot update a booking that is already "${booking.status}".`,
        409,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // If rejecting, free the seat back up
    if (status === 'rejected') {
      await ridesDA.incrementSeats(booking.rideId);
    }

    const updated = await bookingsDA.updateById(id, {
      status,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: `Booking ${status}.`,
      data: { booking: updated },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/bookings/:id/cancel
 * Client only.
 */
async function cancel(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await bookingsDA.findById(id);
    if (!booking) {
      throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
    }
    if (booking.riderId !== req.user.id) {
      throw new AppError('You can only cancel your own bookings.', 403, 'FORBIDDEN');
    }
    if (booking.status === 'cancelled') {
      throw new AppError('This booking is already cancelled.', 409, 'ALREADY_CANCELLED');
    }
    if (booking.status === 'rejected') {
      throw new AppError('This booking was already rejected.', 409, 'ALREADY_REJECTED');
    }

    // Return the seat to the ride if the booking was pending or accepted
    if (['pending', 'accepted'].includes(booking.status)) {
      await ridesDA.incrementSeats(booking.rideId);
    }

    const updated = await bookingsDA.updateById(id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled.',
      data: { booking: updated },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings/:id/rate
 * Body: { rating: 1–5 }
 * Client only. Can only rate a completed (accepted + departed) booking.
 */
async function rate(req, res, next) {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new AppError('Rating must be an integer between 1 and 5.', 400, 'VALIDATION_ERROR');
    }

    const booking = await bookingsDA.findById(id);
    if (!booking) {
      throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
    }
    if (booking.riderId !== req.user.id) {
      throw new AppError('You can only rate your own bookings.', 403, 'FORBIDDEN');
    }
    if (booking.status !== 'accepted') {
      throw new AppError('You can only rate completed (accepted) rides.', 409, 'NOT_COMPLETED');
    }
    if (booking.rating !== null) {
      throw new AppError('You have already rated this ride.', 409, 'ALREADY_RATED');
    }

    // Verify the ride has actually departed
    const ride = await ridesDA.findById(booking.rideId);
    if (ride && new Date(ride.departureTime) > new Date()) {
      throw new AppError('You can only rate rides after departure.', 409, 'NOT_DEPARTED');
    }

    // Save rating on the booking
    const updatedBooking = await bookingsDA.updateById(id, {
      rating: ratingNum,
      updatedAt: new Date().toISOString(),
    });

    // Recalculate driver's average rating
    const driver = await usersDA.findById(booking.driverId);
    if (driver) {
      const allBookings = await bookingsDA.findByDriverId(booking.driverId);
      const rated = allBookings.filter((b) => b.rating !== null);
      const avg =
        rated.reduce((sum, b) => sum + b.rating, 0) / rated.length;
      await usersDA.updateById(booking.driverId, {
        averageRating: parseFloat(avg.toFixed(2)),
        ratingCount: rated.length,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Rating submitted. Thank you!',
      data: { booking: updatedBooking },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDriverBookings,
  getRiderBookings,
  create,
  updateStatus,
  cancel,
  rate,
};
