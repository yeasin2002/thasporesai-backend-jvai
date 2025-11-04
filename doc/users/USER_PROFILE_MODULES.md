# User Profile Sub-Modules

## Overview

This document describes the three user profile sub-modules that allow contractors to manage their professional information: **Certifications**, **Experience**, and **Work Samples**.

## Modules

### 1. Certifications Module

**Purpose**: Manage professional certifications and licenses

**Base Path**: `/api/user/certifications`

**Database Model**: `src/db/models/certification.model.ts`

**Fields**:

- `title` (required): Certification name
- `img` (required): Certification image/badge URL
- `description` (optional): Additional details
- `issue_date` (optional): When issued
- `expiry_date` (optional): When it expires
- `issuing_organization` (optional): Who issued it

**Endpoints**:

- `GET /api/user/certifications` - Get all certifications
- `GET /api/user/certifications/:id` - Get single certification
- `POST /api/user/certifications` - Create certification
- `PUT /api/user/certifications/:id` - Update certification
- `DELETE /api/user/certifications/:id` - Delete certification

### 2. Experience Module

**Purpose**: Manage work history and employment records

**Base Path**: `/api/user/experience`

**Database Model**: `src/db/models/experience.model.ts`

**Fields**:

- `company_name` (required): Employer name
- `title` (required): Job title/position
- `description` (required): Job responsibilities
- `start_date` (required): Employment start date
- `end_date` (optional): Employment end date (null for current job)

**Endpoints**:

- `GET /api/user/experience` - Get all experiences
- `GET /api/user/experience/:id` - Get single experience
- `POST /api/user/experience` - Create experience
- `PUT /api/user/experience/:id` - Update experience
- `DELETE /api/user/experience/:id` - Delete experience

### 3. Work Samples Module

**Purpose**: Showcase portfolio items and completed projects

**Base Path**: `/api/user/work-samples`

**Database Model**: `src/db/models/work-samples.model.ts`

**Fields**:

- `name` (required): Project/sample name
- `img` (required): Project image URL
- `description` (optional): Project details

**Endpoints**:

- `GET /api/user/work-samples` - Get all work samples
- `GET /api/user/work-samples/:id` - Get single work sample
- `POST /api/user/work-samples` - Create work sample
- `PUT /api/user/work-samples/:id` - Update work sample
- `DELETE /api/user/work-samples/:id` - Delete work sample

## Authentication

All endpoints require authentication via JWT Bearer token:

```
Authorization: Bearer <access_token>
```

## User Association

All records are automatically associated with the authenticated user:

- The `user` field is set from `req.user.userId`
- Users can only access their own records
- Records are automatically added to user's arrays (certifications, experience, work_samples)

## Data Flow

### Create Flow

1. User sends POST request with data
2. Service creates record with `user: userId`
3. Record ID is added to user's array (`$push`)
4. Record is returned in response

### Update Flow

1. User sends PUT request with partial data
2. Service finds record by `_id` and `user: userId`
3. Record is updated with `$set`
4. Updated record is returned

### Delete Flow

1. User sends DELETE request
2. Service deletes record by `_id` and `user: userId`
3. Record ID is removed from user's array (`$pull`)
4. Success message is returned

## Response Format

All responses follow the standard format:

```json
{
  "status": 200,
  "message": "Success message",
  "data": { ... },
  "success": true
}
```

## Validation

All inputs are validated using Zod schemas:

- Required fields are enforced
- Data types are validated
- URL formats are checked
- Date formats are validated

## File Structure

Each module follows the same structure:

```
src/api/users/{module}/
├── {module}.route.ts           # Express routes
├── {module}.validation.ts      # Zod schemas
├── {module}.openapi.ts         # OpenAPI documentation
└── services/
    ├── index.ts                # Barrel exports
    ├── create-{module}.service.ts
    ├── get-{module}s.service.ts
    ├── get-single-{module}.service.ts
    ├── update-{module}.service.ts
    └── delete-{module}.service.ts
```

## Testing

HTTP test files are available in `api-client/`:

- `api-client/certifications.http`
- `api-client/experience.http`
- `api-client/work-samples.http`

## Integration with User Profile

When fetching user profiles (`GET /api/user/me` or `GET /api/user/:id`), these fields are automatically populated:

- `certifications[]` - Array of certification objects
- `experience[]` - Array of experience objects
- `work_samples[]` - Array of work sample objects

## Database Indexes

All models have indexes for optimal query performance:

- `user` field is indexed
- Compound index on `user` and `createdAt` for sorted queries

## Error Handling

Common error responses:

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Record doesn't exist or doesn't belong to user
- `400 Bad Request` - Validation errors
- `500 Internal Server Error` - Server errors

## Best Practices

1. **Image URLs**: Store images in cloud storage (AWS S3) and save URLs
2. **Dates**: Use ISO 8601 format for all dates
3. **Current Jobs**: Leave `end_date` null for ongoing employment
4. **Certifications**: Include expiry dates for time-sensitive certifications
5. **Work Samples**: Use high-quality images and descriptive names

## Future Enhancements

Potential improvements:

- Image upload integration
- Bulk operations (create/update multiple records)
- Reordering capabilities
- Visibility controls (public/private)
- Verification status for certifications
- Skills tagging for work samples
- Company verification for experience

## Related Documentation

- [User Profile Optimization](./USER_PROFILE_OPTIMIZATION.md)
- [OpenAPI Pattern](./.kiro/steering/openapi-pattern.md)
- [Project Structure](./.kiro/steering/structure.md)
