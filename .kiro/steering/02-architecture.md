# Architecture & Project Structure

## Directory Structure

```
src/
├── app.ts                  # Application entry point
├── db/                     # Database layer (Mongoose models)
├── lib/                    # Core utilities (JWT, Firebase, OpenAPI, Logger)
├── middleware/             # Express middleware (Auth, Validation, Errors)
├── helpers/                # Response & error handlers
├── common/                 # Shared resources (constants, email templates, validations)
└── api/                    # API modules
    ├── auth/               # Authentication
    ├── job/                # Job management
    ├── job-request/        # Job applications
    ├── job-invite/         # Job invitations
    ├── offer/              # Offer management
    ├── wallet/             # Wallet & transactions
    ├── chat/               # Real-time chat (REST + Socket.IO)
    ├── notification/       # Push notifications
    ├── review/             # Reviews & ratings
    ├── category/           # Categories
    ├── location/           # Locations
    ├── users/              # User profiles (nested modules)
    │   ├── profile/
    │   ├── certifications/
    │   ├── experience/
    │   └── work_samples/
    ├── admin/              # Admin panel (nested modules)
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
├── [module].validation.ts  # Zod schemas + TypeScript types
├── [module].openapi.ts     # OpenAPI documentation
└── services/               # Business logic
    ├── index.ts            # Barrel exports
    └── [action].service.ts # Individual service handlers
```

### Nested Module Pattern

For complex features (admin, user profiles), use nested structure with combined naming:

```
parent/sub-module/
├── sub-module.route.ts     # Export as 'parentSubModule'
├── services/
├── sub-module.validation.ts
└── sub-module.openapi.ts
```

## Design Patterns

### Service Layer Pattern

- Business logic separated into individual service files
- Each service is a typed `RequestHandler`
- One file per action (create, update, delete, etc.)
- Barrel exports for clean imports

### Repository Pattern

- Database access through Mongoose models
- Models accessed via centralized `db` object
- Example: `db.user`, `db.job`, `db.wallet`

### Middleware Chain Pattern

- Authentication → Authorization → Validation → Handler
- Composable middleware for flexible route protection

### Response Handler Pattern

- Consistent response format: `{ status, message, data, success, errors? }`
- Centralized error handling
- Type-safe responses via helpers

## Key Components

### Database Layer (`/src/db/`)

- Mongoose models with TypeScript interfaces
- Centralized exports via `db` object
- Models: User, Job, Offer, Wallet, Transaction, Conversation, Message, Notification, etc.

### Utilities (`/src/lib/`)

- JWT token management (sign, verify, hash, OTP generation)
- Firebase Cloud Messaging initialization
- OpenAPI registry and document generation
- Winston logger with daily rotation
- MongoDB connection management

### Middleware (`/src/middleware/`)

- Authentication: `requireAuth`, `optionalAuth`
- Authorization: `requireRole`, `requireAnyRole`, `requireOwnership`
- Validation: `validateBody`, `validateParams`, `validateQuery`
- Error handlers: 404, 500

### Helpers (`/src/helpers/`)

- Response handlers: `sendSuccess`, `sendError`, `sendCreated`
- MongoDB error conversion

### Common Resources (`/src/common/`)

- Centralized API paths and OpenAPI tags
- Email templates (OTP, welcome)
- Shared Zod validation schemas
- Shared business logic (notifications, user queries)

## Configuration

- **TypeScript**: ESNext target, bundler resolution, strict mode
- **Path Aliases**: `@/*` maps to `./src/*`
- **ES Modules**: `"type": "module"` in package.json
- **Environment Variables**: Managed via dotenv
- **Git Hooks**: Husky + lint-staged for pre-commit checks
