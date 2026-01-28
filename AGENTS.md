# JobSphere Backend Agent Guide

> [!NOTE]
> This document guides AI agents on the project structure, conventions, and workflows for the JobSphere Backend.

## 1. Project Overview
JobSphere is a mobile marketplace backend API connecting customers with local freelance contractors.
- **Roles**: Customer, Contractor, Admin.
- **Core Features**: Job Marketplace, Wallet-based Payments (Stripe), Real-time Chat (Socket.IO), User Profiles.

## 2. Technology Stack
- **Runtime**: Node.js + TypeScript (ESNext)
- **Framework**: Express.js v5
- **Database**: MongoDB + Mongoose v8
- **Real-Time**: Socket.IO v4
- **Validation**: Zod (with OpenAPI registry)
- **Package Manager**: pnpm

## 3. Directory Structure
```
src/
├── app.ts                  # Entry point
├── db/                     # Mongoose models & connection
├── lib/                    # Utilities (JWT, Firebase, Logger)
├── middleware/             # Auth, Validation, Error middlewares
├── helpers/                # Response & error handlers
├── common/                 # Shared constants, email templates
└── api/                    # API Modules
    ├── [module]/
    │   ├── [module].route.ts       # Routes
    │   ├── [module].validation.ts  # Zod schemas
    │   ├── [module].openapi.ts     # OpenAPI registration
    │   └── services/               # Business logic
            ├── index.ts            # Barrel export
            └── [action].service.ts # Single action handler
```

## 4. Development Commands
- `bun dev`: Start dev server with hot reload
- `bun build`: Build for production
- `bun run generate:module`: Scaffold a new API module
- `bun check`: Run linter
- `bun check-types`: Run TypeScript check

## 5. Coding Conventions

### A. API Modules
- **Pattern**: `route` -> `validation` (middleware) -> `service` (handler).
- **Naming**: 
  - Routes: `plural-nouns.route.ts` (e.g., `job-requests.route.ts`)
  - Services: `action-name.service.ts` (e.g., `create-offer.service.ts`)
- **Scaffolding**: Always use `bun run generate:module` when creating new modules.

### B. Service Layer
- **Isolation**: One file per action.
- **Signature**: `export const actionName: RequestHandler = async (req, res) => { ... }`
- **Response**: Use helpers from `@/helpers/response`.
  ```typescript
  return sendSuccess(res, 200, "Success message", data);
  ```
- **Error Handling**: Use `try-catch` and `sendError` or middleware error propagation.

### C. Database
- **Access**: Import `db` from `@/db`.
  ```typescript
  import { db } from "@/db";
  // Usage: await db.user.findById(...)
  ```
- **Transactions**: Use MongoDB transactions for all money/wallet operations.

### D. Validation (Zod + OpenAPI)
- Define schemas in `[module].validation.ts`.
- Register with `registry.register()` for OpenAPI generation.
- Use middleware `validateBody`, `validateQuery`, `validateParams`.

## 6. Payment System (v2.0)
- **Status**: ✅ Stripe Integration Complete.
- **Flow**:
  - **Deposits**: Stripe Checkout (returns URL).
  - **Payouts**: Stripe Connect (Admin approved).
  - **Wallet**: Database tracking (Single balance, no escrow field).
- **Docs**: Refer to `doc/payment/2.BACKEND_IMPLEMENTATION.md` for strict implementation details.

## 7. Environment Variables
Ensure `.env` contains:
- `MONGODB_URI`, `PORT`
- `ACCESS_SECRET`, `REFRESH_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT` (path)

## 8. Logging
- Use `logger` from `@/lib/logger`.
- Levels: `info`, `warn`, `error`, `debug`.
