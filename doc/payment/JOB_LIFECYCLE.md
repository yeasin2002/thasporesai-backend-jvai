# Job Lifecycle Management

## Job Status Flow

```
open → assigned → in_progress → completed
  ↓                                  ↓
cancelled ←─────────────────────────┘
```

## Status Definitions

### 1. open

- **When**: Job is first created by customer
- **Visible**: Yes, in `/api/job` listings
- **Actions Allowed**:
  - Contractors can apply
  - Customer can receive offers
  - Customer can chat with contractors
  - Customer can send offers

### 2. assigned

- **When**: Contractor accepts an offer
- **Visible**: No, hidden from `/api/job` listings
- **Actions Allowed**:
  - Contractor can start work
  - Customer and contractor can chat
  - Customer CANNOT send more offers
  - Status can be updated to `in_progress`

### 3. in_progress

- **When**: Contractor actively working on job
- **Visible**: No
- **Actions Allowed**:
  - Contractor can update progress
  - Customer and contractor can chat
  - Contractor can request completion review
  - Customer can mark as complete

### 4. completed

- **When**: Customer confirms work is done
- **Visible**: No
- **Actions Allowed**:
  - Customer can leave review
  - Payment released to contractor
  - No further status changes

### 5. cancelled

- **When**: Job cancelled by customer or admin
- **Visible**: No
- **Actions Allowed**:
  - Refund processed (if applicable)
  - No further actions

---

## Status Transitions

### Transition Rules

```typescript
const allowedTransitions = {
  open: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};
```

### Validation Function

```typescript
function canTransitionStatus(
  currentStatus: JobStatus,
  newStatus: JobStatus
): boolean {
  return allowedTransitions[currentStatus].includes(newStatus);
}
```

---

## Status Change Triggers

### open → assigned

**Trigger**: Contractor accepts offer

**Process**:

1. Validate offer is pending
2. Capture payment via Stripe
3. Update job status
4. Set job.contractorId
5. Set job.offerId
6. Set job.assignedAt
7. Reject other pending offers
8. Send notifications

**Database Updates**:

```typescript
await Job.findByIdAndUpdate(jobId, {
  status: "assigned",
  contractorId: contractor._id,
  offerId: offer._id,
  assignedAt: new Date(),
});
```

---

### assigned → in_progress

**Trigger**: Contractor starts work

**Process**:

1. Validate job is assigned to contractor
2. Update job status
3. Send notification to customer

**Database Updates**:

```typescript
await Job.findByIdAndUpdate(jobId, {
  status: "in_progress",
});
```

---

### in_progress → completed

**Trigger**: Customer marks job complete

**Process**:

1. Validate job is in progress
2. Calculate service fee (20%)
3. Calculate contractor payout (70%)
4. Update job status
5. Set job.completedAt
6. Create transactions
7. Update wallets
8. Transfer payment to contractor
9. Send notifications

**Database Updates**:

```typescript
await Job.findByIdAndUpdate(jobId, {
  status: "completed",
  completedAt: new Date(),
});
```

---

### any → cancelled

**Trigger**: Customer or admin cancels job

**Process**:

1. Check current status
2. Determine refund amount
3. Process refund if applicable
4. Update job status
5. Set job.cancelledAt
6. Set job.cancellationReason
7. Send notifications

**Refund Logic**:

```typescript
if (job.status === "open") {
  // No payment yet, just cancel
  refundAmount = 0;
} else if (job.status === "assigned") {
  // Refund minus platform fee (10%)
  refundAmount = offerAmount * 0.9;
} else if (job.status === "in_progress") {
  // Partial refund based on work done
  // Requires admin review
  refundAmount = calculatePartialRefund();
}
```

**Database Updates**:

```typescript
await Job.findByIdAndUpdate(jobId, {
  status: "cancelled",
  cancelledAt: new Date(),
  cancellationReason: reason,
});
```

---

## Job Visibility Rules

### Public Listings (`GET /api/job`)

**Included**:

- Jobs with status: `open`
- Not assigned to any contractor
- Within search/filter criteria

**Excluded**:

- Jobs with status: `assigned`, `in_progress`, `completed`, `cancelled`
- Jobs with contractorId set

### Customer's Jobs (`GET /api/job/my-jobs`)

**Included**:

- All jobs created by customer
- All statuses visible
- Sorted by creation date

### Contractor's Jobs (`GET /api/job/assigned-to-me`)

**Included**:

- Jobs where contractorId matches
- Status: `assigned`, `in_progress`, `completed`
- Sorted by status and date

---

## Offer Restrictions

### When Job is `open`

- ✅ Customer can send multiple offers to different contractors
- ✅ Contractors can accept/reject offers
- ✅ Multiple pending offers allowed

### When Job is `assigned`

- ❌ Customer CANNOT send new offers
- ❌ Other contractors CANNOT apply
- ✅ Assigned contractor can work
- ❌ Pending offers automatically rejected

### Implementation

```typescript
// Before creating offer
const job = await Job.findById(jobId);

if (job.status !== "open") {
  throw new Error("Cannot send offer for this job");
}

if (job.contractorId) {
  throw new Error("Job already assigned to a contractor");
}

// Check for existing accepted offer
const existingOffer = await Offer.findOne({
  job: jobId,
  status: "accepted",
});

if (existingOffer) {
  throw new Error("Job already has an accepted offer");
}
```

---

## Notifications

### Status Change Notifications

```typescript
const notificationMap = {
  assigned: {
    to: "customer",
    title: "Job Assigned",
    body: "Contractor has accepted your offer",
  },
  in_progress: {
    to: "customer",
    title: "Work Started",
    body: "Contractor has started working on your job",
  },
  completed: {
    to: "contractor",
    title: "Payment Released",
    body: "Customer has marked job complete. Payment released.",
  },
  cancelled: {
    to: "both",
    title: "Job Cancelled",
    body: "Job has been cancelled",
  },
};
```

---

## Edge Cases

### Case 1: Customer Cancels After Assignment

**Scenario**: Customer wants to cancel after contractor accepted

**Handling**:

- If work not started: Refund 90% (minus platform fee)
- If work started: Requires admin review
- Contractor may be compensated for time

### Case 2: Contractor Abandons Job

**Scenario**: Contractor stops responding

**Handling**:

- Customer reports issue
- Admin reviews case
- Job status changed to `cancelled`
- Full refund to customer
- Contractor penalized

### Case 3: Dispute After Completion

**Scenario**: Customer disputes work quality

**Handling**:

- Payment held temporarily
- Admin reviews evidence
- Decision: full/partial payment or refund
- Job status remains `completed`

### Case 4: Multiple Offers Accepted Simultaneously

**Scenario**: Race condition - two contractors accept at same time

**Handling**:

- Use database transaction
- First acceptance wins
- Second acceptance fails
- Automatic refund to second contractor

**Prevention**:

```typescript
// Use optimistic locking
const offer = await Offer.findOneAndUpdate(
  {
    _id: offerId,
    status: "pending", // Only update if still pending
  },
  {
    status: "accepted",
    acceptedAt: new Date(),
  },
  { new: true }
);

if (!offer) {
  throw new Error("Offer already processed");
}
```

---

## Monitoring & Alerts

### Metrics to Track

- Jobs stuck in `assigned` for > 7 days
- Jobs stuck in `in_progress` for > 14 days
- High cancellation rate
- Jobs with disputes
- Average time to completion

### Admin Alerts

- Job cancelled after payment
- Contractor not responding
- Customer dispute filed
- Payment failure
- Refund requested

---

## Summary

Job lifecycle management ensures:

- ✅ Clear status progression
- ✅ Proper payment handling at each stage
- ✅ Visibility control
- ✅ Offer restrictions
- ✅ Notification at key events
- ✅ Edge case handling
- ✅ Audit trail
