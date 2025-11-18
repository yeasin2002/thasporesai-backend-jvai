# Contributing to JobSphere Backend

Thank you for your interest in contributing to JobSphere! This document provides guidelines and instructions for setting up your development environment and contributing to the project.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Module Generator](#module-generator)
- [Testing Guidelines](#testing-guidelines)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Code Review Checklist](#code-review-checklist)

## 🚀 Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **Bun**: Latest version (package manager)
- **MongoDB**: v6.0 or higher (local or Atlas)
- **Git**: Latest version
- **Firebase Account**: For push notifications
- **Code Editor**: VS Code recommended

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/your-org/jobsphere-backend.git
cd jobsphere-backend
```

2. **Install dependencies**

```bash
bun install
```

3. **Setup environment variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=4000
NODE_ENV=development
API_BASE_URL=http://localhost:4000

# Database
MONGODB_URI=mongodb://localhost:27017/jobsphere
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobsphere

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your_secure_access_secret_here
JWT_REFRESH_SECRET=your_secure_refresh_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Email Configuration (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@jobsphere.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Firebase (Push Notifications)
# Place firebase-service-account.json in project root
# Download from Firebase Console > Project Settings > Service Accounts

# Future: Stripe (Payment Processing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Commission Rates (percentage)
PLATFORM_FEE_PERCENT=5
SERVICE_FEE_PERCENT=20
```

4. **Setup Firebase**

- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable Cloud Messaging
- Download service account JSON:
  - Go to Project Settings > Service Accounts
  - Click "Generate New Private Key"
  - Save as `firebase-service-account.json` in project root
- Add to `.gitignore` (already included)

5. **Setup MongoDB**

**Option A: Local MongoDB**

```bash
# Install MongoDB
# macOS
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Option B: MongoDB Atlas (Cloud)**

- Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create cluster
- Get connection string
- Update `MONGODB_URI` in `.env`

6. **Start development server**

```bash
bun dev
```

Server will start at `http://localhost:4000`

7. **Verify setup**

- API: http://localhost:4000
- Swagger UI: http://localhost:4000/swagger
- Scalar UI: http://localhost:4000/scaler

## 🏗 Project Architecture

### Module Structure

Each API module follows this standard pattern:

```
src/api/[module]/
├── [module].route.ts       # Express routes
├── [module].validation.ts  # Zod schemas + TypeScript types
├── [module].openapi.ts     # OpenAPI documentation
└── services/               # Business logic
    ├── index.ts            # Barrel exports
    └── [action].service.ts # Individual handlers
```

### Key Principles

1. **Separation of Concerns**: Routes, validation, business logic, and documentation are separate
2. **Service Layer Pattern**: Business logic in individual service files
3. **Type Safety**: TypeScript strict mode, Zod runtime validation
4. **Consistent Responses**: Use helper functions from `@/helpers`
5. **Centralized Constants**: API paths in `@/common/constants.ts`

### Database Access

- Access models via `db` object: `db.user`, `db.job`, etc.
- Use Mongoose for all database operations
- Always handle errors gracefully

### Response Format

All API responses follow this structure:

```typescript
{
  status: number,
  message: string,
  data: any | null,
  success: boolean,
  errors?: Array<{ field: string; message: string }>
}
```

Use helper functions:

- `sendSuccess(res, statusCode, message, data)`
- `sendError(res, statusCode, message, errors?)`
- `sendCreated(res, message, data)`
- `sendBadRequest(res, message, errors?)`
- `sendUnauthorized(res, message)`
- `sendForbidden(res, message)`
- `sendNotFound(res, message)`
- `sendInternalError(res, message)`

## 📝 Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use type inference where possible
- Avoid `any` type (use `unknown` if needed)
- Export types alongside schemas

### Naming Conventions

- **Files**: kebab-case (`user-profile.service.ts`)
- **Variables/Functions**: camelCase (`getUserProfile`)
- **Classes**: PascalCase (`UserService`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Interfaces**: PascalCase with descriptive names (`UserDocument`)

### Code Style

- Use ES modules (`import`/`export`)
- Use arrow functions for handlers
- Use async/await (avoid callbacks)
- Use template literals for strings
- Use destructuring where appropriate
- Keep functions small and focused

### Error Handling

```typescript
export const exampleHandler: RequestHandler = async (req, res) => {
  try {
    // Business logic here
    return sendSuccess(res, 200, "Success message", data);
  } catch (error) {
    console.error("Error in exampleHandler:", error);
    return sendInternalError(res, "Failed to process request");
  }
};
```

### Validation

- Use Zod for all input validation
- Define schemas in `[module].validation.ts`
- Use validation middleware in routes
- Export TypeScript types from schemas

```typescript
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const CreateUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().min(1),
  })
  .openapi("CreateUser");

export type CreateUser = z.infer<typeof CreateUserSchema>;
```

### Authentication & Authorization

- Use `requireAuth` middleware for protected routes
- Use `requireRole(role)` for role-based access
- Use `requireOwnership(param)` for resource ownership
- Always verify user permissions in services

```typescript
router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  validateBody(CreateJobSchema),
  createJob
);
```

## 🔧 Module Generator

Quickly scaffold new API modules with consistent structure.

### Usage

**Interactive Mode:**

```bash
bun run generate:module
```

**Direct Mode:**

```bash
# Top-level module
bun run generate:module --module payment

# Nested module
bun run generate:module --sub admin --module dashboard
```

### Generated Files

The generator creates:

- Route file with CRUD endpoints
- Validation file with Zod schemas
- OpenAPI documentation file
- Services folder with example handler
- Barrel export in services/index.ts

### Post-Generation Steps

1. **Create Database Model** (`src/db/models/[module].model.ts`)
2. **Register Model** in `src/db/index.ts`
3. **Register Route** in `src/app.ts`
4. **Customize Schemas** in validation file
5. **Implement Business Logic** in service files

See `script/README.md` for detailed documentation.

## 🧪 Testing Guidelines

### Manual Testing

Use the provided HTTP client files in `api-client/`:

```bash
# Example: api-client/auth-api.http
POST http://localhost:4000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Test User",
  "role": "customer"
}
```

### Testing Checklist

Before submitting a PR, test:

- ✅ All CRUD operations work
- ✅ Validation errors return proper messages
- ✅ Authentication/authorization works correctly
- ✅ Database operations succeed
- ✅ Error handling works as expected
- ✅ OpenAPI documentation is accurate

### API Documentation Testing

1. Start server: `bun dev`
2. Open Swagger UI: http://localhost:4000/swagger
3. Test endpoints using "Try it out"
4. Verify request/response schemas match

## 🔀 Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks

Examples:

- `feature/wallet-system`
- `fix/authentication-token-refresh`
- `refactor/payment-service`

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:

```
feat(wallet): add deposit functionality

Implemented wallet deposit with transaction tracking
and balance updates.

Closes #123
```

```
fix(auth): resolve token refresh race condition

Fixed issue where concurrent refresh requests could
invalidate valid tokens.
```

### Pre-commit Hooks

Husky runs automatically on commit:

- Linting with oxlint
- Type checking with TypeScript
- Formatting with Biome (on staged files)

If checks fail, fix issues before committing.

## 📤 Pull Request Process

### Before Creating a PR

1. **Update from main**

```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main
```

2. **Run quality checks**

```bash
bun check          # Linting
bun check-types    # Type checking
bun format         # Format code
```

3. **Test your changes**

- Test all affected endpoints
- Verify OpenAPI documentation
- Check for console errors

4. **Update documentation**

- Update README.md if needed
- Update API documentation
- Add comments for complex logic

### Creating a PR

1. **Push your branch**

```bash
git push origin your-branch
```

2. **Create Pull Request on GitHub**

- Use descriptive title
- Fill out PR template
- Link related issues
- Add screenshots if UI changes
- Request reviewers

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made

- List of changes
- Another change

## Testing

- [ ] Tested locally
- [ ] API documentation updated
- [ ] No console errors

## Screenshots (if applicable)

Add screenshots here

## Related Issues

Closes #123
```

### PR Review Process

1. **Automated Checks**: CI/CD runs linting and type checking
2. **Code Review**: At least one approval required
3. **Testing**: Reviewer tests changes locally
4. **Approval**: PR approved and ready to merge
5. **Merge**: Squash and merge to main

## ✅ Code Review Checklist

### For Authors

Before requesting review:

- [ ] Code follows project conventions
- [ ] All tests pass locally
- [ ] No console.log statements (use logger)
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] OpenAPI documentation updated
- [ ] Comments added for complex logic
- [ ] No sensitive data in code
- [ ] Environment variables used for config
- [ ] Database queries optimized

### For Reviewers

When reviewing:

- [ ] Code is readable and maintainable
- [ ] Logic is correct and efficient
- [ ] Error handling is comprehensive
- [ ] Security best practices followed
- [ ] No SQL injection vulnerabilities
- [ ] Authentication/authorization correct
- [ ] Input validation sufficient
- [ ] Response format consistent
- [ ] Database operations efficient
- [ ] No memory leaks
- [ ] Documentation accurate

## 🛠 Development Commands

### Server Commands

```bash
bun dev              # Start development server (tsx)
bun dev:b            # Start with Bun hot reload
bun start            # Start production server
bun build            # Build for production
bun compile          # Create standalone executable
```

### Code Quality Commands

```bash
bun check            # Run oxlint
bun check-types      # TypeScript type checking
bun format           # Format code with Biome
```

### Module Generation

```bash
bun run generate:module                    # Interactive mode
bun run generate:module --module auth      # Direct mode
bun run generate:module --sub admin --module user  # Nested module
```

### Docker Commands

```bash
bun run docker:setup     # Setup Docker environment
bun run docker:start     # Start containers
bun run docker:stop      # Stop containers
bun run docker:restart   # Restart containers
bun run docker:rebuild   # Rebuild and start
bun run docker:logs      # View logs
bun run docker:clean     # Remove containers and volumes
```

## 📚 Additional Resources

### Documentation

- **Project Docs**: `.kiro/steering/` - Architecture and design docs
- **API Docs**: `doc/` - Detailed feature documentation
- **Module Generator**: `script/README.md` - Generator usage guide

### Key Files

- `src/app.ts` - Application entry point
- `src/common/constants.ts` - API paths and tags
- `src/lib/openapi.ts` - OpenAPI configuration
- `src/middleware/auth.middleware.ts` - Authentication
- `src/helpers/response-handler.ts` - Response helpers

### External Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Zod Documentation](https://zod.dev/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [OpenAPI Specification](https://swagger.io/specification/)

## 🐛 Reporting Issues

### Bug Reports

Include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and stack traces
- Screenshots if applicable

### Feature Requests

Include:

- Clear description of the feature
- Use case and benefits
- Proposed implementation (optional)
- Alternative solutions considered

## 💬 Getting Help

- **Documentation**: Check `.kiro/steering/` and `doc/` folders
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask reviewers for clarification

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to JobSphere! 🎉**
