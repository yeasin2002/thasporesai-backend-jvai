# JobSphere Backend API

> A comprehensive backend service for a mobile marketplace connecting customers with local freelance contractors.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1-green.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19-green.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

> **⚠️ PROPRIETARY SOFTWARE**: This code is publicly visible for transparency and educational purposes only. Unauthorized use, copying, modification, or distribution is strictly prohibited. See [LICENSE](LICENSE) for details.

## 📋 Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Core Workflows](#core-workflows)
- [Contributing](#contributing)
- [License](#license)

## 🎯 About

JobSphere is a mobile-first marketplace platform that connects customers with skilled local contractors across various service categories including:

- 🔌 Electricians
- 🔧 Plumbers
- 🧹 Cleaners
- 🔨 Carpenters
- 🎨 Painters
- And many more...

The platform facilitates the entire job lifecycle from posting to completion, with secure payments, real-time communication, and comprehensive contractor profiles.

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh token rotation
- Role-based access control (Customer, Contractor, Admin)
- OTP-based password recovery via email
- Secure token management with JTI tracking

### 💼 Job Management
- **Job Posting**: Customers post jobs with budgets, categories, and locations
- **Job Applications**: Contractors apply to open jobs
- **Job Invitations**: Customers invite specific contractors
- **Offer System**: Customers send offers with payment terms
- **Job Lifecycle**: Complete status tracking from open to completed

### 💰 Payment & Wallet System
- Internal wallet system for all users
- Escrow-based secure payments
- Commission structure: 5% platform fee + 20% service fee
- Contractor receives 80% of job budget
- Transaction history and audit trail
- Withdrawal system for contractors
- Future: Stripe integration for external payments

### 💬 Real-Time Communication
- Socket.IO-based one-to-one chat
- Message history with pagination
- Typing indicators and read receipts
- Online/offline status tracking
- File sharing (images, documents)
- JWT authentication for socket connections

### 🔔 Push Notifications
- Firebase Cloud Messaging (FCM) integration
- Multi-device support per user
- 10 notification types (job updates, messages, payments, etc.)
- Notification history persistence
- Read/unread tracking

### 👤 User Profiles
- Comprehensive contractor portfolios
- Work experience tracking
- Certifications management
- Work samples gallery
- Skills and availability
- Review and rating system

### 📁 File Management
- Profile and cover images
- Portfolio images
- Certification documents
- Chat attachments
- Local storage with future cloud migration

### 📊 Admin Dashboard
- User management (suspend/unsuspend)
- Job monitoring
- Payment oversight
- Dispute resolution
- System analytics

## 🛠 Technology Stack

### Core Technologies
- **Runtime**: Node.js with TypeScript (ESNext)
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB with Mongoose ODM v8.19.2
- **Package Manager**: Bun (pnpm compatible)

### Real-Time & Communication
- **WebSocket**: Socket.IO v4.8.1
- **Push Notifications**: Firebase Admin SDK v13.5.0
- **Email**: Nodemailer v7.0.10

### Security & Validation
- **Authentication**: JWT (jsonwebtoken v9.0.2)
- **Password Hashing**: bcryptjs v3.0.2
- **Validation**: Zod v4.1.12
- **CORS**: cors v2.8.5

### Development Tools
- **Build**: tsdown v0.15.9
- **Type Checking**: TypeScript v5.9.3
- **Linting**: oxlint v1.24.0
- **Formatting**: Biome v2.2.6
- **Git Hooks**: Husky v9.1.7 + lint-staged

### Documentation
- **OpenAPI**: @asteasolutions/zod-to-openapi v8.1.0
- **Swagger UI**: swagger-ui-express v5.0.1
- **Scalar UI**: @scalar/express-api-reference v0.8.22

### Logging & Monitoring
- **Logger**: Winston v3.18.3
- **HTTP Logger**: Morgan v1.10.1
- **Daily Rotation**: winston-daily-rotate-file v5.0.0

### Future Integrations
- **Payments**: Stripe v19.3.1 (planned)
- **Cloud Storage**: AWS S3 (planned)

## 🚀 Getting Started

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup instructions, development guidelines, and contribution workflow.

### Quick Start

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
bun dev

# Access API documentation
open http://localhost:4000/swagger
```

## 📁 Project Structure

```
src/
├── app.ts                  # Application entry point
├── db/                     # Database layer
│   ├── models/             # Mongoose models
│   └── index.ts            # Model exports
├── lib/                    # Core utilities
│   ├── firebase.ts         # FCM initialization
│   ├── openapi.ts          # OpenAPI registry
│   ├── jwt.ts              # Token management
│   ├── logger.ts           # Winston logger
│   └── connect-mongo.ts    # DB connection
├── middleware/             # Express middleware
│   ├── auth.middleware.ts  # JWT auth & RBAC
│   └── validation.middleware.ts
├── helpers/                # Response & error handlers
├── common/                 # Shared resources
│   ├── constants.ts        # API paths & tags
│   ├── email/              # Email templates
│   └── service/            # Shared services
└── api/                    # API modules
    ├── auth/               # Authentication
    ├── job/                # Job management
    ├── job-request/        # Applications
    ├── job-invite/         # Invitations
    ├── offer/              # Offer management
    ├── wallet/             # Wallet & transactions
    ├── chat/               # Real-time chat
    ├── notification/       # Push notifications
    ├── review/             # Reviews & ratings
    ├── users/              # User profiles
    │   ├── profile/
    │   ├── certifications/
    │   ├── experience/
    │   └── work_samples/
    └── admin/              # Admin panel
        ├── auth-admin/
        └── admin-user/
```

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI**: http://localhost:4000/swagger
- **Scalar UI**: http://localhost:4000/scaler
- **OpenAPI JSON**: http://localhost:4000/api-docs.json

### API Endpoints Overview

#### Authentication (`/api/auth`)
- Register, Login, Logout
- Password reset with OTP
- Token refresh

#### Jobs (`/api/job`)
- CRUD operations
- Search with filters
- Job lifecycle management
- Engaged jobs (with applications/offers)

#### Applications (`/api/job-request`)
- Apply to jobs
- Accept/reject applications
- Application management

#### Invitations (`/api/job-invite`)
- Send invitations
- Accept/reject invitations
- Available contractors list

#### Offers (`/api/offer`)
- Send offers
- Accept/reject offers
- Payment integration

#### Wallet (`/api/wallet`)
- Balance management
- Deposit/withdraw
- Transaction history

#### Chat (`/api/chat`)
- Conversations
- Messages
- File sharing

#### Notifications (`/api/notification`)
- Register device tokens
- Get notifications
- Mark as read

#### User Profiles (`/api/user`)
- Profile management
- Experience, certifications, work samples
- Public profiles

#### Admin (`/api/admin`)
- User management
- System monitoring

## 👥 User Roles

### Customer (Buyer)
- Post jobs with budgets and requirements
- Review contractor applications
- Send invitations to contractors
- Send offers with payment terms
- Manage payments through wallet
- Chat with contractors
- Leave reviews after job completion

### Contractor (Seller)
- Browse and apply to jobs
- Receive and respond to invitations
- Accept/reject offers
- Manage portfolio (experience, certifications, work samples)
- Receive payments to wallet
- Withdraw earnings
- Chat with customers
- Build reputation through reviews

### Admin
- Monitor all platform activities
- Manage users (suspend/unsuspend)
- Oversee transactions
- Handle disputes
- Access system analytics
- Manage categories and locations

## 🔄 Core Workflows

### Job Posting to Completion

```
1. Customer posts job (status: open)
   ↓
2. Contractors apply OR Customer invites contractors
   ↓
3. Customer reviews applications
   ↓
4. Customer sends offer (wallet charged: budget + 5% platform fee)
   ↓
5. Contractor accepts offer
   - Platform fee (5%) → Admin wallet
   - Remaining amount → Escrow
   - Job status → assigned
   ↓
6. Contractor starts work (status: in_progress)
   ↓
7. Customer marks job complete
   - Service fee (20%) → Admin wallet
   - Contractor payout (80%) → Contractor wallet
   - Job status → completed
   ↓
8. Contractor withdraws earnings
```

### Payment Flow

```
Job Budget: $100

Customer Pays: $105 (budget + 5% platform fee)
   ↓
On Offer Acceptance:
   - Platform Fee: $5 → Admin
   - Escrow: $100 → Held
   ↓
On Job Completion:
   - Service Fee: $20 → Admin
   - Contractor: $80 → Contractor Wallet
   ↓
Admin Total: $25 (5% + 20%)
Contractor Total: $80
```

### Real-Time Chat

```
1. User connects with JWT token
   ↓
2. Socket.IO authenticates user
   ↓
3. User joins conversation room
   ↓
4. Send/receive messages in real-time
   ↓
5. Typing indicators, read receipts
   ↓
6. File sharing support
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup
- Coding standards
- Module generator usage
- Testing guidelines
- Pull request process
- Code review checklist

## 📄 License

This project is proprietary and confidential. The source code is publicly visible for transparency and educational purposes only.

**⚠️ IMPORTANT**: You are NOT permitted to use, copy, modify, or distribute this software without explicit written permission from the owner.

See [LICENSE](LICENSE) for full terms and conditions.

For licensing inquiries, please contact with Developer: mdkawsarislam2002@gmail.com


---

**Built with ❤️ for connecting customers with skilled contractors**
