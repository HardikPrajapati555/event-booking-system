const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const validate = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');


router.post('/register', 
  authLimiter,
  validate('register'),
  authController.register
);

router.post('/login',
  authLimiter,
  validate('login'),
  authController.login
);

router.post('/refresh-token',
  authController.refreshToken
);


router.get('/profile',
  authenticate,
  authController.getProfile
);

router.post('/logout',
  authenticate,
  authController.logout
);

module.exports = router;