# Get Own Jobs with Contractor Filter

## Overview

The **Get Own Jobs** endpoint has been enhanced with an optional `contractorId` query parameter. When provided, it filters out jobs where the specified contractor has already been invited or has applied, returning only jobs available for inviting that contractor.

## Use Case

This feature is designed for customers who want to:
1. **Find jobs to invite a specific contractor to**
2. **Avoid sending duplicate invites** to contractors
3. **See which of their jobs are available** for a particular contractor

## Endpoint

**GET** `/api/job/my/jobs`

## Authentication

- **Required**: Yes
- **Role**: Customer only
- **Header**: `Authorization: Bearer <access_token>`

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contractorId` | string | **No** | **NEW**: Filter by contractor ID - excludes jobs where this contractor has been invited or has applied |
| `search` | string | No | Search in job title or description |
| `category` | string | No | Filter by category ID |
| `status` | string | No | Filter by job status |
| `minBudget` | string | No | Minimum budget |
| `maxBudget` | string | No | Maximum budget |
| `location` | string | No | Filter by location ID |
| `page` | string | No | Page number (default: 1) |
| `limit` | string | No | Items per page (default: 10) |

## Behavior

### Without `contractorId` (Original Behavior)

Returns all jobs owned by the authenticated customer.

```http
GET /api/job/my/jobs
```

**Result**: All customer's jobs (no filtering)

### With `contractorId` (New Behavior)

Returns only jobs where the specified contractor:
- ❌ Has NOT been invited
- ❌ Has NOT applied

```http
GET /api/job/my/jobs?contractorId=contractor_123
```

**Result**: Jobs available for inviting this contractor

## Response Format

### Success Response (200)

```json
{
  "status": 200,
  "message": "Your jobs retrieved successfully",
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
            "icon": "icon_url"
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
          "email": "john@example.com"
        },
        "createdAt": "2025-11-16T10:00:00Z",
        "updatedAt": "2025-11-16T10:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

## Business Logic

### Exclusion Process (When `contractorId` is provided)

1. **Find Invited Jobs**: Query `jobInvite` collection for jobs where customer invited this contractor
2. **Find Applied Jobs**: Query `jobApplicationRequest` collection for jobs where contractor applied
3. **Combine & Deduplicate**: Merge both lists and remove duplicates
4. **Exclude from Results**: Filter out these jobs from the customer's job list

### Example Scenario

**Customer has 5 jobs**:
- Job A: Contractor applied ❌ (excluded)
- Job B: Contractor invited ❌ (excluded)
- Job C: No engagement ✅ (included)
- Job D: No engagement ✅ (included)
- Job E: Different contractor applied ✅ (included)

**Result**: Returns Jobs C, D, and E (3 jobs)

## Use Cases

### 1. Find Jobs to Invite Contractor To

Customer wants to invite a contractor they found:

```http
GET /api/job/my/jobs?contractorId=contractor_123&status=open
```

**Returns**: Only open jobs where contractor hasn't been invited or applied

### 2. Invite Contractor to Specific Job Type

Customer wants to invite contractor to plumbing jobs:

```http
GET /api/job/my/jobs?contractorId=contractor_123&search=plumbing&status=open
```

### 3. Check Available Jobs for Budget Range

Customer wants to see which jobs within budget are available for contractor:

```http
GET /api/job/my/jobs?contractorId=contractor_123&minBudget=100&maxBudget=500
```

## Integration Examples

### Frontend (React/Vue)

```typescript
async function getJobsForContractor(contractorId: string, filters = {}) {
  const queryParams = new URLSearchParams({
    contractorId,
    status: 'open',
    page: filters.page || '1',
    limit: filters.limit || '10',
    ...(filters.search && { search: filters.search }),
  });

  const response = await fetch(
    `/api/job/my/jobs?${queryParams}`,
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
const availableJobs = await getJobsForContractor('contractor_123', {
  search: 'plumbing',
  page: '1',
  limit: '20',
});

console.log(`Found ${availableJobs.data.total} jobs available for this contractor`);
```

### Mobile (Flutter)

```dart
Future<Map<String, dynamic>> getJobsForContractor(
  String contractorId, {
  String? search,
  String? status = 'open',
  int page = 1,
  int limit = 10,
}) async {
  final queryParams = {
    'contractorId': contractorId,
    'status': status,
    'page': page.toString(),
    'limit': limit.toString(),
    if (search != null) 'search': search,
  };

  final uri = Uri.parse('$baseUrl/api/job/my/jobs')
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
    throw Exception('Failed to load jobs');
  }
}
```

## Workflow Example

### Customer Inviting a Contractor

```typescript
// Step 1: Customer finds a contractor they like
const contractor = await searchContractors({ skills: 'plumbing' });

// Step 2: Get jobs available for this contractor
const availableJobs = await fetch(
  `/api/job/my/jobs?contractorId=${contractor.id}&status=open`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

// Step 3: Customer selects a job and sends invite
await fetch(`/api/job-invite/send/${selectedJob.id}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contractorId: contractor.id,
    message: 'I'd like to invite you to this job',
  }),
});

// Step 4: Verify - job should no longer appear in available jobs
const updatedJobs = await fetch(
  `/api/job/my/jobs?contractorId=${contractor.id}&status=open`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
// selectedJob should be excluded now
```

## Comparison with Other Endpoints

| Endpoint | Purpose | Contractor Filter |
|----------|---------|-------------------|
| `GET /api/job/my/jobs` | All customer's jobs | Optional - excludes engaged jobs |
| `GET /api/job/engaged` | Jobs with applications/offers | No filter - shows all engaged |
| `GET /api/job-invite/available/:jobId` | Available contractors for a job | Opposite - filters contractors |

## Performance Considerations

1. **Conditional Queries**: Exclusion queries only run when `contractorId` is provided
2. **Parallel Queries**: Invites and applications queried simultaneously
3. **Distinct Queries**: Uses MongoDB's `distinct()` for efficient ID extraction
4. **Indexed Fields**: Leverages indexes on `job`, `contractor`, and `customer`

## Testing

### Manual Testing

```bash
# Without contractor filter (original behavior)
curl -X GET "http://localhost:4000/api/job/my/jobs" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With contractor filter (new behavior)
curl -X GET "http://localhost:4000/api/job/my/jobs?contractorId=contractor_123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With contractor filter and other filters
curl -X GET "http://localhost:4000/api/job/my/jobs?contractorId=contractor_123&status=open&search=plumbing" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Scenarios

1. **No contractorId**: Returns all customer's jobs
2. **With contractorId, no engagement**: Returns all customer's jobs
3. **With contractorId, contractor invited to some jobs**: Excludes invited jobs
4. **With contractorId, contractor applied to some jobs**: Excludes applied jobs
5. **With contractorId, contractor both invited and applied**: Excludes all engaged jobs

## Error Handling

### Invalid Contractor ID Format

```json
{
  "status": 400,
  "message": "Invalid contractor ID format",
  "data": null
}
```

### Unauthorized

```json
{
  "status": 401,
  "message": "Unauthorized",
  "data": null
}
```

### Forbidden (Non-customer role)

```json
{
  "status": 403,
  "message": "Access denied. Customer role required.",
  "data": null
}
```

## Related Documentation

- [Job Module](./JOB_MODULE.md)
- [Job Invite Module](./invite/JOB_INVITE_MODULE.md)
- [Engaged Jobs](./ENGAGED_JOBS.md)

## Summary

The contractor filter enhancement provides customers with a smart way to find jobs they can invite specific contractors to, automatically excluding jobs where engagement already exists. This improves the user experience by preventing duplicate invites and helping customers efficiently manage their contractor relationships.
