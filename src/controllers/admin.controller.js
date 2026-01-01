const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { ApiResponse } = require('../utils/responseHandler');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

class AdminController {
  // Get all users
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search, role } = req.query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) filter.role = role;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password -refreshToken')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        User.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      const response = new ApiResponse(200, 'Users retrieved', {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      });

      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Toggle user active status
  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Prevent deactivating admin accounts
      if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, 'Cannot deactivate your own admin account');
      }

      user.isActive = !user.isActive;
      await user.save();

      logger.info(`User ${user.isActive ? 'activated' : 'deactivated'}: ${user.email} by ${req.user.email}`);

      const response = new ApiResponse(200, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, { user });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get system statistics
  async getSystemStats(req, res, next) {
    try {
      const [
        totalUsers,
        totalEvents,
        totalBookings,
        totalRevenue,
        upcomingEvents,
        recentBookings
      ] = await Promise.all([
        User.countDocuments(),
        Event.countDocuments({ isActive: true }),
        Booking.countDocuments({ status: 'confirmed' }),
        Booking.aggregate([
          { $match: { status: 'confirmed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Event.find({ 
          date: { $gt: new Date() },
          isActive: true 
        })
          .sort({ date: 1 })
          .limit(5)
          .populate('organizer', 'name'),
        Booking.find({ status: 'confirmed' })
          .sort({ bookingDate: -1 })
          .limit(10)
          .populate([
            { path: 'user', select: 'name email' },
            { path: 'event', select: 'name date' }
          ])
      ]);

      const response = new ApiResponse(200, 'System statistics retrieved', {
        stats: {
          totalUsers,
          totalEvents,
          totalBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          upcomingEvents: upcomingEvents.length,
          activeUsers: await User.countDocuments({ isActive: true })
        },
        upcomingEvents,
        recentBookings
      });

      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Promote user to admin
  async promoteToAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.role === 'admin') {
        throw new ApiError(400, 'User is already an admin');
      }

      user.role = 'admin';
      await user.save();

      logger.info(`User promoted to admin: ${user.email} by ${req.user.email}`);

      const response = new ApiResponse(200, 'User promoted to admin successfully', { user });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get all bookings (admin view)
  async getAllBookings(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        start, 
        end,
        eventId,
        userId 
      } = req.query;
      
      const skip = (page - 1) * limit;

      const filter = {};
      if (status) filter.status = status;
      if (eventId) filter.event = eventId;
      if (userId) filter.user = userId;

      if (start || end) {
        filter.bookingDate = {};
        if (start) filter.bookingDate.$gte = new Date(start);
        if (end) filter.bookingDate.$lte = new Date(end);
      }

      const [bookings, total] = await Promise.all([
        Booking.find(filter)
          .populate([
            { path: 'user', select: 'name email' },
            { path: 'event', select: 'name date location' }
          ])
          .sort({ bookingDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Booking.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      const response = new ApiResponse(200, 'All bookings retrieved', {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      });

      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();