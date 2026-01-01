const jwt = require('../config/jwt');
const User = require('../models/User');
const { ApiError } = require('../utils/errorHandler');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verifyToken(token);

    if (!decoded) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    req.user = user;
    req.user.role = decoded.role;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verifyToken(token);

      if (decoded) {
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
          req.user.role = decoded.role;
        }
      }
    }
    next();
  } catch (error) {
    
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};