const { ApiError } = require('../utils/errorHandler');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }

    next();
  };
};

const isAdmin = authorize('admin');
const isUser = authorize('user');
const isAdminOrOrganizer = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.params.id && req.user._id.toString() === req.event?.organizer?.toString()) {
    return next();
  }

  throw new ApiError(403, 'Insufficient permissions');
};

module.exports = {
  authorize,
  isAdmin,
  isUser,
  isAdminOrOrganizer
};