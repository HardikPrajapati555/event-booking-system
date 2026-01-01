const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');


router.use(authenticate, isAdmin, apiLimiter);

router.get('/users',
  adminController.getAllUsers
);

router.put('/users/:id/toggle-status',
  adminController.toggleUserStatus
);

router.put('/users/:id/promote',
  adminController.promoteToAdmin
);


router.get('/bookings',
  adminController.getAllBookings
);
    
router.get('/stats',
  adminController.getSystemStats
);

module.exports = router;