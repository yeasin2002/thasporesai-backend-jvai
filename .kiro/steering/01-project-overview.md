# Project Overview

## What is JobSphere?

JobSphere is a mobile marketplace backend API connecting customers with local freelance contractors. Built with TypeScript, Express.js, and MongoDB, it serves a Flutter mobile app and planned React admin dashboard.

## User Roles

- **Customer**: Posts jobs, sends offers, manages payments, submits reviews
- **Contractor**: Applies to jobs, accepts offers, manages portfolio, receives payments
- **Admin**: Monitors system, manages users, handles disputes, oversees transactions

## Core Business Features

### Job Marketplace

- Job posting with categories, locations, and budgets
- Contractor application system
- Customer invitation system (invite specific contractors)
- Offer system with escrow-based payments
- Job lifecycle: open → assigned → in_progress → completed/cancelled

### Payment System

- Wallet-based transactions with escrow protection
- Commission structure: 5% platform fee + 20% service fee
- Contractor receives 80% of job budget
- Transaction history and audit trail
- Future: Stripe integration for external payments

### Communication

- Real-time one-to-one chat via Socket.IO
- Message history with read receipts
- File sharing support
- Typing indicators and online status
- Push notifications via Firebase Cloud Messaging (FCM)
- 10 notification types (job updates, messages, payments, etc.)

### User Profiles

- Contractor portfolios (experience, certifications, work samples)
- Profile and cover images
- Skills and availability management
- Review and rating system

### Authentication & Security

- JWT-based with access/refresh token rotation
- Role-based access control (RBAC)
- OTP-based password reset via email
- Separate admin authentication

## Technology Stack

- **Runtime**: Node.js + TypeScript (ESNext)
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB + Mongoose v8.19.2
- **Real-Time**: Socket.IO v4.8.1
- **Validation**: Zod v4.1.12
- **Documentation**: OpenAPI 3.0 (Swagger + Scalar UI)
- **Notifications**: Firebase Admin SDK
- **Email**: Nodemailer
- **Logging**: Winston with daily rotation
- **Package Manager**: pnpm
- **Build**: tsdown bundler
- **Linting**: oxlint + biome

## Development Commands

- `bun dev` - Start development server with hot reload
- `bun build` - Build for production
- `bun start` - Start production server
- `bun check` - Run linter
- `bun check-types` - TypeScript type checking
- `bun format` - Format code
- `bun run generate:module` - Generate new API module
