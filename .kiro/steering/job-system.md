# Job System

## Overview

Complete job management system with applications, invitations, and offers. Supports the full job lifecycle from posting to completion.

## Core Modules

### Job Module (`/api/job`)

- Job CRUD operations
- Job search with filters (category, location, budget, status)
- Job lifecycle management
- Engaged jobs (jobs with applications/offers)

### Job Request Module (`/api/job-request`)

- Contractor applications to jobs
- Application status management (pending/accepted/rejected/cancelled)
- Customer reviews applications

### Job Invite Module (`/api/job-invite`)

- Customer invites contractors to jobs
- Contractor accepts/rejects invitations
- Invitation status tracking

### Offer Module (`/api/offer`)

- Customer sends offers to contractors
- Offer acceptance/rejection
- Payment integration (see payment-bidding-system.md)

## Job Lifecycle

### Status Flow

```
open → assigned → in_progress → completed
  ↓                                  ↓
cancelled ←─────────────────────────┘
```

### Status Definitions

- **open**: Public, accepting applications, customer can send offers/invitations
- **assigned**: Contractor assigned via accepted offer, hidden from public
- **in_progress**: Work actively being performed
- **completed**: Work finished, payment released, review enabled
- **cancelled**: Job terminated, refunds processed if applicable

## Key Features

### Job Posting

- Title, description, budget, date
- Multiple categories support
- Location-based
- Cover image
- Customer ownership

### Job Search & Filtering

- Search by title/description
- Filter by category, location, budget range, status
- Pagination support
- Sort by date, budget

### Engaged Jobs

- Special endpoint for customers: `GET /api/job/engaged`
- Returns jobs with applications or offers
- Includes engagement statistics (application count, offer count)
- Helps customers manage active negotiations

### Job Applications

- Contractors apply to open jobs
- Customer reviews and accepts/rejects
- Application cancellation by contractor
- Status tracking per application

### Job Invitations

- Customer invites specific contractors
- Contractor can accept/reject
- Invitation expiration
- Available contractors list

### Offer System

- Customer sends offer after reviewing application
- One offer per job (enforced by unique index)
- Offer includes amount, timeline, description
- Acceptance triggers payment flow (see payment-bidding-system.md)

## API Endpoints

### Job Endpoints

- `POST /api/job` - Create job (customer only)
- `GET /api/job` - Get all jobs (public, with filters)
- `GET /api/job/:id` - Get single job
- `PATCH /api/job/:id` - Update job (owner only)
- `DELETE /api/job/:id` - Delete job (owner only)
- `GET /api/job/my/jobs` - Get own jobs (customer)
- `GET /api/job/engaged` - Get engaged jobs (customer)
- `POST /api/job/:id/complete` - Mark complete (customer)
- `POST /api/job/:id/cancel` - Cancel job
- `PATCH /api/job/:id/status` - Update status

### Application Endpoints

- `POST /api/job-request/apply` - Apply to job (contractor)
- `GET /api/job-request/my-applications` - Get own applications (contractor)
- `GET /api/job-request/job/:jobId` - Get job applications (customer)
- `GET /api/job-request/customer-applications` - Get all applications for customer's jobs
- `POST /api/job-request/:id/accept` - Accept application (customer)
- `POST /api/job-request/:id/reject` - Reject application (customer)
- `DELETE /api/job-request/:id` - Cancel application (contractor)

### Invitation Endpoints

- `POST /api/job-invite/send` - Send invitation (customer)
- `GET /api/job-invite/sent` - Get sent invitations (customer)
- `GET /api/job-invite/received` - Get received invitations (contractor)
- `GET /api/job-invite/:id` - Get invitation details
- `POST /api/job-invite/:id/accept` - Accept invitation (contractor)
- `POST /api/job-invite/:id/reject` - Reject invitation (contractor)
- `DELETE /api/job-invite/:id` - Cancel invitation (customer)
- `GET /api/job-invite/available-contractors` - Get contractors for invitation

### Offer Endpoints

See payment-bidding-system.md for offer flow details.

## Database Models

### Job

- Basic info: title, description, budget, date, coverImg
- References: customerId, category[], location, contractorId, offerId
- Status: open/assigned/in_progress/completed/cancelled
- Timestamps: assignedAt, completedAt, cancelledAt
- Relations: jobApplicationRequest[]

### JobApplicationRequest

- References: job, contractor
- Status: pending/accepted/rejected/cancelled
- Timestamps: appliedAt, respondedAt, cancelledAt
- Reason fields for rejection/cancellation

### JobInvite

- References: job, customer, contractor
- Status: pending/accepted/rejected/cancelled/expired
- Message from customer
- Timestamps: sentAt, respondedAt, expiresAt

## Business Rules

### Application Rules

- Contractor can only apply once per job
- Cannot apply to own jobs
- Cannot apply to assigned/completed/cancelled jobs
- Can cancel own pending applications

### Invitation Rules

- Customer can invite multiple contractors
- Cannot invite to assigned/completed/cancelled jobs
- Invitations expire after configurable period
- Contractor can accept/reject invitations

### Offer Rules

- One offer per job (unique index enforced)
- Can only send offer to contractors who applied
- Offer acceptance assigns job to contractor
- Other pending offers/applications auto-rejected on acceptance

### Status Transition Rules

- open → assigned: When offer accepted
- assigned → in_progress: When contractor starts work
- in_progress → completed: When customer marks complete
- Any status → cancelled: With proper authorization

## Integration Points

### With Payment System

- Offer acceptance triggers payment hold
- Job completion triggers payment release
- Job cancellation triggers refund logic

### With Chat System

- Chat enabled between customer and contractors
- Conversation linked to job (optional)

### With Notification System

- Job posted → Notify all contractors
- Application received → Notify customer
- Invitation sent → Notify contractor
- Offer sent → Notify contractor
- Status changes → Notify relevant parties

### With Review System

- Job completion enables review submission
- Reviews linked to job and users

## Related Documentation

- Job implementation: `doc/job/`
- Engaged jobs: `doc/job/ENGAGED_JOBS.md`
- Payment integration: `.kiro/steering/payment-bidding-system.md`
