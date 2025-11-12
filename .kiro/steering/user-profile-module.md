# User Profile Module

## Overview

The user profile module is organized as a nested structure under `src/api/users/` with multiple sub-modules for different aspects of user data. This modular approach keeps related functionality organized and maintainable.

## Module Structure

```
src/api/users/
├── profile/           # Main user profile endpoints
│   ├── profile.route.ts
│   ├── services/
│   │   ├── index.ts
│   │   ├── me.service.ts
│   │   ├── update-profile.service.ts
│   │   ├── get-all-users.service.ts
│   │   └── get-single-user.service.ts
│   ├── profile.validation.ts
│   └── profile.openapi.ts
├── certifications/    # User certifications sub-module
│   ├── certifications.route.ts
│   ├── services/
│   │   ├── index.ts
│   │   ├── create-certification.service.ts
│   │   ├── get-certifications.service.ts
│   │   ├── get-single-certification.service.ts
│   │   ├── update-certification.service.ts
│   │   └── delete-certification.service.ts
│   ├── certifications.validation.ts
│   └── certifications.openapi.ts
├── experience/        # User experience sub-module
│   ├── experience.route.ts
│   ├── services/
│   │   ├── index.ts
│   │   ├── create-experience.service.ts
│   │   ├── get-experiences.service.ts
│   │   ├── get-single-experience.service.ts
│   │   ├── update-experience.service.ts
│   │   └── delete-experience.service.ts
│   ├── experience.validation.ts
│   └── experience.openapi.ts
└── work_samples/      # User work samples sub-module
    ├── work_samples.route.ts
    ├── services/
    │   ├── index.ts
    │   ├── create-work-sample.service.ts
    │   ├── get-work-samples.service.ts
    │   ├── get-single-work-sample.service.ts
    │   ├── update-work-sample.service.ts
    │   └── delete-work-sample.service.ts
    ├── work_samples.validation.ts
    └── work_samples.openapi.ts
```

## Route Registration

Routes are registered in `src/app.ts`:

```typescript
import { profile } from "./api/users/profile/profile.route";
import { certifications } from "./api/users/certifications/certifications.route";
import { experience } from "./api/users/experience/experience.route";
import { workSamples } from "./api/users/work_samples/work_samples.route";

// Profile routes (main user endpoints)
app.use("/api/user", profile);

// User sub-modules (nested routes)
app.use("/api/user/certifications", certifications);
app.use("/api/user/experience", experience);
app.use("/api/user/work-samples", workSamples);
```

## API Endpoints

### Profile Module (`/api/user`)

- `GET /api/user/me` - Get current authenticated user
- `PATCH /api/user/me` - Update current user profile
- `GET /api/user` - Get all users with pagination
- `GET /api/user/:id` - Get single user by ID

### Certifications Module (`/api/user/certifications`)

- `POST /api/user/certifications` - Create certification
- `GET /api/user/certifications` - Get user's certifications
- `GET /api/user/certifications/:id` - Get single certification
- `PATCH /api/user/certifications/:id` - Update certification
- `DELETE /api/user/certifications/:id` - Delete certification

### Experience Module (`/api/user/experience`)

- `POST /api/user/experience` - Create experience
- `GET /api/user/experience` - Get user's experiences
- `GET /api/user/experience/:id` - Get single experience
- `PATCH /api/user/experience/:id` - Update experience
- `DELETE /api/user/experience/:id` - Delete experience

### Work Samples Module (`/api/user/work-samples`)

- `POST /api/user/work-samples` - Create work sample
- `GET /api/user/work-samples` - Get user's work samples
- `GET /api/user/work-samples/:id` - Get single work sample
- `PATCH /api/user/work-samples/:id` - Update work sample
- `DELETE /api/user/work-samples/:id` - Delete work sample

## Database Models

### User Model

Located at `src/db/models/user.model.ts`:

```typescript
{
  role: "contractor" | "customer" | "admin",
  full_name: string,
  profile_img: string,
  cover_img: string,
  email: string,
  password: string,
  phone: string,
  address: string,
  bio: string,
  description: string,
  location?: ObjectId[],
  availability?: Date,
  is_verified: boolean,
  isSuspend: boolean,
  category: ObjectId[],
  review: ObjectId[],
  
  // Contractor specific fields
  skills: string[],
  experience: ObjectId[],        // References to Experience model
  work_samples: ObjectId[],      // References to WorkSample model
  certifications: ObjectId[],    // References to Certification model
  job: ObjectId[],
  starting_budget: number,
  hourly_charge: number,
  
  // Auth related
  refreshTokens?: Array<{
    token: string,
    jti: string,
    createdAt: Date
  }>,
  otp?: {
    code: string,
    expiresAt: Date,
    used: boolean
  }
}
```

### Experience Model

Located at `src/db/models/experience.model.ts`:

```typescript
{
  user: ObjectId,              // Reference to User
  company_name: string,
  title: string,
  description: string,
  start_date?: Date,
  end_date?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Work Sample Model

Located at `src/db/models/work-samples.model.ts`:

```typescript
{
  user: ObjectId,              // Reference to User
  name: string,
  img: string,                 // Image URL
  description?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Certification Model

Located at `src/db/models/certification.model.ts`:

```typescript
{
  user: ObjectId,              // Reference to User
  title: string,
  img: string,                 // Certificate image URL
  description?: string,
  issue_date?: Date,
  expiry_date?: Date,
  issuing_organization?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication & Authorization

### Profile Endpoints

- `GET /api/user/me` - Requires authentication (`requireAuth`)
- `PATCH /api/user/me` - Requires authentication (`requireAuth`)
- `GET /api/user` - Public (no authentication required)
- `GET /api/user/:id` - Public (no authentication required)

### Sub-module Endpoints

All sub-module endpoints (certifications, experience, work samples) require authentication:

- Create operations: User must be authenticated
- Read operations: Can view own or others' data
- Update operations: User can only update their own data
- Delete operations: User can only delete their own data

## Common Patterns

### Service Handler Example

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess } from "@/helpers";
import { db } from "@/db";

export const getExperiences: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id; // From auth middleware
    
    const experiences = await db.experience.find({ user: userId });
    
    return sendSuccess(res, 200, "Experiences retrieved successfully", experiences);
  } catch (error) {
    console.log(error);
    return sendInternalError(res, "Internal Server Error");
  }
};
```

### Validation Schema Example

```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const CreateExperienceSchema = z.object({
  company_name: z.string().min(1).openapi({ description: "Company name" }),
  title: z.string().min(1).openapi({ description: "Job title" }),
  description: z.string().min(1).openapi({ description: "Description" }),
  start_date: z.string().optional().openapi({ description: "Start date" }),
  end_date: z.string().optional().openapi({ description: "End date" }),
}).openapi("CreateExperience");

export type CreateExperience = z.infer<typeof CreateExperienceSchema>;
```

## Best Practices

1. **Nested Structure**: Use nested modules for related functionality (profile, certifications, experience, work samples)
2. **Reference Storage**: Store references (ObjectIds) in user document, actual data in separate collections
3. **Authentication**: Always verify user identity before allowing modifications
4. **Ownership**: Users can only modify their own data (except admins)
5. **Validation**: Use Zod schemas for all input validation
6. **Error Handling**: Use consistent error response format
7. **Logging**: Log errors for debugging and monitoring

## Future Enhancements

- Add pagination for listing endpoints
- Add filtering and sorting options
- Add image upload validation (file size, type)
- Add bulk operations (delete multiple items)
- Add search functionality
- Add export functionality (PDF resume generation)
