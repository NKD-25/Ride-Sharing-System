const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/bookingsController');

router.get('/driver', authenticate, requireRole('driver'), c.getDriverBookings);
router.get('/rider', authenticate, requireRole('client'), c.getRiderBookings);
router.post('/', authenticate, requireRole('client'), c.create);
router.put('/:id', authenticate, requireRole('driver'), c.updateStatus);
router.put('/:id/cancel', authenticate, requireRole('client'), c.cancel);
router.post('/:id/rate', authenticate, requireRole('client'), c.rate);

module.exports = router;