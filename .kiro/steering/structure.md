# Project Structure

## Root Directory Layout

```
providus_org/
├── src/                    # Source code
│   ├── db/                 # Database connection and models
│   ├── lib/                # Database connection and models
│   ├── helper/             # Database connection and models
│   ├── middleware/         # Database connection and models
│   ├── schema/             # Database connection and models/
│   ├── API/                # API route handlers
│       ├── user/                # User API route handlers
│           ├── user.controller.ts/      # Express  User API route controller. define all user related routes here. 
│           ├── user.service.ts/         # User API route service. define all user related business logic here in functional way. 
│           ├── user.schema.ts/         # User API route documentation. define all user related zod validation schema  and OpenAPI doc with @asteasolutions/zod-to-openapi
│       ├── auth/                # Auth API route handlers
│           ├── auth.controller.ts/      # Express Auth API route controller. define all auth related routes here. 
│           ├── auth.service.ts/         # Auth API route service. define all auth related business logic here in functional way. 
│           ├── auth.schema.ts/         # Auth API route documentation. define all auth related zod validation schema  and OpenAPI doc with @asteasolutions/zod-to-openapi
│   └── app.ts            # Application entry point
├── .kiro/                  # Kiro AI assistant configuration
├── .husky/                 # Git hooks configuration
├── .ruler/                 # Code quality rules
├── node_modules/           # Dependencies
├── dist/                   # Build output (generated)
└── [config files]         # Various configuration files
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

### `/src/api/**/*`

- API route controllers just define routes here
- API route services in functional way
- API route documentation with zod validation schema and OpenAPI doc with @asteasolutions/zod-to-openapi

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
