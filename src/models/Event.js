const mongoose = require('mongoose');
const validator = require('validator');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    minlength: [3, 'Event name must be at least 3 characters'],
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        return value > Date.now();
      },
      message: 'Event date must be in the future'
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [10000, 'Capacity cannot exceed 10000']
  },
  availableSeats: {
    type: Number,
    default: function() {
      return this.capacity;
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters'],
    default: 'Online'
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    enum: ['concert', 'conference', 'workshop', 'sports', 'other'],
    default: 'other'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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


eventSchema.pre('save', function(next) {
  if (this.isModified('capacity')) {
    this.availableSeats = this.capacity - (this.capacity - this.availableSeats);
  }
  this.updatedAt = Date.now();
  next();
});


eventSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'event'
});


eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ organizer: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;