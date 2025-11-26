# API Development Patterns

## Module Generation

### Automated Scaffolding

Use the module generator to create consistent API modules:

- **Interactive Mode**: `bun run generate:module`
- **Direct Mode**: `bun run generate:module --module auth`
- **Nested Module**: `bun run generate:module --sub admin --module user`

### Generated Structure

- Route file with Express router
- Services folder with individual action handlers
- Validation file with Zod schemas and TypeScript types
- OpenAPI documentation file

### Post-Generation Steps

1. Create Mongoose model in `src/db/models/`
2. Register model in `src/db/index.ts`
3. Register route in `src/app.ts`
4. Customize validation schemas
5. Implement business logic in service files

## OpenAPI Documentation

### Pattern

Each module has a `.openapi.ts` file that registers schemas and routes with the global OpenAPI registry using `@asteasolutions/zod-to-openapi`.

### Centralized Constants

All API paths and tags are defined in `src/common/constants.ts`:

- Single source of truth for all API paths
- Prevents typos and inconsistencies
- Easy to refactor and maintain
- Type-safe with TypeScript

### Documentation Access

- **Swagger UI**: `http://localhost:4000/api-docs`
- **Scalar UI**: `http://localhost:4000/scaler`
- **JSON Spec**: `http://localhost:4000/api-docs.json`

### Best Practices

- Use `.openapi()` method to name schemas
- Import `.openapi.ts` files in route files
- Group routes by tags for better organization
- Include all possible response codes (200, 400, 401, 404, 500)
- Reuse common schemas like ErrorResponse

## Validation Pattern

### Zod Schemas

- Extend Zod with OpenAPI at the top of validation files
- Define base schema with all fields
- Derive create schema (omit auto-generated fields)
- Derive update schema (all fields optional)
- Define parameter schemas for route params
- Define response schemas for API responses

### Schema Usage

- Use in validation middleware: `validateBody(schema)`
- Export TypeScript types: `type CreateUser = z.infer<typeof CreateUserSchema>`
- Register with OpenAPI for automatic documentation

## Service Layer Pattern

### Organization

- Business logic in `services/` folder
- One file per action (create, update, delete, etc.)
- Barrel exports in `services/index.ts`
- Typed as `RequestHandler` from Express

### Service Structure

- Try-catch error handling
- Database operations using `db.[model]`
- Consistent response format using helpers
- Logging for debugging and monitoring

### Response Format

All API responses follow this structure:

```
{
  status: number,
  message: string,
  data: any | null,
  success: boolean,
  errors?: any
}
```

### Response Helpers

- `sendSuccess(res, status, message, data)` - Success responses
- `sendError(res, status, message, errors?)` - Error responses
- `sendCreated(res, message, data)` - 201 Created
- `sendInternalError(res, message)` - 500 Internal Server Error

## Middleware Patterns

### Authentication Chain

- `requireAuth` - Verify JWT token, attach user to request
- `requireRole(role)` - Check user role (must follow requireAuth)
- `requireAnyRole([roles])` - Check multiple roles
- `requireOwnership(param)` - Verify resource ownership
- `optionalAuth` - Optional authentication for public endpoints

### Validation Chain

- `validateBody(schema)` - Validate request body
- `validateParams(schema)` - Validate route parameters
- `validateQuery(schema)` - Validate query parameters

### Route Protection Examples

- Public: No middleware
- Authenticated: `requireAuth`
- Role-specific: `requireAuth, requireRole("customer")`
- Owner-only: `requireAuth, requireOwnership("id")`
- Multiple roles: `requireAuth, requireAnyRole(["customer", "contractor"])`

## Database Patterns

### Model Access

- All models exported via `db` object
- Import: `import { db } from "@/db"`
- Usage: `db.user.find()`, `db.job.create()`, etc.

### Common Operations

- Create: `db.model.create(data)`
- Find: `db.model.find(query)`, `db.model.findById(id)`
- Update: `db.model.findByIdAndUpdate(id, data, { new: true })`
- Delete: `db.model.findByIdAndDelete(id)`
- Populate: `.populate("field")`

### Error Handling

- Use MongoDB error handler for consistent error messages
- Handle duplicate key errors, validation errors, cast errors
- Return user-friendly error messages

## Naming Conventions

### Module Naming

- Top-level modules: Use module name (e.g., `job`, `auth`)
- Nested modules: Use `parentModule` + `ModuleName` in camelCase (e.g., `adminUser`, `userProfile`)
- File names: kebab-case (e.g., `job-request.route.ts`)
- Export names: camelCase (e.g., `jobRequest`)

### Route Paths

- Use plural nouns: `/api/jobs`, `/api/users`
- Nested resources: `/api/user/certifications`
- Actions: `/api/job/:id/complete`, `/api/offer/:id/accept`

### Variable Naming

- camelCase for variables and functions
- PascalCase for types and schemas
- UPPER_CASE for constants

## Best Practices

### Security

- Always validate input with Zod schemas
- Use authentication middleware for protected routes
- Verify resource ownership before modifications
- Hash passwords with bcrypt
- Use environment variables for secrets

### Performance

- Use pagination for list endpoints
- Implement caching where appropriate
- Optimize database queries with indexes
- Use lean() for read-only queries

### Error Handling

- Use try-catch in all service handlers
- Log errors for debugging
- Return consistent error format
- Don't expose sensitive information in errors

### Code Organization

- Keep service files focused on single actions
- Reuse common logic via shared services
- Use barrel exports for clean imports
- Follow established patterns for consistency
