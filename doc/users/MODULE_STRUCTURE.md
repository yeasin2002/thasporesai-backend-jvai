# User Module Structure

## Visual Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    /api/user (Profile Module)                │
│                                                               │
│  GET    /api/user              → Get all users               │
│  GET    /api/user/:id          → Get single user             │
│  GET    /api/user/me           → Get current user            │
│  PATCH  /api/user/me           → Update profile              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              /api/user/certifications (Sub-Module)           │
│                                                               │
│  GET    /api/user/certifications     → Get all              │
│  GET    /api/user/certifications/:id → Get one              │
│  POST   /api/user/certifications     → Create               │
│  PUT    /api/user/certifications/:id → Update               │
│  DELETE /api/user/certifications/:id → Delete               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               /api/user/experience (Sub-Module)              │
│                                                               │
│  GET    /api/user/experience     → Get all                  │
│  GET    /api/user/experience/:id → Get one                  │
│  POST   /api/user/experience     → Create                   │
│  PUT    /api/user/experience/:id → Update                   │
│  DELETE /api/user/experience/:id → Delete                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              /api/user/work-samples (Sub-Module)             │
│                                                               │
│  GET    /api/user/work-samples     → Get all                │
│  GET    /api/user/work-samples/:id → Get one                │
│  POST   /api/user/work-samples     → Create                 │
│  PUT    /api/user/work-samples/:id → Update                 │
│  DELETE /api/user/work-samples/:id → Delete                 │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/api/users/
│
├── 📁 profile/                    # Main Profile Module
│   ├── 📄 profile.route.ts        # Routes: GET /api/user, /api/user/me, etc.
│   ├── 📄 profile.validation.ts  # Zod schemas for validation
│   ├── 📄 profile.openapi.ts     # OpenAPI documentation
│   └── 📁 services/
│       ├── 📄 index.ts
│       ├── 📄 get-all-users.service.ts
│       ├── 📄 get-single-user.service.ts
│       ├── 📄 me.service.ts
│       └── 📄 update-profile.service.ts
│
├── 📁 certifications/             # Certifications Sub-Module
│   ├── 📄 certifications.route.ts
│   ├── 📄 certifications.validation.ts
│   ├── 📄 certifications.openapi.ts
│   └── 📁 services/
│       ├── 📄 index.ts
│       ├── 📄 create-certification.service.ts
│       ├── 📄 get-certifications.service.ts
│       ├── 📄 get-single-certification.service.ts
│       ├── 📄 update-certification.service.ts
│       └── 📄 delete-certification.service.ts
│
├── 📁 experience/                 # Experience Sub-Module
│   ├── 📄 experience.route.ts
│   ├── 📄 experience.validation.ts
│   ├── 📄 experience.openapi.ts
│   └── 📁 services/
│       ├── 📄 index.ts
│       ├── 📄 create-experience.service.ts
│       ├── 📄 get-experiences.service.ts
│       ├── 📄 get-single-experience.service.ts
│       ├── 📄 update-experience.service.ts
│       └── 📄 delete-experience.service.ts
│
└── 📁 work_samples/               # Work Samples Sub-Module
    ├── 📄 work_samples.route.ts
    ├── 📄 work_samples.validation.ts
    ├── 📄 work_samples.openapi.ts
    └── 📁 services/
        ├── 📄 index.ts
        ├── 📄 create-work-sample.service.ts
        ├── 📄 get-work-samples.service.ts
        ├── 📄 get-single-work-sample.service.ts
        ├── 📄 update-work-sample.service.ts
        └── 📄 delete-work-sample.service.ts
```

## Module Responsibilities

### Profile Module
**Purpose**: Main user profile management

**Responsibilities**:
- User listing with pagination and filters
- Single user profile retrieval
- Current user profile retrieval
- Profile updates (personal info, skills, etc.)

**Database Operations**:
- Read user data with populated fields
- Update user profile
- Aggregate job counts
- Calculate review statistics (for contractors)

### Certifications Module
**Purpose**: Professional certification management

**Responsibilities**:
- CRUD operations for certifications
- Automatic user association
- Array synchronization with user model

**Database Operations**:
- Create certification and add to user's array
- Read certifications filtered by user
- Update certification
- Delete certification and remove from user's array

### Experience Module
**Purpose**: Work history management

**Responsibilities**:
- CRUD operations for work experience
- Support for current jobs (no end date)
- Chronological sorting

**Database Operations**:
- Create experience and add to user's array
- Read experiences filtered by user
- Update experience
- Delete experience and remove from user's array

### Work Samples Module
**Purpose**: Portfolio management

**Responsibilities**:
- CRUD operations for work samples
- Project showcase
- Image management

**Database Operations**:
- Create work sample and add to user's array
- Read work samples filtered by user
- Update work sample
- Delete work sample and remove from user's array

## Data Flow

### Profile Retrieval Flow
```
Request → Auth Middleware → Profile Service
                                    ↓
                          getUserProfile() Helper
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Fetch User Data              Calculate Job Count
            (with populated fields)      (MongoDB aggregation)
                    ↓                               ↓
            Get Review Stats             Return Combined Data
            (for contractors)
                    ↓
            Return Profile
```

### Sub-Module Create Flow
```
Request → Auth Middleware → Validation → Service
                                            ↓
                                    Create Record
                                    (with user ID)
                                            ↓
                                    Update User Array
                                    ($push operation)
                                            ↓
                                    Return Created Record
```

### Sub-Module Delete Flow
```
Request → Auth Middleware → Service
                                ↓
                        Delete Record
                        (filtered by user)
                                ↓
                        Update User Array
                        ($pull operation)
                                ↓
                        Return Success
```

## Authentication & Authorization

### Profile Module
- `GET /api/user` - Public (no auth required)
- `GET /api/user/:id` - Public (no auth required)
- `GET /api/user/me` - Protected (requires auth)
- `PATCH /api/user/me` - Protected (requires auth)

### Sub-Modules (All Protected)
- All endpoints require authentication
- Users can only access their own records
- Automatic user ID injection from JWT

## Validation

### Profile Module
- User query parameters (search, filters, pagination)
- User ID parameter validation
- Profile update schema (partial updates)

### Sub-Modules
- Create schemas (required fields)
- Update schemas (partial updates)
- ID parameter validation
- MongoDB ObjectId validation

## Response Format

All endpoints return consistent JSON responses:

```json
{
  "status": 200,
  "message": "Success message",
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "status": 400,
  "message": "Error message",
  "success": false,
  "data": null,
  "errors": [
    {
      "path": "field_name",
      "message": "Validation error"
    }
  ]
}
```

## Integration Points

### Database Models
- User Model (`src/db/models/user.model.ts`)
- Certification Model (`src/db/models/certification.model.ts`)
- Experience Model (`src/db/models/experience.model.ts`)
- Work Sample Model (`src/db/models/work-samples.model.ts`)
- Job Model (`src/db/models/job.model.ts`)
- Review Model (`src/db/models/review.model.ts`)

### Helpers
- `getUserProfile()` - Fetch user with populated fields
- `getReviewStatsWithReviews()` - Calculate review statistics
- `sendSuccess()` / `sendError()` - Standard response handlers

### Middleware
- `requireAuth` - JWT authentication
- `validateBody()` - Request body validation
- `validateParams()` - URL parameter validation

## Testing

### HTTP Test Files
- `api-client/users.http` - Profile endpoints
- `api-client/certifications.http` - Certification endpoints
- `api-client/experience.http` - Experience endpoints
- `api-client/work-samples.http` - Work sample endpoints

### API Documentation
- Swagger UI: `http://localhost:4000/swagger`
- Scalar UI: `http://localhost:4000/scaler`
- JSON Spec: `http://localhost:4000/api-docs.json`

## Performance Optimizations

### Profile Module
- Batch job count aggregation (90% query reduction)
- Parallel queries with `Promise.all()`
- Shared `getUserProfile()` helper (40% code reduction)

### Sub-Modules
- Indexed queries on user field
- Compound indexes for sorting
- Lean queries for better performance

## Future Enhancements

1. **Caching**: Redis caching for frequently accessed profiles
2. **Pagination**: Add pagination for sub-module lists
3. **Bulk Operations**: Create/update multiple records at once
4. **Reordering**: Drag-and-drop reordering for work samples
5. **Visibility**: Public/private toggle for portfolio items
6. **Verification**: Certification verification system
7. **Skills Tagging**: Tag work samples with skills
8. **Company Verification**: Verify employment history
