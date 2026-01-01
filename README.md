# Event Booking System

A complete event booking system built with Node.js, Express, and MongoDB.

## Features

-  User registration and authentication with JWT
-  Role-based access control (Admin/User)
-  Event creation, listing, and management
-  Event booking with real-time seat availability
-  Booking cancellation with seat restoration
-  Advanced filtering and pagination
-  Rate limiting for sensitive endpoints
-  Export bookings as CSV
-  Email notifications
-  Comprehensive error handling
-  Input validation and sanitization
-  API documentation with Swagger



# Event Booking System - Complete Backend API

> **Production-ready Node.js backend for an event booking system**  
> *Built for technical interviews - showcasing best practices and advanced features*

##  **Live Demo & Documentation**
- **API Documentation:** [Swagger UI](http://localhost:3000/api-docs)




###  **Security Features**
- Password hashing with bcrypt
- JWT authentication with refresh tokens
- Helmet.js security headers
- CORS configuration
- Input validation & sanitization
- MongoDB injection prevention
- Rate limiting on auth endpoints

##  **Tech Stack**
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication |
| **bcryptjs** | Password hashing |
| **Joi** | Input validation |
| **Winston** | Logging |
| **Swagger** | API documentation |

## **Project Architecture**



## 🔗 **API Endpoints**

### **Authentication**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| GET | `/auth/profile` | Get user profile  |
| POST | `/auth/logout` | Logout user  |

### **Events**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/events` | Get all events (filterable) |
| GET | `/events/:id` | Get single event |
| POST | `/events` | Create event | (Admin) |
| PUT | `/events/:id` | Update event |  (Admin/Organizer) |
| DELETE | `/events/:id` | Delete event |  (Admin/Organizer) |

### **Bookings**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings` | Create booking |  |
| GET | `/bookings/my-bookings` | Get user bookings |  |
| PUT | `/bookings/:id/cancel` | Cancel booking |  |
| GET | `/bookings/export` | Export as CSV | (Admin) |


 Admin Access
Default admin credentials (created by migration):

Email: admin@eventbooking.com

Password: Admin@123