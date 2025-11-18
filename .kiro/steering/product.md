# Product Overview

**JobSphere** is a mobile marketplace backend connecting customers with local freelance contractors. Built with TypeScript, Express.js, and MongoDB.

## User Roles

- **Customer**: Posts jobs, sends offers, manages payments and reviews
- **Contractor**: Applies to jobs, accepts offers, manages portfolio, receives payments
- **Admin**: Monitors system, manages users, handles disputes, oversees transactions

## Core Features

### Authentication & Authorization
- JWT-based with access/refresh token rotation
- Role-based access control (Customer, Contractor, Admin)
- OTP-based password reset via email
- Separate admin authentication

### Job Management
- Job posting with categories, locations, and budgets
- Job application system for contractors
- Job invitation system (customers invite contractors)
- Offer system with escrow payments
- Job lifecycle: open → assigned → in_progress → completed/cancelled

### Payment & Wallet System
- Wallet-based transactions with escrow
- Commission structure: 5% platform fee + 20% service fee
- Contractor receives 80% of job budget
- Stripe integration (planned for external payments)
- Transaction history and audit trail

### Real-Time Communication
- Socket.IO-based one-to-one chat
- Message history with read receipts
- File sharing support
- Typing indicators and online status

### Push Notifications
- Firebase Cloud Messaging (FCM)
- 10 notification types (job updates, messages, payments, etc.)
- Multi-device support
- Notification history persistence

### User Profiles
- Contractor portfolios (experience, certifications, work samples)
- Profile and cover images
- Skills and availability management
- Review and rating system

### File Management
- Local storage in `/uploads` folder
- Profile images, portfolios, certifications
- Chat attachments
- Future: Cloud storage migration

## Technology Stack

- **Runtime**: Node.js + TypeScript (ESNext)
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB + Mongoose v8.19.2
- **Real-Time**: Socket.IO v4.8.1
- **Notifications**: Firebase Admin SDK v13.5.0
- **Validation**: Zod v4.1.12
- **Documentation**: OpenAPI 3.0 (Swagger + Scalar UI)
- **Logging**: Winston v3.18.3
- **Email**: Nodemailer v7.0.10

## Clients

- **Mobile App**: Flutter (separate repository)
- **Admin Dashboard**: React.js (planned)
