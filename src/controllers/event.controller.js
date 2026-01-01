const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { ApiResponse } = require('../utils/responseHandler');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const moment = require('moment');

class EventController {
 
  async createEvent(req, res, next) {
    try {
      const eventData = {
        ...req.body,
        organizer: req.user._id,
        availableSeats: req.body.capacity
      };

      const event = await Event.create(eventData);

      logger.info(`Event created: ${event.name} by ${req.user.email}`);

      const response = new ApiResponse(201, 'Event created successfully', { event });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get all events with filtering and pagination
  async getEvents(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        start,
        end,
        category,
        organizer,
        search
      } = req.query;

      const filter = { isActive: true };
      
     
      if (start || end) {
        filter.date = {};
        if (start) filter.date.$gte = new Date(start);
        if (end) filter.date.$lte = new Date(end);
      }

      
      if (category) {
        filter.category = category;
      }

     
      if (organizer) {
        filter.organizer = organizer;
      }

     
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }

     
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate('organizer', 'name email')
          .sort({ date: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Event.countDocuments(filter)
      ]);

    
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const response = new ApiResponse(200, 'Events retrieved', {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      });

      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

 
  async getEventById(req, res, next) {
    try {
      const { id } = req.params;
      
      const event = await Event.findOne({ _id: id, isActive: true })
        .populate('organizer', 'name email')
        .populate({
          path: 'bookings',
          select: 'user tickets bookingDate',
          populate: {
            path: 'user',
            select: 'name email'
          }
        });

      if (!event) {
        throw new ApiError(404, 'Event not found');
      }

      const response = new ApiResponse(200, 'Event retrieved', { event });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }


  async updateEvent(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

   
      const event = await Event.findById(id);
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }

      if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to update this event');
      }

      
      if (updateData.capacity && updateData.capacity < (event.capacity - event.availableSeats)) {
        throw new ApiError(400, 'New capacity cannot be less than booked seats');
      }

     
      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('organizer', 'name email');

      logger.info(`Event updated: ${updatedEvent.name} by ${req.user.email}`);

      const response = new ApiResponse(200, 'Event updated successfully', { event: updatedEvent });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Delete event
  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }

      if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to delete this event');
      }

 
      const bookingCount = await Booking.countDocuments({ event: id });
      if (bookingCount > 0) {
      
        event.isActive = false;
        await event.save();
        
        logger.info(`Event soft deleted: ${event.name} by ${req.user.email}`);
        
        const response = new ApiResponse(200, 'Event deactivated (has existing bookings)', { event });
        return res.status(response.statusCode).json(response);
      }

     
      await Event.findByIdAndDelete(id);

      logger.info(`Event deleted: ${event.name} by ${req.user.email}`);

      const response = new ApiResponse(200, 'Event deleted successfully');
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  
  async getEventStats(req, res, next) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }

      const stats = await Booking.aggregate([
        { $match: { event: event._id, status: 'confirmed' } },
        {
          $group: {
            _id: null,
            totalTickets: { $sum: '$tickets' },
            totalRevenue: { $sum: '$totalAmount' },
            bookingCount: { $sum: 1 }
          }
        }
      ]);

      const response = new ApiResponse(200, 'Event statistics retrieved', {
        event: {
          name: event.name,
          capacity: event.capacity,
          availableSeats: event.availableSeats,
          bookedSeats: event.capacity - event.availableSeats,
          occupancyRate: ((event.capacity - event.availableSeats) / event.capacity * 100).toFixed(2)
        },
        bookings: stats[0] || {
          totalTickets: 0,
          totalRevenue: 0,
          bookingCount: 0
        }
      });

      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();