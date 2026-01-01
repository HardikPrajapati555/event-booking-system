const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  tickets: {
    type: Number,
    required: [true, 'Number of tickets is required'],
    min: [1, 'Minimum 1 ticket required'],
    max: [10, 'Maximum 10 tickets per booking']
  },
  totalAmount: {
    type: Number,
    required: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'confirmed'
  },
  paymentId: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cash'],
    default: 'card'
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  cancelledAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Event = mongoose.model('Event');
    
    try {
      const event = await Event.findById(this.event);
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      if (event.availableSeats < this.tickets) {
        throw new Error(`Only ${event.availableSeats} seats available`);
      }
      
      event.availableSeats -= this.tickets;
      await event.save();
    } catch (error) {
      next(error);
    }
  }
  
  this.updatedAt = Date.now();
  next();
});


bookingSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  if (update.status === 'cancelled') {
    const booking = await this.model.findOne(this.getQuery());
    
    if (booking && booking.status !== 'cancelled') {
      const Event = mongoose.model('Event');
      const event = await Event.findById(booking.event);
      
      if (event) {
        event.availableSeats += booking.tickets;
        await event.save();
        
        
        update.cancelledAt = new Date();
      }
    }
  }
  
  next();
});


bookingSchema.index({ user: 1, event: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;