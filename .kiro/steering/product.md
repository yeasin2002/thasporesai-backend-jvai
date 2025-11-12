# Product Overview

**JobSphere**  is a mobile marketplace backend that connects customers with local freelance contractors (electricians, plumbers, cleaners, carpenters, etc.). Built with TypeScript and Express.js, this application provides RESTful API endpoints with MongoDB database integration.

## User Roles

### 1. Customer (Buyer)

- Normal users who hire contractors for services
- Can post job requests, search contractors, make bookings
- Manage payments, reviews, and communicate with contractors

### 2. Contractor (Seller)

- Service providers offering their skills
- Manage profiles, portfolios, pricing, and availability
- Accept/decline jobs, track earnings, communicate with customers

### 3. Admin

- Dashboard access to monitor all system activities
- access to customer and contractor data and have power to modify, accept or reject. 
- Manage disputes, verify contractors, oversee transactions

## Key Features

- **Authentication System**: JWT-based with access and refresh token rotation
  - User registration (Customer & Contractor)
  - Login with email/password
  - Forgot password with 4-digit OTP via email
  - Secure token refresh mechanism with JTI tracking
  - Admin authentication (separate endpoint)

- **Real-Time Chat**: Socket.IO-based messaging system
  - One-to-one chat between customers and contractors
  - Message history and read receipts
  - File sharing in conversations
  - Typing indicators and online status
  - No voice/video call support

- **Push Notifications**: Mobile notifications for Flutter app
  - Job updates, booking confirmations
  - New messages and payment notifications
  - Firebase Cloud Messaging (FCM) integration
  - Multi-device support
  - Notification history stored in database
  - 10 notification types supported

- **File Upload System**: Local storage with cloud migration planned
  - Profile and cover images
  - Portfolio images (work samples)
  - Certification images
  - Job-related documents
  - Chat attachments
  - Currently stored in `/uploads` folder
  - Multer configuration for file handling
  - Future migration to AWS S3 or similar

- **Payment System**: Stripe integration with escrow
  - Secure payment processing
  - Admin holds payment until job completion
  - Automatic release to contractor
  - Contractor withdrawal system
  - Configurable admin commission
  - Stripe Connect for contractor payouts

- RESTful API server with Express.js v5.1.0
- MongoDB database with Mongoose ODM v8.19.2
- Type-safe development with TypeScript v5.9.3
- CORS-enabled for cross-origin requests
- Environment-based configuration with dotenv
- Git hooks for code quality enforcement (Husky + lint-staged)
- Advanced logging with Winston (daily rotating files)
- OpenAPI documentation with Swagger UI and Scalar UI
- Zod validation for runtime type checking

## Architecture

The application follows a modular Express.js architecture with separate concerns for database connectivity, routing, authentication, real-time communication, and main application logic. It's designed as a standalone backend service serving Flutter mobile apps and React.js admin dashboard.

### Technology Integration
- **Mobile App**: Flutter (separate repository)
- **Admin Dashboard**: React.js (planned)
- **Real-Time**: Socket.IO v4.8.1 for bidirectional communication
- **Payments**: Stripe API with Connect for payouts (planned)
- **Notifications**: Firebase Cloud Messaging (FCM) via Firebase Admin SDK v13.5.0
- **File Storage**: Local filesystem with Multer v2.0.2 (migration to cloud planned)
- **Logging**: Winston v3.18.3 with daily file rotation
- **Email**: Nodemailer v7.0.10 for OTP and transactional emails
