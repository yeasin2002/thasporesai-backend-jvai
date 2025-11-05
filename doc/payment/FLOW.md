# Complete Payment & Bidding Flow

## Overview

This document describes the complete end-to-end flow from job posting to payment release in the JobSphere platform.

## Flow Diagram

```
┌─────────────┐
│  Customer   │
│  Posts Job  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Job Status: open    │
│ Visible to all      │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│  Contractors Browse  │
│  & Send Applications │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────┐
│ Application Status: pending│
│ Customer receives notif    │
└──────┬─────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Customer Reviews Apps    │
│ Initiates Chat          │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Customer & Contractor    │
│ Discuss via Chat         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Customer Sends Offer         │
│ - Price: $1000               │
│ - Timeline: 7 days           │
│ - Description: Work details  │
└──────┬───────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Stripe Payment Intent Created  │
│ Amount: $1000                  │
│ Status: requires_confirmation  │
└──────┬─────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Customer Confirms Payment    │
│ (Card charged)               │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Offer Status: pending        │
│ Contractor receives notif    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Contractor Reviews Offer     │
│ Decision: Accept/Reject      │
└──────┬───────────────────────┘
       │
       ├─── Reject ───┐
       │              │
       │              ▼
       │         ┌──────────────────────┐
       │         │ Offer Status: rejected│
       │         │ Refund to Customer   │
       │         └──────────────────────┘
       │
       └─── Accept ───┐
                      │
                      ▼
┌────────────────────────────────────┐
│ Offer Status: accepted             │
│ Payment Captured in Stripe         │
│ Platform Fee (10%): $100 → Admin   │
│ Held Amount: $900                  │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Job Status: assigned               │
│ Job.contractorId = contractor._id  │
│ Job hidden from /jobs list         │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Customer CANNOT send more offers   │
│ for this job                       │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Contractor Starts Work             │
│ Job Status: in_progress            │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Contractor Completes Work          │
│ Notifies Customer                  │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Customer Reviews Work              │
│ Marks Job as Complete              │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Job Status: completed              │
│ Service Fee (20%): $200 → Admin    │
│ Contractor Payout (70%): $700      │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Admin Wallet: +$300 (10% + 20%)    │
│ Contractor Wallet: +$700           │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Payment Released via Stripe Connect│
│ Contractor receives funds          │
└────────────────────────────────────┘
```

## Detailed Step-by-Step Flow

### Phase 1: Job Posting

**Step 1.1: Customer Creates Job**

```
POST /api/job

Request:
{
  "title": "Fix Kitchen Plumbing",
  "description": "Need urgent plumbing repair",
  "category": ["plumbing_category_id"],
  "location": "location_id",
  "address": "123 Main St",
  "budget": 1000,
  "coverImg": "image_url"
}

Response:
{
  "status": 201,
  "message": "Job created successfully",
  "data": {
    "_id": "job_123",
    "status": "open",
    ...
  }
}
```

**Database Changes**:

- New Job document created
- Status: `open`
- Visible in `/api/job` listings

**Notifications**:

- All contractors in matching category receive push notification

---

### Phase 2: Application Submission

**Step 2.1: Contractor Sends Application**

```
POST /api/job-request/apply/:jobId

Request:
{
  "message": "I have 10 years experience in plumbing"
}

Response:
{
  "status": 201,
  "message": "Application submitted successfully",
  "data": {
    "_id": "application_123",
    "job": "job_123",
    "contractor": "contractor_123",
    "status": "pending",
    ...
  }
}
```

**Database Changes**:

- New JobApplicationRequest document created
- Status: `pending`
- Added to Job.jobApplicationRequest array

**Notifications**:

- Customer receives push notification

---

### Phase 3: Communication

**Step 3.1: Customer Reviews Applications**

```
GET /api/job-request/job/:jobId

Response:
{
  "status": 200,
  "data": {
    "applications": [
      {
        "_id": "application_123",
        "contractor": {
          "full_name": "John Contractor",
          "profile_img": "...",
          "rating": 4.8
        },
        "message": "I have 10 years experience",
        "status": "pending"
      }
    ]
  }
}
```

**Step 3.2: Customer Initiates Chat**

```
POST /api/chat/conversation

Request:
{
  "participantId": "contractor_123",
  "jobId": "job_123"
}

Response:
{
  "status": 201,
  "data": {
    "conversationId": "conv_123"
  }
}
```

**Step 3.3: Chat Exchange**

```
Socket.IO Events:
- send_message
- receive_message
- typing_start
- typing_stop
```

---

### Phase 4: Offer Creation

**Step 4.1: Customer Sends Offer**

```
POST /api/bidding/offer

Request:
{
  "jobId": "job_123",
  "contractorId": "contractor_123",
  "amount": 1000,
  "timeline": "7 days",
  "description": "Complete plumbing repair as discussed",
  "paymentMethodId": "pm_stripe_123"
}

Response:
{
  "status": 201,
  "message": "Offer sent successfully",
  "data": {
    "_id": "offer_123",
    "status": "pending",
    "paymentIntentId": "pi_stripe_123",
    "amount": 1000,
    ...
  }
}
```

**Backend Process**:

1. Validate job is still `open`
2. Validate contractor applied to job
3. Create Stripe Payment Intent
4. Create Offer document
5. Send notification to contractor

**Database Changes**:

- New Offer document created
- Status: `pending`
- Payment Intent ID stored

**Stripe API Call**:

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 100000, // $1000 in cents
  currency: "usd",
  payment_method: paymentMethodId,
  confirmation_method: "manual",
  capture_method: "manual", // Hold payment
  metadata: {
    offerId: offer._id,
    jobId: job._id,
    customerId: customer._id,
    contractorId: contractor._id,
  },
});
```

**Notifications**:

- Contractor receives push notification
- Email notification sent

---

### Phase 5: Offer Decision

**Step 5.1: Contractor Views Offer**

```
GET /api/bidding/offers/received

Response:
{
  "status": 200,
  "data": {
    "offers": [
      {
        "_id": "offer_123",
        "job": {
          "title": "Fix Kitchen Plumbing",
          ...
        },
        "customer": {
          "full_name": "Jane Customer",
          ...
        },
        "amount": 1000,
        "timeline": "7 days",
        "status": "pending"
      }
    ]
  }
}
```

**Step 5.2A: Contractor Accepts Offer**

```
POST /api/bidding/offer/:offerId/accept

Response:
{
  "status": 200,
  "message": "Offer accepted successfully",
  "data": {
    "offer": {
      "status": "accepted",
      ...
    },
    "job": {
      "status": "assigned",
      "contractorId": "contractor_123"
    }
  }
}
```

**Backend Process**:

1. Validate offer is still `pending`
2. Capture payment from Stripe
3. Calculate platform fee (10%)
4. Update Offer status to `accepted`
5. Update Job status to `assigned`
6. Set Job.contractorId
7. Create Transaction records
8. Update Admin wallet
9. Reject all other pending offers for this job
10. Send notifications

**Database Changes**:

```javascript
// Offer
{
  status: "accepted",
  acceptedAt: new Date()
}

// Job
{
  status: "assigned",
  contractorId: contractor._id
}

// Transaction (Platform Fee)
{
  type: "platform_fee",
  amount: 100,
  from: "customer_123",
  to: "admin",
  offerId: "offer_123",
  jobId: "job_123"
}

// Admin Wallet
{
  balance: previousBalance + 100
}
```

**Stripe API Call**:

```javascript
// Capture payment
await stripe.paymentIntents.capture(paymentIntentId);

// Calculate fees
const platformFee = amount * 0.1; // 10%
const heldAmount = amount - platformFee;
```

**Notifications**:

- Customer receives acceptance notification
- Other contractors receive rejection notifications

**Step 5.2B: Contractor Rejects Offer**

```
POST /api/bidding/offer/:offerId/reject

Request:
{
  "reason": "Timeline too short"
}

Response:
{
  "status": 200,
  "message": "Offer rejected successfully"
}
```

**Backend Process**:

1. Update Offer status to `rejected`
2. Refund payment to customer via Stripe
3. Send notification to customer

**Stripe API Call**:

```javascript
await stripe.refunds.create({
  payment_intent: paymentIntentId,
  reason: "requested_by_customer",
});
```

---

### Phase 6: Work Execution

**Step 6.1: Contractor Starts Work**

```
PATCH /api/job/:jobId/status

Request:
{
  "status": "in_progress"
}

Response:
{
  "status": 200,
  "message": "Job status updated",
  "data": {
    "status": "in_progress"
  }
}
```

**Step 6.2: Work Progress**

- Contractor and customer communicate via chat
- Progress updates shared
- Issues discussed and resolved

---

### Phase 7: Job Completion

**Step 7.1: Contractor Marks Work Complete**

```
POST /api/job/:jobId/complete-request

Response:
{
  "status": 200,
  "message": "Completion request sent to customer"
}
```

**Notifications**:

- Customer receives notification to review work

**Step 7.2: Customer Reviews & Confirms**

```
POST /api/job/:jobId/confirm-complete

Response:
{
  "status": 200,
  "message": "Job marked as complete",
  "data": {
    "job": {
      "status": "completed"
    },
    "payment": {
      "serviceFee": 200,
      "contractorPayout": 700,
      "adminCommission": 300
    }
  }
}
```

**Backend Process**:

1. Update Job status to `completed`
2. Calculate service fee (20%)
3. Calculate contractor payout (70%)
4. Create Transaction records
5. Update Admin wallet (+20%)
6. Update Contractor wallet (+70%)
7. Initiate Stripe Connect transfer
8. Send notifications

**Database Changes**:

```javascript
// Job
{
  status: "completed",
  completedAt: new Date()
}

// Transaction (Service Fee)
{
  type: "service_fee",
  amount: 200,
  from: "offer_123",
  to: "admin",
  jobId: "job_123"
}

// Transaction (Contractor Payout)
{
  type: "contractor_payout",
  amount: 700,
  from: "offer_123",
  to: "contractor_123",
  jobId: "job_123"
}

// Admin Wallet
{
  balance: previousBalance + 200
}

// Contractor Wallet
{
  balance: previousBalance + 700
}
```

**Stripe API Call**:

```javascript
// Transfer to contractor via Stripe Connect
await stripe.transfers.create({
  amount: 70000, // $700 in cents
  currency: "usd",
  destination: contractor.stripeAccountId,
  metadata: {
    jobId: job._id,
    offerId: offer._id,
  },
});
```

**Notifications**:

- Contractor receives payment notification
- Customer receives completion confirmation

---

### Phase 8: Post-Completion

**Step 8.1: Customer Leaves Review**

```
POST /api/review

Request:
{
  "contractorId": "contractor_123",
  "jobId": "job_123",
  "rating": 5,
  "rating_message": "Excellent work!"
}
```

**Step 8.2: Contractor Withdraws Funds**

```
POST /api/wallet/withdraw

Request:
{
  "amount": 700
}

Response:
{
  "status": 200,
  "message": "Withdrawal initiated",
  "data": {
    "estimatedArrival": "2-3 business days"
  }
}
```

---

## Edge Cases & Error Handling

### Case 1: Payment Fails During Offer Acceptance

**Scenario**: Stripe payment capture fails

**Handling**:

1. Rollback offer status to `pending`
2. Keep job status as `open`
3. Notify customer of payment failure
4. Allow retry

### Case 2: Customer Cancels Job After Offer Accepted

**Scenario**: Customer wants to cancel after contractor accepted

**Handling**:

1. Check if work has started
2. If not started: Full refund minus platform fee
3. If started: Partial refund based on work done
4. Admin manual review required

### Case 3: Contractor Doesn't Complete Work

**Scenario**: Contractor abandons job

**Handling**:

1. Customer reports issue
2. Admin reviews case
3. Refund issued to customer
4. Contractor penalized
5. Job reopened for other contractors

### Case 4: Dispute After Completion

**Scenario**: Customer disputes work quality

**Handling**:

1. Payment held temporarily
2. Admin reviews evidence
3. Decision made (full/partial payment or refund)
4. Appropriate actions taken

---

## Summary

This flow ensures:

- ✅ Secure payment processing
- ✅ Fair commission structure
- ✅ Clear job lifecycle
- ✅ Transparent transactions
- ✅ Dispute resolution capability
- ✅ User notifications at each step
- ✅ Audit trail for all actions

The system is designed to be simple, secure, and scalable while protecting both customers and contractors.
