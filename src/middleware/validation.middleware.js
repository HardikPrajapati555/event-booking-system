const Joi = require('joi');
const { ApiError } = require('../utils/errorHandler');


const validationSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createEvent: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    date: Joi.date().greater('now').required(),
    capacity: Joi.number().min(1).max(10000).required(),
    location: Joi.string().max(200).optional(),
    price: Joi.number().min(0).optional(),
    category: Joi.string().valid('concert', 'conference', 'workshop', 'sports', 'other').optional()
  }),

  updateEvent: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    description: Joi.string().max(500).optional(),
    date: Joi.date().greater('now').optional(),
    capacity: Joi.number().min(1).max(10000).optional(),
    location: Joi.string().max(200).optional(),
    price: Joi.number().min(0).optional(),
    category: Joi.string().valid('concert', 'conference', 'workshop', 'sports', 'other').optional(),
    isActive: Joi.boolean().optional()
  }),

  createBooking: Joi.object({
    eventId: Joi.string().hex().length(24).required(),
    tickets: Joi.number().min(1).max(10).required(),
    paymentMethod: Joi.string().valid('card', 'paypal', 'bank_transfer', 'cash').optional()
  }),

  eventFilters: Joi.object({
    start: Joi.date().optional(),
    end: Joi.date().optional(),
    page: Joi.number().min(1).optional().default(1),
    limit: Joi.number().min(1).max(100).optional().default(10),
    category: Joi.string().optional(),
    organizer: Joi.string().hex().length(24).optional(),
    search: Joi.string().optional()
  })
};

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = validationSchemas[schema].validate(req[property], {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      throw new ApiError(400, 'Validation failed', errors);
    }

    next();
  };
};

module.exports = validate;