const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrOrganizer } = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');


router.use(apiLimiter);


router.get('/',
  optionalAuth,
  validate('eventFilters', 'query'),
  eventController.getEvents
);

router.get('/:id',
  optionalAuth,
  eventController.getEventById
);


router.post('/',
  authenticate,
  isAdmin,
  validate('createEvent'),
  eventController.createEvent
);

router.put('/:id',
  authenticate,
  isAdminOrOrganizer,
  validate('updateEvent'),
  eventController.updateEvent
);

router.delete('/:id',
  authenticate,
  isAdminOrOrganizer,
  eventController.deleteEvent
);


router.get('/:id/stats',
  authenticate,
  isAdminOrOrganizer,
  eventController.getEventStats
);

module.exports = router;