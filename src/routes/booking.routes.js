const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { bookingLimiter } = require('../middleware/rateLimiter.middleware');


router.use(authenticate);


router.post('/',
  bookingLimiter,
  validate('createBooking'),
  bookingController.createBooking
);

router.get('/my-bookings',
  bookingController.getUserBookings
);

router.get('/:id',
  bookingController.getBookingById
);

router.put('/:id/cancel',
  bookingController.cancelBooking
);

// Admin routes
router.get('/export',
  isAdmin,
  bookingController.exportBookings
);

module.exports = router;