# Project Structure

## Root Directory Layout

```
providus_org/
├── src/                    # Source code
│   ├── db/                 # Database connection and models
│   ├── routers/            # API route handlers
│   └── index.ts            # Application entry point
├── .kiro/                  # Kiro AI assistant configuration
├── .husky/                 # Git hooks configuration
├── .ruler/                 # Code quality rules
├── node_modules/           # Dependencies
├── dist/                   # Build output (generated)
└── [config files]         # Various configuration files
```

## Source Code Organization

### `/src/index.ts`

- Main application entry point
- Express app configuration
- CORS setup
- Server initialization and database connection

### `/src/db/`

- Database connection logic (`connectDB` function)
- Mongoose models and schemas (to be added)
- Database utilities and helpers

### `/src/routers/`

- API route definitions
- Currently contains placeholder `appRouter` export
- Should contain modular route handlers organized by feature/resource

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
