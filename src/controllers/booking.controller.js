const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { ApiResponse } = require('../utils/responseHandler');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { generateCSV } = require('../utils/csvGenerator');

class BookingController {
  // Create booking
  async createBooking(req, res, next) {
    try {
      const { eventId, tickets, paymentMethod = 'card' } = req.body;

      // Check if event exists and is active
      const event = await Event.findOne({ _id: eventId, isActive: true });
      if (!event) {
        throw new ApiError(404, 'Event not found or inactive');
      }

    
      if (event.date <= new Date()) {
        throw new ApiError(400, 'Cannot book past events');
      }

      
      if (event.availableSeats < tickets) {
        throw new ApiError(400, `Only ${event.availableSeats} seats available`);
      }

      // Check if user already booked this event
      const existingBooking = await Booking.findOne({
        user: req.user._id,
        event: eventId,
        status: 'confirmed'
      });

      if (existingBooking) {
        throw new ApiError(400, 'You have already booked this event');
      }

      // Calculate total amount
      const totalAmount = event.price * tickets;

      // Create booking
      const booking = await Booking.create({
        user: req.user._id,
        event: eventId,
        tickets,
        totalAmount,
        paymentMethod
      });

      // Populate event and user details
      await booking.populate([
        { path: 'event', select: 'name date location' },
        { path: 'user', select: 'name email' }
      ]);

      logger.info(`Booking created: ${tickets} tickets for ${event.name} by ${req.user.email}`);

      const response = new ApiResponse(201, 'Booking created successfully', { booking });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get user's bookings
  async getUserBookings(req, res, next) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const filter = { user: req.user._id };
      if (status) filter.status = status;

      const [bookings, total] = await Promise.all([
        Booking.find(filter)
          .populate({
            path: 'event',
            select: 'name date location capacity availableSeats'
          })
          .sort({ bookingDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Booking.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const response = new ApiResponse(200, 'Bookings retrieved', {
        bookings,
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

  // Cancel booking
  async cancelBooking(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await Booking.findOne({
        _id: id,
        user: req.user._id,
        status: 'confirmed'
      });

      if (!booking) {
        throw new ApiError(404, 'Booking not found or already cancelled');
      }

      // Check if event is too close (within 24 hours)
      const event = await Event.findById(booking.event);
      const hoursUntilEvent = (event.date - new Date()) / (1000 * 60 * 60);
      
      if (hoursUntilEvent < 24) {
        throw new ApiError(400, 'Cannot cancel booking within 24 hours of event');
      }

      // Update booking
      booking.status = 'cancelled';
      booking.cancellationReason = reason;
      booking.cancelledAt = new Date();
      await booking.save();

      logger.info(`Booking cancelled: ${booking._id} by ${req.user.email}`);

      const response = new ApiResponse(200, 'Booking cancelled successfully', { booking });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

 
  async exportBookings(req, res, next) {
    try {
      const { start, end, eventId } = req.query;

      const filter = { status: 'confirmed' };
      
      if (start || end) {
        filter.bookingDate = {};
        if (start) filter.bookingDate.$gte = new Date(start);
        if (end) filter.bookingDate.$lte = new Date(end);
      }

      if (eventId) {
        filter.event = eventId;
      }

      const bookings = await Booking.find(filter)
        .populate([
          { path: 'user', select: 'name email' },
          { path: 'event', select: 'name date' }
        ])
        .sort({ bookingDate: -1 });

      if (bookings.length === 0) {
        throw new ApiError(404, 'No bookings found for the given criteria');
      }

      
      const csvData = bookings.map(booking => ({
        'Booking ID': booking._id.toString(),
        'Event Name': booking.event.name,
        'Event Date': booking.event.date.toISOString().split('T')[0],
        'User Name': booking.user.name,
        'User Email': booking.user.email,
        'Tickets': booking.tickets,
        'Total Amount': booking.totalAmount,
        'Booking Date': booking.bookingDate.toISOString().split('T')[0],
        'Payment Method': booking.paymentMethod
      }));

      const csvContent = await generateCSV(csvData);

     
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bookings_${Date.now()}.csv`);
      
      res.send(csvContent);

      logger.info(`Bookings exported: ${bookings.length} records by ${req.user.email}`);
    } catch (error) {
      next(error);
    }
  }

 
  async getBookingById(req, res, next) {
    try {
      const { id } = req.params;

      const booking = await Booking.findById(id)
        .populate([
          { path: 'user', select: 'name email' },
          { path: 'event', select: 'name date location capacity' }
        ]);

      if (!booking) {
        throw new ApiError(404, 'Booking not found');
      }

     
      if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to view this booking');
      }

      const response = new ApiResponse(200, 'Booking retrieved', { booking });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();