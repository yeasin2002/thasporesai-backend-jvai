# Engaged Jobs Endpoint

## Overview

The **Engaged Jobs** endpoint returns all jobs where a customer has active engagement through either:
1. **Receiving job applications** from contractors
2. **Sending offers** to contractors

This endpoint is specifically designed for customers who want to manage and send offers, providing them with a filtered view of jobs that have contractor interest or ongoing negotiations.

## Endpoint

**GET** `/api/job/engaged`

## Authentication

- **Required**: Yes
- **Role**: Customer only
- **Header**: `Authorization: Bearer <access_token>`

## Query Parameters

All parameters from the standard job search are supported:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search in job title or description |
| `category` | string | No | Filter by category ID |
| `status` | string | No | Filter by job status (`open`, `assigned`, `in_progress`, `completed`, `cancelled`) |
| `minBudget` | string | No | Minimum budget (numeric string) |
| `maxBudget` | string | No | Maximum budget (numeric string) |
| `location` | string | No | Filter by location ID |
| `page` | string | No | Page number (default: 1) |
| `limit` | string | No | Items per page (default: 10) |

## Response Format

### Success Response (200)

```json
{
  "status": 200,
  "message": "Engaged jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "_id": "job_id",
        "title": "Fix Kitchen Plumbing",
        "description": "Need urgent plumbing repair...",
        "budget": 500,
        "status": "open",
        "category": [
          {
            "_id": "category_id",
            "name": "Plumbing",
            "icon": "plumbing_icon_url"
          }
        ],
        "location": {
          "_id": "location_id",
          "name": "New York",
          "state": "NY"
        },
        "customerId": {
          "_id": "customer_id",
          "full_name": "John Doe",
          "email": "john@example.com",
          "profile_img": "profile_url"
        },
        "contractorId": null,
        "createdAt": "2025-11-16T10:00:00Z",
        "updatedAt": "2025-11-16T10:00:00Z",
        "engagement": {
          "applications": {
            "total": 5,
            "pending": 3,
            "accepted": 0
          },
          "offers": {
            "total": 2,
            "pending": 1,
            "accepted": 1
          },
          "hasApplications": true,
          "hasOffers": true
        }
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Engagement Object

Each job includes an `engagement` object with detailed statistics:

```typescript
engagement: {
  applications: {
    total: number,        // Total number of applications received
    pending: number,      // Applications awaiting review
    accepted: number      // Applications accepted
  },
  offers: {
    total: number,        // Total number of offers sent
    pending: number,      // Offers awaiting contractor response
    accepted: number      // Offers accepted by contractors
  },
  hasApplications: boolean,  // Quick check if job has any applications
  hasOffers: boolean         // Quick check if job has any offers
}
```

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
  "message": "Access denied. Customer role required.",
  "data": null
}
```

#### 500 Internal Server Error
```json
{
  "status": 500,
  "message": "Failed to retrieve engaged jobs",
  "data": null
}
```

## Business Logic

### Job Selection Criteria

A job is considered "engaged" if it meets **ANY** of these conditions:

1. **Has Applications**: At least one contractor has applied to the job
2. **Has Offers**: The customer has sent at least one offer for the job

### Query Process

The endpoint follows this optimized process:

1. **Find Customer Jobs**: Retrieve all job IDs owned by the authenticated customer
2. **Find Engaged Jobs**: Query both `jobApplicationRequest` and `offer` collections to find jobs with engagement
3. **Deduplicate**: Combine and remove duplicate job IDs
4. **Apply Filters**: Apply search, category, status, budget, and location filters
5. **Paginate**: Apply pagination to the filtered results
6. **Enrich Data**: Add engagement statistics to each job
7. **Return Results**: Send enriched jobs with pagination metadata

### Performance Optimizations

- **Parallel Queries**: Applications and offers are queried simultaneously using `Promise.all()`
- **Aggregation Pipeline**: Uses MongoDB aggregation for efficient counting
- **Lean Queries**: Uses `.lean()` for faster read operations
- **Indexed Fields**: Leverages database indexes on `job`, `contractor`, and `status` fields
- **Selective Population**: Only populates necessary fields to reduce data transfer

## Use Cases

### 1. Offer Management Dashboard

Customer wants to see all jobs where they can send offers:

```typescript
GET /api/job/engaged?status=open&page=1&limit=20
```

### 2. Filter by Pending Applications

Customer wants to review jobs with pending applications:

```typescript
// Note: Filtering by engagement stats requires client-side filtering
// or additional query parameters (future enhancement)
GET /api/job/engaged?status=open
```

### 3. Search Engaged Jobs

Customer searches for specific engaged jobs:

```typescript
GET /api/job/engaged?search=plumbing&category=plumbing_category_id
```

### 4. Budget-Based Filtering

Customer filters engaged jobs by budget range:

```typescript
GET /api/job/engaged?minBudget=100&maxBudget=1000
```

## Integration Examples

### Frontend (React/Vue)

```typescript
async function fetchEngagedJobs(filters = {}) {
  const queryParams = new URLSearchParams({
    page: filters.page || '1',
    limit: filters.limit || '10',
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.category && { category: filters.category }),
  });

  const response = await fetch(
    `/api/job/engaged?${queryParams}`,
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
const result = await fetchEngagedJobs({
  page: '1',
  limit: '20',
  status: 'open',
  search: 'plumbing',
});

console.log(`Found ${result.data.total} engaged jobs`);
result.data.jobs.forEach(job => {
  console.log(`${job.title}: ${job.engagement.applications.total} applications, ${job.engagement.offers.total} offers`);
});
```

### Mobile (Flutter)

```dart
Future<Map<String, dynamic>> fetchEngagedJobs({
  int page = 1,
  int limit = 10,
  String? search,
  String? status,
}) async {
  final queryParams = {
    'page': page.toString(),
    'limit': limit.toString(),
    if (search != null) 'search': search,
    if (status != null) 'status': status,
  };

  final uri = Uri.parse('$baseUrl/api/job/engaged')
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
    throw Exception('Failed to load engaged jobs');
  }
}
```

## Differences from Other Job Endpoints

| Endpoint | Purpose | Engagement Filter | Role |
|----------|---------|-------------------|------|
| `GET /api/job` | All public jobs | No | Any |
| `GET /api/job/my/jobs` | Customer's own jobs | No | Customer |
| `GET /api/job/engaged` | Jobs with applications/offers | **Yes** | Customer |

## Future Enhancements

1. **Engagement Filters**: Add query parameters to filter by engagement type
   - `?hasApplications=true`
   - `?hasOffers=true`
   - `?minApplications=5`

2. **Sorting by Engagement**: Sort jobs by engagement metrics
   - `?sortBy=applications`
   - `?sortBy=offers`

3. **Engagement Date Range**: Filter by when engagement occurred
   - `?engagedAfter=2025-01-01`
   - `?engagedBefore=2025-12-31`

4. **Application Status Filter**: Filter by application status distribution
   - `?applicationStatus=pending`

5. **Offer Status Filter**: Filter by offer status
   - `?offerStatus=pending`

## Testing

### Manual Testing

```bash
# Get engaged jobs
curl -X GET "http://localhost:4000/api/job/engaged" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:4000/api/job/engaged?status=open&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With search
curl -X GET "http://localhost:4000/api/job/engaged?search=plumbing" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Scenarios

1. **Customer with no jobs**: Returns empty array
2. **Customer with jobs but no engagement**: Returns empty array
3. **Customer with engaged jobs**: Returns jobs with engagement stats
4. **Invalid token**: Returns 401 Unauthorized
5. **Contractor trying to access**: Returns 403 Forbidden

## Related Documentation

- [Job Module](./JOB_MODULE.md)
- [Job Request Module](../job-request/JOB_REQUEST_MODULE.md)
- [Offer System](../payment/OFFER_SYSTEM.md)
- [Payment & Bidding System](../../.kiro/steering/payment-bidding-system.md)
