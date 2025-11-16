# Job Invite Module

## Overview

The Job Invite module allows **Customers** to proactively invite **Contractors** to work on their posted jobs. This is the reverse of the job-request module where contractors apply to jobs. With job invites, customers can reach out to specific contractors they're interested in working with.

## Flow Comparison

### Job Request Flow (Contractor → Customer)
1. Customer posts job
2. Contractor applies to job
3. Customer reviews applications
4. Customer accepts/rejects application
5. Chat enabled after acceptance

### Job Invite Flow (Customer → Contractor)
1. Customer posts job
2. Customer browses contractors
3. **Customer sends invite to contractor**
4. Contractor reviews invite
5. Contractor accepts/rejects invite
6. Chat enabled after acceptance

## Database Model

**File**: `src/db/models/job-invite.model.ts`

```typescript
{
  job: ObjectId,              // Reference to Job
  customer: ObjectId,         // Customer who sent the invite
  contractor: ObjectId,       // Contractor who received the invite
  status: "pending" | "accepted" | "rejected" | "cancelled",
  message?: string,           // Optional message from customer
  rejectionReason?: string,   // Optional reason for rejection
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `(job, contractor)` - Unique compound index (prevents duplicate invites)
- `(customer, status)` - For customer's sent invites queries
- `(contractor, status)` - For contractor's received invites queries

## API Endpoints

### Customer Endpoints

#### 1. Send Invite
**POST** `/api/job-invite/send/:jobId`

Send an invite to a specific contractor for a job.

**Auth**: Required (Customer only)

**Request**:
```json
{
  "contractorId": "contractor_id",
  "message": "I'd like to invite you to work on this project..."
}
```

**Response** (201):
```json
{
  "status": 201,
  "message": "Invite sent successfully",
  "data": {
    "_id": "invite_id",
    "job": { /* job details */ },
    "contractor": { /* contractor details */ },
    "status": "pending",
    "message": "I'd like to invite you...",
    "createdAt": "2025-11-16T10:00:00Z"
  }
}
```

**Validations**:
- Customer must own the job
- Job must be in "open" status
- Contractor must exist and have "contractor" role
- Contractor must not be suspended
- No duplicate invites allowed
- Contractor must not have already applied to this job

**Notifications**:
- Sends push notification to contractor

---

#### 2. Get Sent Invites
**GET** `/api/job-invite/sent`

Get all invites sent by the customer.

**Auth**: Required (Customer only)

**Query Parameters**:
- `jobId` (optional) - Filter by specific job
- `status` (optional) - Filter by status (pending, accepted, rejected, cancelled)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response** (200):
```json
{
  "status": 200,
  "message": "Invites retrieved successfully",
  "data": {
    "invites": [
      {
        "_id": "invite_id",
        "job": { /* job details */ },
        "contractor": { /* contractor details */ },
        "status": "pending",
        "createdAt": "2025-11-16T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

#### 3. Cancel Invite
**DELETE** `/api/job-invite/:inviteId`

Cancel a sent invite (only pending invites can be cancelled).

**Auth**: Required (Customer only)

**Response** (200):
```json
{
  "status": 200,
  "message": "Invite cancelled successfully",
  "data": null
}
```

**Validations**:
- Customer must be the invite sender
- Invite must be in "pending" status

**Notifications**:
- Sends push notification to contractor

---

### Contractor Endpoints

#### 4. Get Received Invites
**GET** `/api/job-invite/received`

Get all invites received by the contractor.

**Auth**: Required (Contractor only)

**Query Parameters**:
- `status` (optional) - Filter by status (pending, accepted, rejected, cancelled)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response** (200):
```json
{
  "status": 200,
  "message": "Invites retrieved successfully",
  "data": {
    "invites": [
      {
        "_id": "invite_id",
        "job": { /* job details */ },
        "customer": { /* customer details */ },
        "status": "pending",
        "message": "I'd like to invite you...",
        "createdAt": "2025-11-16T10:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

#### 5. Accept Invite
**PATCH** `/api/job-invite/:inviteId/accept`

Accept a job invite.

**Auth**: Required (Contractor only)

**Response** (200):
```json
{
  "status": 200,
  "message": "Invite accepted successfully",
  "data": {
    "invite": { /* invite details */ },
    "conversationId": "conversation_id"
  }
}
```

**Actions**:
- Updates invite status to "accepted"
- Creates or retrieves conversation between customer and contractor
- Sends push notification to customer

**Validations**:
- Contractor must be the invited one
- Invite must be in "pending" status
- Job must still be in "open" status

**Notifications**:
- Sends push notification to customer

---

#### 6. Reject Invite
**PATCH** `/api/job-invite/:inviteId/reject`

Reject a job invite with optional reason.

**Auth**: Required (Contractor only)

**Request**:
```json
{
  "rejectionReason": "Not available at this time"
}
```

**Response** (200):
```json
{
  "status": 200,
  "message": "Invite rejected successfully",
  "data": {
    "_id": "invite_id",
    "status": "rejected",
    "rejectionReason": "Not available at this time",
    /* other invite details */
  }
}
```

**Validations**:
- Contractor must be the invited one
- Invite must be in "pending" status

**Notifications**:
- Sends push notification to customer

---

### Shared Endpoints

#### 7. Get Invite Details
**GET** `/api/job-invite/:inviteId`

Get details of a specific invite.

**Auth**: Required (Customer or Contractor involved in the invite)

**Response** (200):
```json
{
  "status": 200,
  "message": "Invite retrieved successfully",
  "data": {
    "_id": "invite_id",
    "job": { /* full job details */ },
    "customer": { /* customer details */ },
    "contractor": { /* contractor details */ },
    "status": "pending",
    "message": "I'd like to invite you...",
    "createdAt": "2025-11-16T10:00:00Z",
    "updatedAt": "2025-11-16T10:00:00Z"
  }
}
```

**Validations**:
- User must be either the customer or contractor involved in the invite

---

## Status Flow

```
pending → accepted
   ↓
rejected
   ↓
cancelled (by customer)
```

**Status Descriptions**:
- `pending` - Invite sent, awaiting contractor response
- `accepted` - Contractor accepted the invite
- `rejected` - Contractor declined the invite
- `cancelled` - Customer cancelled the invite before contractor responded

## Business Rules

1. **One Invite Per Contractor Per Job**: A customer can only send one invite to a specific contractor for a specific job.

2. **No Duplicate Invites**: If a contractor has already applied to a job, the customer cannot send them an invite for that job.

3. **Job Status Check**: Invites can only be sent for jobs with "open" status.

4. **Contractor Verification**: Only users with "contractor" role can receive invites.

5. **Suspended Contractors**: Cannot send invites to suspended contractors.

6. **Ownership Verification**: 
   - Customers can only send invites for their own jobs
   - Contractors can only accept/reject invites sent to them
   - Customers can only cancel their own sent invites

7. **Status Restrictions**:
   - Only "pending" invites can be accepted, rejected, or cancelled
   - Once processed, invites cannot be modified

8. **Conversation Creation**: When a contractor accepts an invite, a conversation is automatically created (or retrieved if exists) for chat.

## Integration with Other Modules

### Job Module
- Checks job status before sending invite
- Verifies job ownership

### Job Request Module
- Prevents inviting contractors who have already applied
- Complementary system (contractors can apply OR be invited)

### Chat Module
- Creates conversation when invite is accepted
- Enables communication between customer and contractor

### Notification Module
- Sends push notifications for:
  - New invite received (to contractor)
  - Invite accepted (to customer)
  - Invite rejected (to customer)
  - Invite cancelled (to contractor)

### User Module
- Verifies contractor role and status
- Fetches user details for notifications

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": 400/401/403/404/500,
  "message": "Error description",
  "data": null
}
```

**Common Error Codes**:
- `400` - Bad request (validation errors, duplicate invites, invalid status)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not authorized for this action)
- `404` - Not found (job, contractor, or invite not found)
- `500` - Internal server error

## Usage Examples

### Customer Flow

```typescript
// 1. Customer posts a job
POST /api/job
{ title: "Fix plumbing", ... }

// 2. Customer browses contractors
GET /api/user?role=contractor&category=plumbing

// 3. Customer sends invite to contractor
POST /api/job-invite/send/job_123
{ contractorId: "contractor_456", message: "I'd like to hire you" }

// 4. Customer checks sent invites
GET /api/job-invite/sent?status=pending

// 5. Customer cancels invite (if needed)
DELETE /api/job-invite/invite_789
```

### Contractor Flow

```typescript
// 1. Contractor receives notification
// (Push notification via Firebase)

// 2. Contractor checks received invites
GET /api/job-invite/received?status=pending

// 3. Contractor views invite details
GET /api/job-invite/invite_789

// 4. Contractor accepts invite
PATCH /api/job-invite/invite_789/accept

// 5. Contractor starts chatting
GET /api/chat/conversations
POST /api/chat/messages
```

## Testing Checklist

- [ ] Customer can send invite to contractor
- [ ] Customer cannot send duplicate invites
- [ ] Customer cannot invite contractor who already applied
- [ ] Customer can view sent invites with filters
- [ ] Customer can cancel pending invite
- [ ] Contractor can view received invites
- [ ] Contractor can accept invite
- [ ] Contractor can reject invite with reason
- [ ] Conversation created on invite acceptance
- [ ] Notifications sent for all actions
- [ ] Proper authorization checks
- [ ] Pagination works correctly
- [ ] Error handling for all edge cases

## Future Enhancements

1. **Bulk Invites**: Allow customers to invite multiple contractors at once
2. **Invite Expiration**: Auto-expire invites after X days
3. **Invite Templates**: Pre-defined message templates for customers
4. **Contractor Preferences**: Allow contractors to set invite preferences
5. **Invite Analytics**: Track invite acceptance rates
6. **Recommended Contractors**: Suggest contractors based on job requirements

## Related Documentation

- [Job Module](../job/JOB_MODULE.md)
- [Job Request Module](../job-request/JOB_REQUEST_MODULE.md)
- [Chat System](.kiro/steering/chat-system.md)
- [Notification System](.kiro/steering/features.md#push-notifications)
