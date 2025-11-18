# Project Structure & Architecture

## Directory Overview

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
│   ├── connect-mongo.ts    # DB connection
│   └── [other utilities]
├── middleware/             # Express middleware
│   ├── auth.middleware.ts  # JWT auth & RBAC
│   ├── validation.middleware.ts
│   └── common/             # Error handlers
├── helpers/                # Response & error handlers
├── common/                 # Shared resources
│   ├── constants.ts        # API paths & tags
│   ├── email/              # Email templates
│   ├── validations/        # Shared Zod schemas
│   └── service/            # Shared services
└── api/                    # API modules
    ├── auth/               # Authentication
    ├── job/                # Job management
    ├── job-request/        # Applications & offers
    ├── job-invite/         # Job invitations
    ├── offer/              # Offer management
    ├── wallet/             # Wallet & transactions
    ├── chat/               # Real-time chat
    ├── notification/       # Push notifications
    ├── review/             # Reviews & ratings
    ├── category/           # Categories
    ├── location/           # Locations
    ├── users/              # User profiles (nested)
    │   ├── profile/
    │   ├── certifications/
    │   ├── experience/
    │   └── work_samples/
    ├── admin/              # Admin panel (nested)
    │   ├── auth-admin/
    │   └── admin-user/
    └── common/             # File uploads
```

## Module Architecture

### Standard Module Pattern

Each API module follows this structure:

```
[module]/
├── [module].route.ts       # Express routes
├── [module].validation.ts  # Zod schemas + types
├── [module].openapi.ts     # OpenAPI docs
└── services/               # Business logic
    ├── index.ts            # Barrel exports
    └── [action].service.ts # Individual handlers
```

### Nested Module Pattern

For complex features (admin, user profiles):

```
parent/
├── sub-module-1/
│   ├── sub-module-1.route.ts
│   ├── services/
│   ├── sub-module-1.validation.ts
│   └── sub-module-1.openapi.ts
└── sub-module-2/
    └── [same structure]
```

**Export naming**: `parentSubModule` (e.g., `adminUser`, `userProfile`)

## Key Components

### Database Layer (`/src/db/`)
- Mongoose models with TypeScript interfaces
- Centralized exports via `db` object
- Models: User, Job, Offer, Wallet, Transaction, Conversation, Message, Notification, etc.

### Utilities (`/src/lib/`)
- **firebase.ts**: FCM initialization
- **openapi.ts**: OpenAPI registry & document generation
- **jwt.ts**: Token signing/verification, password hashing, OTP generation
- **logger.ts**: Winston with daily rotation
- **connect-mongo.ts**: Database connection

### Middleware (`/src/middleware/`)
- **auth.middleware.ts**: JWT auth, RBAC (`requireAuth`, `requireRole`, `requireOwnership`)
- **validation.middleware.ts**: Zod validation (`validateBody`, `validateParams`, `validateQuery`)
- **common/**: Error handlers (404, 500)

### Helpers (`/src/helpers/`)
- **response-handler.ts**: Standardized API responses
  - Format: `{ status, message, data, success, errors? }`
  - Helpers: `sendSuccess`, `sendError`, `sendCreated`, etc.
- **mongodb-error-handler.ts**: MongoDB error conversion

### Common Resources (`/src/common/`)
- **constants.ts**: Centralized API paths & OpenAPI tags
- **email/**: Email templates (OTP, welcome)
- **validations/**: Shared Zod schemas
- **service/**: Shared business logic (notifications, user queries)

## Design Patterns

### Service Layer Pattern
- Business logic separated into individual service files
- Each service is a typed `RequestHandler`
- Barrel exports for clean imports
- Example: `login.service.ts`, `register.service.ts`

### Repository Pattern
- Database access through Mongoose models
- Models accessed via `db` object: `db.user`, `db.job`, etc.

### Middleware Chain Pattern
- Authentication → Authorization → Validation → Handler
- Example: `requireAuth, requireRole("customer"), validateBody(schema), handler`

### Response Handler Pattern
- Consistent response format across all endpoints
- Centralized error handling
- Type-safe responses

## Configuration

- **TypeScript**: ESNext target, bundler resolution, strict mode
- **Path Aliases**: `@/*` → `./src/*`
- **Build**: tsdown for bundling
- **Linting**: oxlint + biome
- **Git Hooks**: Husky + lint-staged
