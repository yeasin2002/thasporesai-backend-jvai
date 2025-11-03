# Customer Applications Endpoint

## Overview

Added a new endpoint for customers to view all applications received for their jobs with pagination and filtering capabilities.

## Endpoint Details

### GET `/api/job-request/customer/all`

**Description**: Get all applications received for customer's jobs

**Authentication**: Required (Bearer Token)

**Authorization**: Customer role only

**Query Parameters**:

| Parameter | Type   | Required | Description                                    |
| --------- | ------ | -------- | ---------------------------------------------- |
| jobId     | string | No       | Filter applications by specific job ID         |
| status    | enum   | No       | Filter by status: pending, accepted, rejected  |
| page      | string | No       | Page number (default: 1)                       |
| limit     | string | No       | Items per page (default: 10)                   |

## Response Structure

### Success Response (200)

```json
{
  "status": 200,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [
      {
        "_id": "app123",
        "job": {
          "_id": "job123",
          "title": "Fix Plumbing Issue",
          "description": "Need urgent plumbing repair",
          "budget": 150,
          "status": "open",
          "coverImg": "url",
          "location": {
            "_id": "loc123",
            "name": "New York",
            "state": "NY",
            "coordinates": [40.7128, -74.0060]
          },
          "category": [
            {
              "_id": "cat123",
              "name": "Plumbing",
              "icon": "url",
              "description": "Plumbing services"
            }
          ]
        },
        "contractor": {
          "_id": "user456",
          "full_name": "John Contractor",
          "profile_img": "url",
          "email": "john@example.com",
          "phone": "+1234567890",
          "bio": "Professional plumber",
          "skills": ["plumbing", "repair"],
          "starting_budget": 50,
          "hourly_charge": 75,
          "category": [...],
          "location": [...]
        },
        "status": "pending",
        "message": "I can help with this job",
        "createdAt": "2025-11-03T10:00:00Z",
        "updatedAt": "2025-11-03T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Error Responses

**401 Unauthorized**

```json
{
  "status": 401,
  "message": "Unauthorized",
  "data": null
}
```

**500 Internal Server Error**

```json
{
  "status": 500,
  "message": "Failed to retrieve applications",
  "data": null
}
```

## Usage Examples

### Get All Applications

```bash
GET /api/job-request/customer/all
Authorization: Bearer <token>
```

### Filter by Specific Job

```bash
GET /api/job-request/customer/all?jobId=job123
Authorization: Bearer <token>
```

### Filter by Status

```bash
GET /api/job-request/customer/all?status=pending
Authorization: Bearer <token>
```

### Filter by Job and Status with Pagination

```bash
GET /api/job-request/customer/all?jobId=job123&status=pending&page=1&limit=20
Authorization: Bearer <token>
```

### Get Only Accepted Applications

```bash
GET /api/job-request/customer/all?status=accepted&page=1&limit=10
Authorization: Bearer <token>
```

## Implementation Details

### Service Logic

1. **Authentication Check**: Verifies user is authenticated
2. **Job Ownership**: Finds all jobs owned by the customer
3. **Filter Applications**: Filters applications based on query parameters
4. **Populate Data**: Populates job and contractor details with nested fields
5. **Pagination**: Implements skip/limit pagination
6. **Response**: Returns applications with pagination metadata

### Database Queries

The service performs optimized queries:

1. Find all jobs owned by customer (with optional jobId filter)
2. Count total applications matching filters
3. Fetch paginated applications with populated fields

### Populated Fields

**Job Fields**:
- title, description, budget, status, coverImg
- location (name, state, coordinates)
- category (name, icon, description)

**Contractor Fields**:
- full_name, profile_img, email, phone, bio
- skills, starting_budget, hourly_charge
- category (name, icon, description)
- location (name, state, coordinates)

## Differences from Other Endpoints

### vs `/api/job-request/my` (Contractor)

- **Purpose**: Contractor's own applications vs Customer's received applications
- **Filter**: Contractor filters by job criteria vs Customer filters by job ID
- **User**: Contractor role vs Customer role

### vs `/api/job-request/job/:jobId` (Customer)

- **Scope**: All jobs vs Single job
- **Filter**: Optional jobId filter vs Required jobId param
- **Use Case**: Overview of all applications vs Detailed view for one job

## Use Cases

1. **Dashboard Overview**: Customer sees all pending applications across all jobs
2. **Job-Specific View**: Customer filters to see applications for a specific job
3. **Status Management**: Customer views only pending or accepted applications
4. **Application History**: Customer reviews all past applications

## Performance Considerations

1. **Indexing**: Ensure indexes on `job` and `status` fields in JobApplicationRequest model
2. **Pagination**: Default limit of 10 prevents large data transfers
3. **Lean Queries**: Uses `.lean()` for better performance
4. **Selective Population**: Only populates necessary fields

## Security

- **Authentication**: JWT token required
- **Authorization**: Only customers can access this endpoint
- **Data Isolation**: Users only see applications for their own jobs
- **Input Validation**: All query parameters validated with Zod schemas

## Related Files

- `src/api/job-request/job-request.route.ts` - Route definition
- `src/api/job-request/services/get-customer-applications.service.ts` - Service logic
- `src/api/job-request/job-request.validation.ts` - Validation schemas
- `src/api/job-request/job-request.openapi.ts` - OpenAPI documentation
- `src/db/models/job-application-request.model.ts` - Database model
- `src/db/models/job.model.ts` - Job model
- `src/db/models/user.model.ts` - User model

## Future Enhancements

1. **Search**: Add search by contractor name
2. **Date Range**: Filter by application date range
3. **Sorting**: Add sorting options (newest, oldest, by contractor rating)
4. **Bulk Actions**: Accept/reject multiple applications at once
5. **Export**: Export applications to CSV/PDF
6. **Notifications**: Real-time notifications for new applications
