# Project Structure

## Root Directory Layout

```
providus_org/
├── src/                    # Source code
│   ├── db/                 # Database connection and models
│   ├── lib/                # Utility libraries and helpers
│   ├── helper/             # Helper functions
│   ├── middleware/         # Express middleware
│   ├── schema/             # Shared schemas
│   ├── api/                # API route handlers
│   │   ├── auth/           # Authentication module
│   │   │   ├── auth.route.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── auth.openapi.ts
│   │   ├── category/       # Category module
│   │   ├── job/            # Job module
│   │   ├── location/       # Location module
│   │   ├── admin/          # Admin module (nested structure)
│   │   │   ├── user/       # Admin user management sub-module
│   │   │   │   ├── user.route.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.validation.ts
│   │   │   │   └── user.openapi.ts
│   │   │   ├── dashboard/  # Admin dashboard sub-module
│   │   │   ├── job/        # Admin job management sub-module
│   │   │   ├── payments/   # Admin payments sub-module
│   │   │   └── settings/   # Admin settings sub-module
│   │   └── [other modules]/
│   │
│   └── app.ts              # Application entry point
├── api-client/             # API client code (HTTP test files)
│   ├── user-api.http
│   ├── auth-api.http
│   └── [module]-api.http
├── script/                 # Utility scripts
│   └── generate-module.js  # Module generator script
├── .kiro/                  # Kiro AI assistant configuration
│   └── steering/           # Steering documentation
├── .husky/                 # Git hooks configuration
├── .ruler/                 # Code quality rules
├── node_modules/           # Dependencies
├── dist/                   # Build output (generated)
└── [config files]          # Various configuration files
```

## Source Code Organization

### `/src/app.ts`

- Main application entry point
- Express app configuration
- CORS setup
- Server initialization and database connection

### `/src/db/`

- Database connection logic (`connectDB` function)
- Mongoose models and schemas (to be added)
- Database utilities and helpers

### `/src/api/**/*` - Module Structure

Each API module follows this pattern:

#### `[module].route.ts`
- Express router with route definitions
- Imports validation middleware
- Imports service handlers
- Exports router instance with descriptive name
- Example: `export const auth: Router = express.Router();`
- For nested modules: `export const adminUser: Router = express.Router();`

#### `[module].service.ts`
- Business logic as RequestHandler functions
- Database operations
- Error handling
- Response formatting

#### `[module].validation.ts`
- Zod validation schemas with OpenAPI extensions
- TypeScript type exports
- Schemas for: create, update, params, responses

#### `[module].openapi.ts`
- Registers schemas with OpenAPI registry
- Registers route paths with full documentation
- Must be imported at the top of the corresponding `.route.ts` file
- Example: `import "./user.openapi";`

**Important**: OpenAPI files are imported in route files, which are then imported in `app.ts` BEFORE calling `generateOpenAPIDocument()` to ensure all routes are registered.

### Nested Module Pattern

For complex features like admin panel, use nested modules:

```
src/api/admin/
├── user/           # Sub-module for user management
│   ├── user.route.ts
│   ├── user.service.ts
│   ├── user.validation.ts
│   └── user.openapi.ts
├── dashboard/      # Sub-module for dashboard
└── settings/       # Sub-module for settings
```

**Registration in app.ts:**
```typescript
import { adminUser } from "@/api/admin/user/user.route";
app.use("/api/admin/users", adminUser);
```

**Export naming convention for nested modules:**
- Use descriptive names that indicate the parent module
- Example: `adminUser`, `adminDashboard`, `adminSettings`
- This prevents naming conflicts with top-level modules

## Configuration Files

### Core Config

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration with path aliases
- `tsdown.config.ts` - Build tool configuration

### Code Quality

- `.oxlintrc.json` - Linting rules (comprehensive oxlint setup)
- `.husky/pre-commit` - Git pre-commit hooks
- `lint-staged` configuration in package.json

### Environment

- `.env` - Environment variables (not tracked)
- `.env.example` - Environment template

## Architectural Patterns

### Module Organization

- Separate concerns: database, routing, main app
- Use path aliases (`@/`) for clean imports
- Export typed router interfaces for type safety

### File Naming

- Use kebab-case for directories when needed
- Use camelCase for TypeScript files
- Index files for clean module exports

### Import/Export Style

- ES modules throughout
- Named exports preferred
- Barrel exports from index files
