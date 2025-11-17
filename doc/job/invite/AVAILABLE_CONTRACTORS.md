# Available Contractors Endpoint

## Overview

The **Available Contractors** endpoint helps customers find contractors they can invite to their jobs. It returns only contractors who:
1. **Haven't applied** to the job
2. **Haven't been invited** to the job

This prevents customers from sending duplicate invites or inviting contractors who have already shown interest by applying.

## Important Change

**Previous Behavior**: The system would return an error if a customer tried to invite a contractor who had already applied.

**New Behavior**: The system allows inviting contractors who have applied (removed the restriction), but provides a dedicated endpoint to find contractors who haven't applied or been invited yet.

## Endpoint

**GET** `/api/job-invite/available/:jobId`

## Authentication

- **Required**: Yes
- **Role**: Customer only
- **Header**: `Authorization: Bearer <access_token>`

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string | Yes | ID of the job to find available contractors for |

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search in contractor name, bio, or skills |
| `category` | string | No | Filter by category ID |
| `location` | string | No | Filter by location ID |
| `minBudget` | string | No | Minimum budget (filters contractors within range) |
| `maxBudget` | string | No | Maximum budget (filters contractors within range) |
| `page` | string | No | Page number (default: 1) |
| `limit` | string | No | Items per page (default: 10) |

## Response Format

### Success Response (200)

```json
{
  "status": 200,
  "message": "Available contractors retrieved successfully",
  "data": {
    "contractors": [
      {
        "_id": "contractor_id",
        "full_name": "John Smith",
        "email": "john@example.com",
        "profile_img": "profile_url",
        "bio": "Experienced plumber with 10 years...",
        "skills": ["Plumbing", "Pipe Repair", "Installation"],
        "starting_budget": 100,
        "hourly_charge": 50,
        "category": [
          {
            "_id": "category_id",
            "name": "Plumbing",
            "icon": "icon_url"
          }
        ],
        "location": {
          "_id": "location_id",
          "name": "New York",
          "state": "NY"
        }
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "excludedCount": 5,
    "jobInfo": {
      "id": "job_id",
      "title": "Fix Kitchen Plumbing",
      "budget": 500
    }
  }
}
```

### Response Fields

- **contractors**: Array of available contractors
- **total**: Total number of available contractors (after filters)
- **page**: Current page number
- **limit**: Items per page
- **totalPages**: Total number of pages
- **excludedCount**: Number of contractors excluded (already applied or invited)
- **jobInfo**: Basic information about the job

### Error Responses

#### 401 Unauthorized
```json
{
  "status": 401,
  "message": "Unauthorized access",
  "data": null
}
```

#### 403 Forbidden
```json
{
  "status": 403,
  "message": "You can only view available contractors for your own jobs",
  "data": null
}
```

#### 404 Not Found
```json
{
  "status": 404,
  "message": "Job not found",
  "data": null
}
```

#### 500 Internal Server Error
```json
{
  "status": 500,
  "message": "Failed to retrieve available contractors",
  "data": null
}
```

## Business Logic

### Exclusion Process

1. **Find Applied Contractors**: Query `jobApplicationRequest` collection for contractors who applied
2. **Find Invited Contractors**: Query `jobInvite` collection for contractors who were invited
3. **Combine & Deduplicate**: Merge both lists and remove duplicates
4. **Exclude from Results**: Filter out these contractors from the contractor list

### Filtering Logic

After exclusion, the following filters are applied:

- **Role Filter**: Only contractors (role = "contractor")
- **Status Filter**: Only active contractors (isSuspend = false)
- **Search Filter**: Matches name, bio, or skills
- **Category Filter**: Contractors with matching categories
- **Location Filter**: Contractors in specific location
- **Budget Filter**: Contractors within budget range (based on starting_budget or hourly_charge)

## Use Cases

### 1. Find Contractors to Invite

Customer wants to see all contractors they can invite:

```typescript
GET /api/job-invite/available/job_123?page=1&limit=20
```

### 2. Search for Specific Skills

Customer searches for contractors with specific skills:

```typescript
GET /api/job-invite/available/job_123?search=plumbing
```

### 3. Filter by Category

Customer wants contractors from a specific category:

```typescript
GET /api/job-invite/available/job_123?category=plumbing_category_id
```

### 4. Filter by Budget

Customer wants contractors within their budget:

```typescript
GET /api/job-invite/available/job_123?minBudget=50&maxBudget=150
```

### 5. Combined Filters

Customer applies multiple filters:

```typescript
GET /api/job-invite/available/job_123?search=repair&category=plumbing_category_id&location=ny_location_id&page=1&limit=10
```

## Integration Examples

### Frontend (React/Vue)

```typescript
async function fetchAvailableContractors(jobId: string, filters = {}) {
  const queryParams = new URLSearchParams({
    page: filters.page || '1',
    limit: filters.limit || '10',
    ...(filters.search && { search: filters.search }),
    ...(filters.category && { category: filters.category }),
    ...(filters.location && { location: filters.location }),
  });

  const response = await fetch(
    `/api/job-invite/available/${jobId}?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  return data;
}

// Usage
const result = await fetchAvailableContractors('job_123', {
  page: '1',
  limit: '20',
  search: 'plumbing',
  category: 'plumbing_category_id',
});

console.log(`Found ${result.data.total} available contractors`);
console.log(`Excluded ${result.data.excludedCount} contractors (already applied or invited)`);
```

### Mobile (Flutter)

```dart
Future<Map<String, dynamic>> fetchAvailableContractors(
  String jobId, {
  int page = 1,
  int limit = 10,
  String? search,
  String? category,
}) async {
  final queryParams = {
    'page': page.toString(),
    'limit': limit.toString(),
    if (search != null) 'search': search,
    if (category != null) 'category': category,
  };

  final uri = Uri.parse('$baseUrl/api/job-invite/available/$jobId')
      .replace(queryParameters: queryParams);

  final response = await http.get(
    uri,
    headers: {
      'Authorization': 'Bearer $accessToken',
    },
  );

  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to load available contractors');
  }
}
```

## Workflow Example

### Customer Inviting Contractors

1. **Customer posts a job**
   ```
   POST /api/job
   ```

2. **Contractors apply to the job**
   ```
   POST /api/job-request/apply/:jobId
   ```

3. **Customer wants to invite more contractors**
   ```
   GET /api/job-invite/available/:jobId
   ```
   - Returns contractors who haven't applied or been invited

4. **Customer sends invites**
   ```
   POST /api/job-invite/send/:jobId
   { "contractorId": "contractor_id", "message": "..." }
   ```

5. **Customer checks available contractors again**
   ```
   GET /api/job-invite/available/:jobId
   ```
   - Previously invited contractors are now excluded

## Performance Considerations

1. **Parallel Queries**: Applications and invites are queried simultaneously
2. **Distinct Queries**: Uses MongoDB's `distinct()` for efficient ID extraction
3. **Indexed Fields**: Leverages indexes on `job`, `contractor`, and `status`
4. **Lean Queries**: Uses `.lean()` for faster reads
5. **Selective Population**: Only populates necessary fields

## Testing

### Manual Testing

```bash
# Get available contractors
curl -X GET "http://localhost:4000/api/job-invite/available/job_123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:4000/api/job-invite/available/job_123?search=plumbing&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Scenarios

1. **Job with no applications or invites**: Returns all active contractors
2. **Job with some applications**: Excludes contractors who applied
3. **Job with some invites**: Excludes contractors who were invited
4. **Job with both**: Excludes contractors who applied OR were invited
5. **Invalid job ID**: Returns 404 Not Found
6. **Not job owner**: Returns 403 Forbidden

## Comparison with Other Endpoints

| Endpoint | Purpose | Filters Applied |
|----------|---------|----------------|
| `GET /api/user?role=contractor` | All contractors | None |
| `GET /api/job-invite/available/:jobId` | Available contractors for job | Excludes applied & invited |
| `GET /api/job-request/job/:jobId` | Contractors who applied | Only applied contractors |
| `GET /api/job-invite/sent?jobId=:jobId` | Contractors who were invited | Only invited contractors |

## Related Documentation

- [Job Invite Module](./JOB_INVITE_MODULE.md)
- [Job Request Module](../../job-request/JOB_REQUEST_MODULE.md)
- [User Module](../../users/profile/PROFILE_MODULE.md)

## Summary

The Available Contractors endpoint provides a smart way for customers to find contractors they can invite, automatically excluding those who have already shown interest or been contacted. This improves the user experience by preventing duplicate invites and helping customers discover new contractors for their jobs.
