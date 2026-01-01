const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const { sendEmail } = require('../services/email.service');
const { ApiResponse } = require('../utils/responseHandler');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

class AuthController {
  
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;


      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'Email already registered');
      }

     
      const user = await User.create({
        name,
        email,
        password
      });

     
      const token = generateToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

     
      user.refreshToken = refreshToken;
      await user.save();

    
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Event Booking System',
        html: `<h1>Welcome ${user.name}!</h1>
               <p>Your account has been successfully created.</p>`
      });

      logger.info(`New user registered: ${user.email}`);

      
      user.password = undefined;
      user.refreshToken = undefined;

      const response = new ApiResponse(201, 'User registered successfully', {
        user,
        token,
        refreshToken
      });

      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

     
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }

     
      if (!user.isActive) {
        throw new ApiError(403, 'Account is deactivated');
      }

      
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
      }

      
      const token = generateToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

    
      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email}`);

      user.password = undefined;
      user.refreshToken = undefined;

      const response = new ApiResponse(200, 'Login successful', {
        user,
        token,
        refreshToken
      });

      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
      }

      const user = await User.findOne({ refreshToken });
      if (!user) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      const newToken = generateToken(user._id, user.role);
      const newRefreshToken = generateRefreshToken(user._id);

   
      user.refreshToken = newRefreshToken;
      await user.save();

      const response = new ApiResponse(200, 'Token refreshed', {
        token: newToken,
        refreshToken: newRefreshToken
      });

      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user._id)
        .populate({
          path: 'bookings',
          populate: {
            path: 'event',
            select: 'name date location'
          }
        });

      const response = new ApiResponse(200, 'Profile retrieved', { user });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

 
  async logout(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      logger.info(`User logged out: ${req.user.email}`);

      const response = new ApiResponse(200, 'Logged out successfully');
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();