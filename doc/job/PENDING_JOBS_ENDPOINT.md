# Pending Jobs Endpoint - Jobs with Pending Offers

**Endpoint**: `GET /api/job/pending-jobs`  
**Purpose**: Get all jobs where customer sent offers and waiting for contractor response  
**Date**: November 25, 2025

---

## Overview

This endpoint returns all jobs where the customer has sent offers that are currently pending (waiting for contractor to accept or reject). It's designed for the "Pending Offers" or "Waiting for Response" section in the UI.

---

## Key Differences from Other Endpoints

| Endpoint                    | Purpose                  | Shows                                                     |
| --------------------------- | ------------------------ | --------------------------------------------------------- |
| `GET /api/job`              | Browse all jobs          | All public jobs                                           |
| `GET /api/job/my/jobs`      | My posted jobs           | All jobs posted by customer                               |
| `GET /api/job/engaged`      | Jobs needing action      | Jobs with applications OR pending offers (for management) |
| `GET /api/job/pending-jobs` | **Waiting for response** | **Only jobs with pending offers**                         |

---

## Use Case

**Customer wants to see**:

- Which jobs have pending offers
- Which contractors received offers
- When offers were sent
- When offers will expire
- Ability to cancel offers if needed

---

## Request

### Endpoint

```
GET /api/job/pending-jobs
```

### Authentication

**Required**: Yes (Customer only)

```
Authorization: Bearer <access_token>
```

### Query Parameters

All parameters are optional:

| Parameter   | Type   | Description                  | Example                 |
| ----------- | ------ | ---------------------------- | ----------------------- |
| `page`      | number | Page number (default: 1)     | `?page=2`               |
| `limit`     | number | Items per page (default: 10) | `?limit=20`             |
| `search`    | string | Search in title/description  | `?search=plumbing`      |
| `category`  | string | Filter by category ID        | `?category=6902f55a...` |
| `status`    | string | Filter by job status         | `?status=open`          |
| `minBudget` | number | Minimum budget               | `?minBudget=50`         |
| `maxBudget` | number | Maximum budget               | `?maxBudget=500`        |
| `location`  | string | Filter by location ID        | `?location=6902f487...` |

---

## Response

### Success Response (200)

```json
{
  "status": 200,
  "message": "Pending offer jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "_id": "692432d485af0c21b1699a81",
        "title": "Fix Plumbing Issue",
        "description": "Need urgent plumbing repair",
        "budget": 100,
        "status": "open",
        "location": {
          "_id": "6902f4877ef4e621b01bf9ed",
          "name": "Albuquerque",
          "state": "NM"
        },
        "category": [
          {
            "_id": "6902f55a7ef4e621b01bfa1a",
            "name": "Plumbing",
            "icon": "/uploads/plumbing-icon.png"
          }
        ],
        "customerId": {
          "_id": "6902e26b1f8e19ca5a961782",
          "full_name": "Test Customer",
          "email": "customer@g.com",
          "profile_img": "customer.png"
        },

        // ✅ Offer details (including offerId for cancellation)
        "offer": {
          "offerId": "673abc123def456...",
          "amount": 100,
          "timeline": "2 weeks",
          "description": "I can fix this quickly",
          "status": "pending",
          "createdAt": "2025-11-25T10:00:00.000Z",
          "expiresAt": "2025-12-02T10:00:00.000Z",
          "canCancel": true
        },

        // ✅ Contractor who received the offer
        "contractor": {
          "_id": "6902e2a31f8e19ca5a961788",
          "full_name": "John Contractor",
          "email": "contractor@g.com",
          "profile_img": "contractor.png",
          "phone": "1234567890",
          "skills": ["Plumbing", "Repair"]
        },

        "createdAt": "2025-11-24T10:26:28.923Z",
        "updatedAt": "2025-11-24T10:26:28.923Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "success": true
}
```

### Empty Response (200)

```json
{
  "status": 200,
  "message": "No pending offers found",
  "data": {
    "jobs": [],
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  },
  "success": true
}
```

### Error Responses

**401 - Unauthorized**:

```json
{
  "status": 401,
  "message": "Unauthorized access",
  "data": null,
  "success": false
}
```

**403 - Forbidden** (Not a customer):

```json
{
  "status": 403,
  "message": "Access denied. Customer role required.",
  "data": null,
  "success": false
}
```

---

## Response Fields Explained

### Job Fields

Standard job fields (title, description, budget, status, location, category, etc.)

### Offer Object

| Field         | Type    | Description                                                            |
| ------------- | ------- | ---------------------------------------------------------------------- |
| `offerId`     | string  | **Use this to cancel the offer** via `POST /api/offer/:offerId/cancel` |
| `amount`      | number  | Offer amount (same as job budget)                                      |
| `timeline`    | string  | Expected completion time                                               |
| `description` | string  | Offer message to contractor                                            |
| `status`      | string  | Always "pending" for this endpoint                                     |
| `createdAt`   | Date    | When offer was sent                                                    |
| `expiresAt`   | Date    | When offer expires (7 days from creation)                              |
| `canCancel`   | boolean | Always true - customer can cancel pending offers                       |

### Contractor Object

| Field         | Type     | Description            |
| ------------- | -------- | ---------------------- |
| `_id`         | string   | Contractor user ID     |
| `full_name`   | string   | Contractor's full name |
| `email`       | string   | Contractor's email     |
| `profile_img` | string   | Profile image URL      |
| `phone`       | string   | Contact phone number   |
| `skills`      | string[] | Contractor's skills    |

---

## Business Logic

### What Jobs Are Included?

✅ **Included**:

- Jobs where customer sent offers
- Offer status is "pending"
- Job status is "open" (not in_progress, completed, or cancelled)
- Jobs belong to the authenticated customer

❌ **Excluded**:

- Jobs without offers
- Jobs with accepted offers (already assigned)
- Jobs with rejected/expired offers (no longer pending)
- Jobs in "in_progress", "completed", or "cancelled" status

### Filtering Logic

```typescript
// Step 1: Find pending offers by this customer
const pendingOffers = await db.offer.find({
  customer: customerId,
  status: "pending",
});

// Step 2: Get jobs for those offers
const jobs = await db.job.find({
  _id: { $in: offerJobIds },
  customerId: customerId,
  status: { $nin: ["in_progress", "completed", "cancelled"] },
});

// Step 3: Enrich with contractor details
```

---

## Frontend Integration

### React/Next.js Example

```typescript
// Service function
export const getPendingJobs = async (page = 1, limit = 10) => {
  const response = await fetch(
    `/api/job/pending-jobs?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  );
  return response.json();
};

// Component
const PendingJobsList = () => {
  const { data, isLoading } = useQuery("pendingJobs", getPendingJobs);

  return (
    <div>
      <h2>Waiting for Contractor Response</h2>
      {data?.data?.jobs.map((job) => (
        <JobCard key={job._id} job={job}>
          {/* Show contractor who received offer */}
          <div className="contractor-info">
            <img
              src={job.contractor.profile_img}
              alt={job.contractor.full_name}
            />
            <h4>{job.contractor.full_name}</h4>
            <p>
              Offer sent: {new Date(job.offer.createdAt).toLocaleDateString()}
            </p>
            <p>Expires: {new Date(job.offer.expiresAt).toLocaleDateString()}</p>
          </div>

          {/* Cancel button */}
          <button
            onClick={() => handleCancelOffer(job.offer.offerId)}
            className="btn-cancel"
          >
            Cancel Offer
          </button>
        </JobCard>
      ))}
    </div>
  );
};

// Cancel handler
const handleCancelOffer = async (offerId: string) => {
  await fetch(`/api/offer/${offerId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: "Contractor not responding",
    }),
  });

  // Refresh list
  queryClient.invalidateQueries("pendingJobs");
};
```

### Flutter Example

```dart
// Service
class JobService {
  Future<PendingJobsResponse> getPendingJobs({int page = 1, int limit = 10}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/job/pending-jobs?page=$page&limit=$limit'),
      headers: {
        'Authorization': 'Bearer ${await getAccessToken()}',
      },
    );

    return PendingJobsResponse.fromJson(jsonDecode(response.body));
  }
}

// Widget
class PendingJobsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PendingJobsResponse>(
      future: JobService().getPendingJobs(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return CircularProgressIndicator();

        final jobs = snapshot.data!.data.jobs;

        return ListView.builder(
          itemCount: jobs.length,
          itemBuilder: (context, index) {
            final job = jobs[index];

            return Card(
              child: Column(
                children: [
                  Text(job.title),
                  Text('\$${job.budget}'),

                  // Contractor info
                  ListTile(
                    leading: CircleAvatar(
                      backgroundImage: NetworkImage(job.contractor.profileImg),
                    ),
                    title: Text(job.contractor.fullName),
                    subtitle: Text('Waiting for response'),
                  ),

                  // Offer details
                  Text('Sent: ${job.offer.createdAt}'),
                  Text('Expires: ${job.offer.expiresAt}'),

                  // Cancel button
                  ElevatedButton(
                    onPressed: () => _cancelOffer(job.offer.offerId),
                    child: Text('Cancel Offer'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _cancelOffer(String offerId) async {
    await http.post(
      Uri.parse('$baseUrl/api/offer/$offerId/cancel'),
      headers: {
        'Authorization': 'Bearer ${await getAccessToken()}',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'reason': 'Contractor not responding'}),
    );

    // Refresh
    setState(() {});
  }
}
```

---

## Use Cases

### 1. View Pending Offers

Customer wants to see all jobs where they're waiting for contractor response.

```typescript
const pendingJobs = await getPendingJobs();
// Shows jobs with pending offers
```

### 2. Cancel Unresponsive Offers

Contractor hasn't responded in days, customer wants to cancel and try another contractor.

```typescript
const offerId = job.offer.offerId;
await cancelOffer(offerId, "No response after 3 days");
```

### 3. Track Offer Expiration

Show countdown timer for when offers will expire.

```typescript
const daysLeft = Math.ceil(
  (new Date(job.offer.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
);
// "Expires in 5 days"
```

### 4. Filter by Category

Customer wants to see pending offers for specific job types.

```typescript
const plumbingPendingJobs = await getPendingJobs({
  category: plumbingCategoryId,
});
```

---

## Testing

### Test Scenario 1: Customer with Pending Offers

**Setup**:

1. Customer posts job
2. Contractor applies
3. Customer sends offer (status: "pending")

**Expected**:

```bash
GET /api/job/pending-jobs
# Response: Job appears with offer and contractor details
```

### Test Scenario 2: No Pending Offers

**Setup**:

1. Customer has jobs but no pending offers

**Expected**:

```bash
GET /api/job/pending-jobs
# Response: Empty array with message "No pending offers found"
```

### Test Scenario 3: Offer Accepted

**Setup**:

1. Customer sends offer
2. Contractor accepts (status: "accepted")

**Expected**:

```bash
GET /api/job/pending-jobs
# Response: Job NOT in list (no longer pending)
```

### Test Scenario 4: Job In Progress

**Setup**:

1. Customer sends offer
2. Contractor accepts
3. Job status changes to "in_progress"

**Expected**:

```bash
GET /api/job/pending-jobs
# Response: Job NOT in list (excluded by status filter)
```

---

## Related Endpoints

- `GET /api/job/engaged` - Jobs with applications OR pending offers (for management)
- `GET /api/job/my/jobs` - All jobs posted by customer
- `POST /api/offer/:offerId/cancel` - Cancel pending offer
- `GET /api/offer` - Get all offers (if implemented)

---

## Performance Considerations

### Query Optimization

1. **Index on offer.customer + offer.status**: Fast lookup of pending offers
2. **Index on job.\_id**: Fast job retrieval
3. **Lean queries**: Reduced memory usage
4. **Pagination**: Prevents large result sets

### Caching Strategy

Consider caching for:

- Contractor details (frequently accessed)
- Category/location data (rarely changes)

---

## Conclusion

The pending jobs endpoint provides customers with a clear view of all jobs where they're waiting for contractor response. It includes all necessary information for offer management, including the `offerId` for cancellation.

**Key Features**:

- ✅ Shows only jobs with pending offers
- ✅ Includes contractor details
- ✅ Provides `offerId` for cancellation
- ✅ Excludes in_progress/completed jobs
- ✅ Supports filtering and pagination

---

**Status**: ✅ Implemented  
**Version**: 1.0.0  
**Last Updated**: November 25, 2025
