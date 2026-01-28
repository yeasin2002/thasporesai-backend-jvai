# JobSphere Backend Agent Guide

> [!NOTE]
> This document guides AI agents on the project structure, conventions, and workflows for the JobSphere Backend.

## 1. Project Overview

JobSphere is a mobile marketplace backend API connecting customers with local freelance contractors. Built with TypeScript, Express.js, and MongoDB, it serves a Flutter mobile app and planned React admin dashboard.

### User Roles
- **Customer**: Posts jobs, sends offers, manages payments, submits reviews
- **Contractor**: Applies to jobs, accepts offers, manages portfolio, receives payments  
- **Admin**: Monitors system, manages users, handles disputes, oversees transactions

### Core Business Features
- **Job Marketplace**: Job posting, applications, invitations, offer system with escrow payments
- **Payment System**: Wallet-based with Stripe integration (v2.0) - 25% commission (5% + 20%)
- **Real-Time Communication**: Socket.IO chat with FCM push notifications
- **User Profiles**: Contractor portfolios, reviews, ratings
- **Authentication**: JWT with access/refresh token rotation, role-based access control

## 2. Technology Stack
- **Runtime**: Node.js + TypeScript (ESNext)
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB + Mongoose v8.19.2
- **Real-Time**: Socket.IO v4.8.1
- **Validation**: Zod v4.1.12 (with OpenAPI registry)
- **Documentation**: OpenAPI 3.0 (Swagger + Scalar UI)
- **Notifications**: Firebase Admin SDK
- **Email**: Nodemailer
- **Logging**: Winston with daily rotation
- **Package Manager**: pnpm
- **Build**: tsdown bundler
- **Linting**: oxlint + biome

## 3. Directory Structure

```
src/
├── app.ts                  # Application entry point
├── db/                     # Database layer (Mongoose models)
│   ├── index.ts            # Centralized model exports via 'db' object
│   └── models/             # Individual Mongoose models
├── lib/                    # Core utilities (JWT, Firebase, OpenAPI, Logger)
├── middleware/             # Express middleware (Auth, Validation, Errors)
├── helpers/                # Response & error handlers
├── common/                 # Shared resources (constants, email templates, validations)
│   ├── constants/          # API paths and OpenAPI tags (single source of truth)
│   ├── email/              # Email templates (OTP, welcome)
│   ├── service/            # Shared business logic (notifications, user queries)
│   └── validations/        # Common Zod schemas
└── api/                    # API modules
    ├── auth/               # Authentication & authorization
    ├── job/                # Job management
    ├── job-request/        # Job applications
    ├── job-invite/         # Job invitations  
    ├── offer/              # Offer management
    ├── wallet/             # Wallet & transactions (Stripe integration)
    ├── chat/               # Real-time chat (REST + Socket.IO)
    │   └── socket/         # Socket.IO handlers, middleware, utils
    ├── notification/       # Push notifications (FCM)
    ├── review/             # Reviews & ratings
    ├── category/           # Job categories
    ├── location/           # Geographic locations
    ├── users/              # User profiles (nested modules)
    │   ├── profile/        # Main profile management
    │   ├── certifications/ # Contractor certifications
    │   ├── experience/     # Work experience
    │   └── work_samples/   # Portfolio samples
    ├── admin/              # Admin panel (nested modules)
    │   ├── auth-admin/     # Admin authentication
    │   └── admin-user/     # User management
    └── common/             # File uploads & shared endpoints
```

### Module Architecture Patterns

#### Standard Module Pattern
```
[module]/
├── [module].route.ts       # Express routes
├── [module].validation.ts  # Zod schemas + TypeScript types  
├── [module].openapi.ts     # OpenAPI documentation
└── services/               # Business logic
    ├── index.ts            # Barrel exports
    └── [action].service.ts # Individual service handlers
```

#### Nested Module Pattern
For complex features (admin, user profiles):
```
parent/sub-module/
├── sub-module.route.ts     # Export as 'parentSubModule'
├── sub-module.validation.ts
├── sub-module.openapi.ts
└── services/
```

## 4. Development Commands
- `bun dev`: Start development server with hot reload
- `bun build`: Build for production  
- `bun start`: Start production server
- `bun check`: Run linter (oxlint + biome)
- `bun check-types`: TypeScript type checking
- `bun format`: Format code
- `bun run generate:module`: Generate new API module (interactive/direct mode)

### Module Generation
- **Interactive Mode**: `bun run generate:module`
- **Direct Mode**: `bun run generate:module --module auth`
- **Nested Module**: `bun run generate:module --sub admin --module user`

Post-generation steps:
1. Create Mongoose model in `src/db/models/`
2. Register model in `src/db/index.ts`
3. Register route in `src/app.ts`
4. Customize validation schemas
5. Implement business logic in service files

## 5. Coding Conventions & Patterns

### A. API Module Development
- **Pattern**: `route` → `validation` (middleware) → `service` (handler)
- **Naming Conventions**:
  - Routes: kebab-case (e.g., `job-request.route.ts`)
  - Services: `action-name.service.ts` (e.g., `create-offer.service.ts`)
  - Exports: camelCase (e.g., `jobRequest`)
  - Variables: camelCase, Types: PascalCase, Constants: UPPER_CASE
- **Route Paths**: Use plural nouns (`/api/jobs`, `/api/users`)
- **Scaffolding**: Always use `bun run generate:module` for consistency

### B. Service Layer Pattern
- **Structure**: One file per action, typed as `RequestHandler`
- **Signature**: 
  ```typescript
  export const actionName: RequestHandler = async (req, res) => {
    try {
      // Business logic here
      return sendSuccess(res, 200, "Success message", data);
    } catch (error) {
      return sendError(res, 500, "Error message");
    }
  };
  ```
- **Response Format**: All APIs return consistent structure:
  ```typescript
  {
    status: number,
    message: string, 
    data: any | null,
    success: boolean,
    errors?: any
  }
  ```
- **Response Helpers**:
  - `sendSuccess(res, status, message, data)` - Success responses
  - `sendError(res, status, message, errors?)` - Error responses
  - `sendCreated(res, message, data)` - 201 Created
  - `sendInternalError(res, message)` - 500 Internal Server Error

### C. Database Access Pattern
- **Model Access**: Import centralized `db` object
  ```typescript
  import { db } from "@/db";
  // Usage: db.user.find(), db.job.create(), etc.
  ```
- **Common Operations**:
  - Create: `db.model.create(data)`
  - Find: `db.model.find(query)`, `db.model.findById(id)`
  - Update: `db.model.findByIdAndUpdate(id, data, { new: true })`
  - Delete: `db.model.findByIdAndDelete(id)`
- **Transactions**: Use MongoDB transactions for all money/wallet operations
- **Error Handling**: Use MongoDB error handler for consistent messages

### D. Validation & Documentation (Zod + OpenAPI)
- **Schema Definition**: Define in `[module].validation.ts`
- **OpenAPI Registration**: Use `.openapi()` method to name schemas
- **Schema Patterns**:
  - Base schema with all fields
  - Create schema (omit auto-generated fields)  
  - Update schema (all fields optional)
  - Parameter schemas for route params
  - Response schemas for API responses
- **Middleware**: `validateBody(schema)`, `validateParams(schema)`, `validateQuery(schema)`
- **Type Export**: `type CreateUser = z.infer<typeof CreateUserSchema>`

### E. Authentication & Authorization Chain
- **Authentication**: `requireAuth`, `optionalAuth`
- **Authorization**: `requireRole(role)`, `requireAnyRole([roles])`, `requireOwnership(param)`
- **Route Protection Examples**:
  - Public: No middleware
  - Authenticated: `requireAuth`
  - Role-specific: `requireAuth, requireRole("customer")`
  - Owner-only: `requireAuth, requireOwnership("id")`
  - Multiple roles: `requireAuth, requireAnyRole(["customer", "contractor"])`

## 6. Payment System (v2.0) - ✅ Complete

### Commission Structure
```
$100 Job Example:
├── Customer Pays: $105 (100 + 5% platform fee)
├── Platform Fee: $5 → Admin (when offer accepted)  
├── Service Fee: $20 → Admin (when job completed)
└── Contractor Gets: $80 (when job completed)

Total Admin Commission: $25 (25%)
```

### Payment Flow Lifecycle
```
1. CUSTOMER DEPOSITS → Stripe Checkout (returns URL for browser)
2. CUSTOMER SENDS OFFER → No wallet change (pending acceptance)
3. CONTRACTOR ACCEPTS → DB wallet updates (customer -$105, admin +$105)
4. JOB IN PROGRESS → Contractor works
5. CUSTOMER MARKS COMPLETE → Creates admin approval request
6. ADMIN APPROVES → DB updates (admin -$80, contractor +$80) + Stripe Connect transfer
7. ALTERNATIVE: CANCELLATION → DB refund (admin -$105, customer +$105)
```

### Key Database Models
- **Wallet**: Single `balance` field (no escrow), `stripeCustomerId`, `stripeConnectAccountId`
- **Offer**: One per job (unique index), includes all fee calculations, status tracking
- **Transaction**: Complete audit trail (`deposit`, `withdrawal`, `wallet_transfer`, `contractor_payout`, `refund`)

### Critical API Endpoints
- `POST /api/wallet/deposit` - Create Stripe Checkout Session (returns URL)
- `POST /api/job-request/:applicationId/send-offer` - Customer sends offer
- `POST /api/job-request/offer/:offerId/accept` - Contractor accepts (triggers wallet transfer)
- `POST /api/job/:id/complete` - Request completion (customer)
- `POST /api/admin/completion-requests/:id/approve` - Approve completion (admin)
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Business Rules
- One offer per job (enforced by unique index)
- Money moves in DB only when offer accepted (no real Stripe transfer)
- Real Stripe transfers only for deposits and admin-approved payouts
- All money movements create transaction records
- Use MongoDB transactions for atomicity
- Admin approval required for all outgoing money

### Documentation Reference
Complete guides in `doc/payment/`:
- `README.md` - Navigation hub
- `1.MAIN-REFERENCE.md` - Complete system with Stripe
- `2.BACKEND_IMPLEMENTATION.md` - Implementation guide  
- `3.FRONTEND_API_GUIDE.md` - API reference for Flutter

## 7. Real-Time Communication & Notifications

### Socket.IO Chat System
- **Architecture**: Room-based for 1-on-1 conversations
- **Authentication**: JWT middleware for socket connections
- **Room Management**: Deterministic room IDs (sorted user IDs)
- **Events**: 
  - Client → Server: `authenticate`, `join_conversation`, `send_message`, `typing_start/stop`
  - Server → Client: `new_message`, `message_delivered`, `user_typing`, `user_online_status`
- **Features**: Message history, typing indicators, read receipts, file sharing

### Firebase Cloud Messaging (FCM)
- **Setup**: Firebase Admin SDK in `src/lib/firebase.ts`
- **Token Management**: Multi-device support per user
- **Notification Types**: 10 types (job updates, messages, payments, offers, invitations, reviews)
- **API Endpoints**:
  - `POST /api/notification/register-token` - Register device token
  - `POST /api/notification/send-notification` - Send notification
  - `GET /api/notification` - Get notification history

### Integration Points
- Chat messages trigger push notifications
- Job status changes send notifications
- Payment events notify relevant users
- All notifications saved to database for history

## 8. Authentication & Security

### JWT Strategy
- **Access Tokens**: Short-lived (15 days dev, 15-30 min production)
- **Refresh Tokens**: Long-lived (30 days), rotated on each use
- **Storage**: Response body (not cookies) for mobile compatibility

### Authentication Flows
- Registration with email/password/role
- Login with credentials validation
- Forgot password with 4-digit OTP (10-15 min expiry)
- Reset password with OTP verification
- Token refresh with rotation

### Role-Based Access Control (RBAC)
- **Roles**: Customer, Contractor, Admin
- **Middleware Chain**: Authentication → Authorization → Validation → Handler
- **Resource Ownership**: Verify user owns resource before modifications

## 9. Job System & Business Logic

### Job Lifecycle
```
open → assigned → in_progress → completed
  ↓                                ↓
cancelled ←─────────────────────────┘
```

### Core Features
- **Job Posting**: Categories, locations, budgets, cover images
- **Applications**: Contractors apply, customers review/accept/reject
- **Invitations**: Customers invite specific contractors
- **Offers**: One per job with escrow-based payments
- **Engaged Jobs**: Special endpoint for jobs with applications/offers

### User Profiles
- **Contractor Portfolio**: Experience, certifications, work samples
- **Profile Management**: Images, skills, availability, bio
- **Review System**: Job completion enables reviews, rating aggregation

## 10. Environment Configuration

### Required Variables
```env
# Core
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/jobsphere

# JWT
ACCESS_SECRET=your_access_secret
REFRESH_SECRET=your_refresh_secret

# Stripe (v2.0)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_SERVICE_ACCOUNT=path/to/service-account.json

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Client
CLIENT_URL=http://localhost:3000
```

### Optional Variables
- `REDIS_URL` - Redis for Socket.IO scaling
- `MAX_FILE_SIZE` - File upload limit
- `SOCKET_DEBUG` - Enable Socket.IO debug logging

## 11. Documentation & API Access

### OpenAPI Documentation
- **Swagger UI**: `http://localhost:4000/api-docs`
- **Scalar UI**: `http://localhost:4000/scaler`  
- **JSON Spec**: `http://localhost:4000/api-docs.json`

### Centralized Constants
All API paths and tags defined in `src/common/constants/api-route-tags.ts`:
- Single source of truth for API paths
- Prevents typos and inconsistencies
- Type-safe with TypeScript

## 12. Logging & Monitoring

### Winston Logger
- **Configuration**: `src/lib/logger.ts`
- **Levels**: `error`, `warn`, `info`, `debug`
- **Files**: Daily rotating logs (combined + error)
- **Usage**: 
  ```typescript
  import { logger } from "@/lib/logger";
  logger.info("Operation completed", { userId, action });
  logger.error("Operation failed", { error: error.message });
  ```

### Monitoring Points
- API request/response times
- Database query performance  
- Socket.IO connection metrics
- Payment transaction success/failure rates
- Email delivery status
- FCM notification delivery

## 13. Best Practices & Security

### Security Hardening
- Always validate input with Zod schemas
- Use authentication middleware for protected routes
- Verify resource ownership before modifications
- Hash passwords with bcrypt
- Use environment variables for secrets
- Implement rate limiting for production

### Performance Optimization
- Use pagination for list endpoints (`validatePagination` helper)
- Implement caching where appropriate
- Optimize database queries with indexes
- Use `lean()` for read-only queries
- Connection pooling for database

### Error Handling
- Use try-catch in all service handlers
- Log errors for debugging with context
- Return consistent error format via helpers
- Don't expose sensitive information in errors
- Use MongoDB error handler for database errors

### Code Organization
- Keep service files focused on single actions
- Reuse common logic via shared services (`src/common/service/`)
- Use barrel exports for clean imports
- Follow established patterns for consistency
- Use TypeScript path aliases (`@/*` → `./src/*`)

## 14. Testing & Deployment

### Testing Strategy
- Unit tests for service functions
- Integration tests for API endpoints
- Mock database calls in tests
- Test authentication flows
- Test payment flows with Stripe test mode

### Production Checklist
- Set `NODE_ENV=production`
- Use short-lived access tokens (15-30 min)
- Enable HTTPS only
- Configure CORS for specific origins
- Set up Redis for Socket.IO scaling
- Configure rate limiting
- Set up monitoring and alerting
- Configure log rotation
- Implement backup strategy

### Scaling Considerations
- Horizontal scaling with load balancer
- Redis adapter for Socket.IO multi-server support
- Database read replicas for read-heavy operations
- CDN for static file delivery
- Queue system for background jobs
- Caching layer for frequently accessed data