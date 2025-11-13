# Revised Payment Flow - JobSphere

## Overview

This document describes the **actual** payment flow for JobSphere, using the existing job-request module for applications and a simplified offer system.

## Commission Structure

### Buyer (Customer) Side
```
Job Budget: $100
Buyer Pays: $105 (100 + 5% platform fee)
├── $100 → Held for job
└── $5 (5%) → Admin (platform fee)
```

### Seller (Contractor) Side
```
Job Budget: $100
Seller Receives: $80 (100 - 20% service fee)
├── $80 → Contractor
└── $20 (20%) → Admin (service fee)
```

### Total Admin Commission
```
From $100 job:
├── $5 from buyer (5%)
├── $20 from seller (20%)
└── Total: $25 (25% of job budget)
```

## Complete Flow

### Phase 1: Job Posting (Existing - No Changes)

**Module**: `src/api/job`

```
1. Customer posts job
   ├── Title, description, budget ($100)
   ├── Category, location
   └── Status: "open"

2. Job visible in public listings
   └── GET /api/job
```

### Phase 2: Application (Existing - No Changes)

**Module**: `src/api/job-request`

```
1. Contractor browses jobs
   └── GET /api/job

2. Contractor applies to job
   ├── POST /api/job-request/apply/:jobId
   ├── Optional message
   └── Application Status: "pending"

3. Customer receives notification
   └── "New Job Application from [Contractor Name]"

4. Customer views applications
   └── GET /api/job-request/job/:jobId
```

### Phase 3: Communication (Existing - No Changes)

**Module**: `src/api/chat`

```
1. Customer reviews applications
   └── See contractor profiles, ratings, experience

2. Customer initiates chat with contractors
   ├── POST /api/chat/conversation
   └── Socket.IO real-time messaging

3. Customer discusses job details with multiple contractors
```

### Phase 4: Offer Creation (NEW)

**Module**: `src/api/job-request` (extend existing)

**New Endpoint**: `POST /api/job-request/:applicationId/send-offer`

```
Customer sends offer to ONE contractor:

Prerequisites:
├── ✅ Application must exist and be "pending"
├── ✅ Job must be "open"
├── ✅ Customer must own the job
├── ✅ No existing offer for this job
└── ✅ Customer wallet balance >= (job budget + 5%)

Request Body:
{
  "amount": 100,           // Job budget
  "timeline": "7 days",
  "description": "Work details as discussed"
}

Backend Process:
1. Calculate total: $100 + 5% = $105
2. Check customer wallet balance >= $105
3. Create Offer document:
   ├── job: jobId
   ├── customer: customerId
   ├── contractor: contractorId
   ├── application: applicationId
   ├── amount: 100
   ├── platformFee: 5 (5%)
   ├── serviceFee: 20 (20%)
   ├── contractorPayout: 80 (80%)
   ├── totalCharge: 105
   └── status: "pending"

4. Deduct $105 from customer wallet
5. Add $105 to escrow/hold
6. Update application status: "offer_sent"
7. Send notification to contractor

Response:
{
  "status": 201,
  "message": "Offer sent successfully",
  "data": {
    "offer": {...},
    "walletBalance": 895  // Remaining balance
  }
}

Restrictions:
❌ Cannot send another offer for same job until:
   - Current offer is rejected, OR
   - Current offer expires
```

### Phase 5: Offer Decision (NEW)

**Module**: `src/api/job-request` (extend existing)

#### Option A: Contractor Accepts

**Endpoint**: `POST /api/job-request/offer/:offerId/accept`

```
Backend Process:
1. Validate offer is "pending"
2. Validate contractor is offer recipient
3. Update Offer status: "accepted"
4. Update Job:
   ├── status: "assigned"
   ├── contractorId: contractor._id
   ├── offerId: offer._id
   └── assignedAt: new Date()

5. Update Application status: "accepted"
6. Reject all other applications for this job
7. Transfer platform fee to admin:
   ├── $5 from escrow → Admin wallet
   └── Remaining $100 stays in escrow

8. Create Transaction records:
   ├── Platform fee: $5 → Admin
   └── Escrow hold: $100

9. Send notifications:
   ├── Customer: "Offer accepted by [Contractor]"
   └── Other applicants: "Job filled"

10. Hide job from public listings

Result:
├── Job Status: "assigned"
├── Escrow: $100 (held)
├── Admin Wallet: +$5
└── Customer CANNOT send more offers for this job
```

#### Option B: Contractor Rejects

**Endpoint**: `POST /api/job-request/offer/:offerId/reject`

```
Request Body:
{
  "reason": "Timeline too short"
}

Backend Process:
1. Update Offer status: "rejected"
2. Update Application status: "rejected"
3. Refund customer wallet: +$105
4. Remove from escrow: -$105
5. Send notification to customer

Result:
├── Customer can send offer to another contractor
└── Job remains "open"
```

### Phase 6: Work Execution (NEW)

**Module**: `src/api/job` (extend existing)

**Endpoint**: `PATCH /api/job/:jobId/status`

```
1. Contractor starts work
   ├── PATCH /api/job/:jobId/status
   ├── Body: { "status": "in_progress" }
   └── Job Status: "in_progress"

2. Work in progress
   ├── Customer and contractor communicate
   ├── Progress updates via chat
   └── Issues discussed

3. Contractor completes work
   ├── Contractor notifies customer
   └── Requests completion review
```

### Phase 7: Job Completion & Payment Release (NEW)

**Module**: `src/api/job` (extend existing)

**Endpoint**: `POST /api/job/:jobId/complete`

```
Customer marks job complete:

Prerequisites:
├── ✅ Job status is "in_progress"
├── ✅ Customer owns the job
└── ✅ Offer exists and is "accepted"

Backend Process:
1. Validate prerequisites
2. Calculate final amounts:
   ├── Service fee: $20 (20% of $100)
   └── Contractor payout: $80 (80% of $100)

3. Update Job:
   ├── status: "completed"
   └── completedAt: new Date()

4. Update Offer:
   ├── status: "completed"
   └── completedAt: new Date()

5. Transfer funds:
   ├── $20 from escrow → Admin wallet
   └── $80 from escrow → Contractor wallet

6. Create Transaction records:
   ├── Service fee: $20 → Admin
   └── Contractor payout: $80 → Contractor

7. Update Wallets:
   ├── Admin: +$20 (total +$25 from this job)
   └── Contractor: +$80

8. Send notifications:
   ├── Contractor: "Payment released: $80"
   └── Customer: "Job completed successfully"

Final Result:
├── Customer paid: $105
├── Admin earned: $25 (5% + 20%)
├── Contractor earned: $80
└── Job Status: "completed"
```


## Database Models

### Offer Model (NEW)

**File**: `src/db/models/offer.model.ts`

```typescript
{
  job: ObjectId,                     // Reference to Job
  customer: ObjectId,                // Reference to Customer
  contractor: ObjectId,              // Reference to Contractor
  application: ObjectId,             // Reference to JobApplicationRequest
  
  // Amounts
  amount: number,                    // Job budget (e.g., 100)
  platformFee: number,               // 5% charged to buyer (e.g., 5)
  serviceFee: number,                // 20% deducted from seller (e.g., 20)
  contractorPayout: number,          // 80% to contractor (e.g., 80)
  totalCharge: number,               // Total charged to buyer (e.g., 105)
  
  // Details
  timeline: string,                  // Expected completion time
  description: string,               // Work description
  
  // Status
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed" | "expired",
  
  // Timestamps
  acceptedAt?: Date,
  rejectedAt?: Date,
  cancelledAt?: Date,
  completedAt?: Date,
  expiresAt?: Date,
  
  // Reasons
  rejectionReason?: string,
  cancellationReason?: string,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```typescript
offerSchema.index({ job: 1 }, { unique: true }); // One offer per job
offerSchema.index({ contractor: 1, status: 1 });
offerSchema.index({ customer: 1, status: 1 });
offerSchema.index({ application: 1 });
```

### Wallet Model (NEW)

**File**: `src/db/models/wallet.model.ts`

```typescript
{
  user: ObjectId,                    // Reference to User
  balance: number,                   // Current available balance
  escrowBalance: number,             // Money held in escrow
  currency: string,                  // Currency code (USD)
  
  // Status
  isActive: boolean,
  isFrozen: boolean,
  
  // Metadata
  totalEarnings: number,             // Lifetime earnings
  totalSpent: number,                // Lifetime spending (for customers)
  totalWithdrawals: number,          // Lifetime withdrawals (for contractors)
  
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model (NEW)

**File**: `src/db/models/transaction.model.ts`

```typescript
{
  type: "platform_fee" | "service_fee" | "contractor_payout" | "refund" | "deposit" | "withdrawal" | "escrow_hold" | "escrow_release",
  amount: number,
  
  // References
  from: ObjectId,                    // User ID (payer)
  to: ObjectId,                      // User ID (receiver)
  offer?: ObjectId,
  job?: ObjectId,
  
  // Status
  status: "pending" | "completed" | "failed",
  
  // Metadata
  description: string,
  failureReason?: string,
  completedAt?: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Job Model Updates

**File**: `src/db/models/job.model.ts`

**Add these fields**:
```typescript
{
  // ... existing fields
  
  // NEW FIELDS
  contractorId?: ObjectId,           // Assigned contractor
  offerId?: ObjectId,                // Accepted offer
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled",
  assignedAt?: Date,
  completedAt?: Date,
  cancelledAt?: Date,
  cancellationReason?: string,
}
```

### JobApplicationRequest Model Updates

**File**: `src/db/models/job-application-request.model.ts`

**Update status enum**:
```typescript
{
  // ... existing fields
  
  // UPDATE STATUS
  status: "pending" | "accepted" | "rejected" | "offer_sent",
  
  // NEW FIELD
  offerId?: ObjectId,                // Reference to offer if sent
}
```

## API Endpoints

### Job Request Module (Extend Existing)

**New Endpoints**:

1. `POST /api/job-request/:applicationId/send-offer` - Customer sends offer
2. `POST /api/job-request/offer/:offerId/accept` - Contractor accepts offer
3. `POST /api/job-request/offer/:offerId/reject` - Contractor rejects offer
4. `GET /api/job-request/offers/sent` - Customer views sent offers
5. `GET /api/job-request/offers/received` - Contractor views received offers
6. `GET /api/job-request/offer/:offerId` - Get offer details

### Wallet Module (NEW)

**File**: `src/api/wallet/`

1. `GET /api/wallet` - Get wallet balance
2. `POST /api/wallet/deposit` - Add money to wallet
3. `POST /api/wallet/withdraw` - Withdraw money (contractors only)
4. `GET /api/wallet/transactions` - Get transaction history

### Job Module (Extend Existing)

**New Endpoints**:

1. `POST /api/job/:jobId/complete` - Mark job complete (Customer only)
2. `POST /api/job/:jobId/cancel` - Cancel job (Customer or Admin)
3. `PATCH /api/job/:jobId/status` - Update job status

## Configuration Constants

**File**: `src/common/constants.ts`

```typescript
export const PAYMENT_CONFIG = {
  // Commission rates (percentage)
  PLATFORM_FEE_PERCENT: 5,           // Charged to buyer
  SERVICE_FEE_PERCENT: 20,           // Deducted from seller
  
  // Calculated rates
  BUYER_TOTAL_PERCENT: 105,          // Buyer pays 105%
  CONTRACTOR_PAYOUT_PERCENT: 80,     // Contractor gets 80%
  ADMIN_TOTAL_PERCENT: 25,           // Admin gets 25% total
  
  // Currency
  CURRENCY: "USD",
  
  // Limits
  MIN_JOB_BUDGET: 10,                // Minimum $10
  MAX_JOB_BUDGET: 10000,             // Maximum $10,000
  MIN_WALLET_BALANCE: 0,
  
  // Offer expiration
  OFFER_EXPIRY_DAYS: 7,              // Offers expire after 7 days
};

// Helper functions
export const calculatePaymentAmounts = (jobBudget: number) => {
  const platformFee = jobBudget * (PAYMENT_CONFIG.PLATFORM_FEE_PERCENT / 100);
  const serviceFee = jobBudget * (PAYMENT_CONFIG.SERVICE_FEE_PERCENT / 100);
  const contractorPayout = jobBudget - serviceFee;
  const totalCharge = jobBudget + platformFee;
  const adminTotal = platformFee + serviceFee;
  
  return {
    jobBudget,
    platformFee,
    serviceFee,
    contractorPayout,
    totalCharge,
    adminTotal,
  };
};
```

## Key Business Rules

### 1. One Offer Per Job Rule

```typescript
// Before creating offer
const existingOffer = await db.offer.findOne({
  job: jobId,
  status: { $in: ["pending", "accepted"] }
});

if (existingOffer) {
  return sendError(res, 400, "An offer already exists for this job");
}
```

### 2. Wallet Balance Check

```typescript
// Before sending offer
const wallet = await db.wallet.findOne({ user: customerId });
const amounts = calculatePaymentAmounts(offerAmount);

if (wallet.balance < amounts.totalCharge) {
  return sendError(
    res, 
    400, 
    `Insufficient balance. Required: $${amounts.totalCharge}, Available: $${wallet.balance}`
  );
}
```

### 3. Escrow Management

```typescript
// When offer sent
await db.wallet.findOneAndUpdate(
  { user: customerId },
  {
    $inc: {
      balance: -amounts.totalCharge,
      escrowBalance: amounts.totalCharge,
    }
  }
);

// When offer accepted
await db.wallet.findOneAndUpdate(
  { user: "admin" },
  {
    $inc: {
      balance: amounts.platformFee,
      escrowBalance: -amounts.platformFee,
    }
  }
);

// When job completed
await db.wallet.findOneAndUpdate(
  { user: "admin" },
  {
    $inc: {
      balance: amounts.serviceFee,
      escrowBalance: -amounts.serviceFee,
    }
  }
);

await db.wallet.findOneAndUpdate(
  { user: contractorId },
  {
    $inc: {
      balance: amounts.contractorPayout,
    }
  }
);
```

### 4. Application Status Management

```typescript
// When offer sent
await db.jobApplicationRequest.findByIdAndUpdate(applicationId, {
  status: "offer_sent",
  offerId: offer._id,
});

// When offer accepted
await db.jobApplicationRequest.findByIdAndUpdate(applicationId, {
  status: "accepted",
});

// Reject other applications
await db.jobApplicationRequest.updateMany(
  {
    job: jobId,
    _id: { $ne: applicationId },
    status: "pending",
  },
  {
    status: "rejected",
  }
);
```

## Job Lifecycle

### Status Transitions

```
open → assigned → in_progress → completed
  ↓                                  ↓
cancelled ←─────────────────────────┘
```

### Status Rules

**open**:
- Visible in public listings
- Contractors can apply
- Customer can send ONE offer
- Customer can chat with applicants

**assigned**:
- Hidden from public listings
- Customer CANNOT send more offers
- Only assigned contractor can access
- Contractor can start work

**in_progress**:
- Contractor actively working
- Customer and contractor can chat
- Customer can mark complete

**completed**:
- Terminal state
- Payment released to contractor
- Customer can leave review
- No further status changes

**cancelled**:
- Terminal state
- Refund processed
- No further actions

## Offer Lifecycle

### Status Transitions

```
pending → accepted → completed
    ↓
rejected/cancelled/expired
```

### Status Rules

**pending**:
- Waiting for contractor decision
- Customer cannot send another offer for same job
- Can be cancelled by customer
- Auto-expires after 7 days

**accepted**:
- Job assigned to contractor
- Money moved from customer wallet to escrow
- Platform fee transferred to admin
- Cannot be cancelled

**rejected**:
- Full refund to customer
- Customer can send offer to another contractor
- Application marked as rejected

**completed**:
- Job finished
- Service fee transferred to admin
- Contractor payout transferred to contractor
- Terminal state

**cancelled**:
- Customer cancelled before acceptance
- Full refund to customer
- Application status reset

**expired**:
- Offer not accepted within 7 days
- Full refund to customer
- Customer can send new offer

## Notification Events

### Customer Notifications

1. **Application Received**: "New application from [Contractor]"
2. **Offer Accepted**: "Offer accepted by [Contractor]"
3. **Offer Rejected**: "Offer rejected by [Contractor]"
4. **Work Started**: "Contractor started working"
5. **Work Completed**: "Job completed successfully"

### Contractor Notifications

1. **Offer Received**: "You received an offer for [Job Title]"
2. **Offer Cancelled**: "Offer was cancelled by customer"
3. **Offer Expired**: "Offer expired"
4. **Payment Released**: "You received $[amount]"
5. **Job Cancelled**: "Job was cancelled"

### Admin Notifications

1. **Platform Fee Received**: "$[amount] platform fee"
2. **Service Fee Received**: "$[amount] service fee"
3. **Dispute Filed**: "Customer filed dispute for [Job]"

## Error Handling

### Common Errors

1. **Insufficient Balance**:
```typescript
if (wallet.balance < totalCharge) {
  return sendError(res, 400, "Insufficient wallet balance");
}
```

2. **Duplicate Offer**:
```typescript
if (existingOffer) {
  return sendError(res, 400, "Offer already exists for this job");
}
```

3. **Invalid Status**:
```typescript
if (job.status !== "open") {
  return sendError(res, 400, "Job is not open for offers");
}
```

4. **Unauthorized**:
```typescript
if (job.customerId.toString() !== req.user.id) {
  return sendError(res, 403, "Not authorized");
}
```

## Security Considerations

1. **Wallet Operations**: Use database transactions for atomic updates
2. **Balance Validation**: Always check before deducting
3. **Authorization**: Verify user owns resources
4. **Escrow Safety**: Never allow direct escrow manipulation
5. **Transaction Logging**: Log every money movement
6. **Audit Trail**: Keep complete transaction history

## Testing Scenarios

### Happy Path
1. Customer posts job ($100)
2. Contractor applies
3. Customer sends offer (wallet: $105)
4. Contractor accepts (admin: +$5, escrow: $100)
5. Contractor completes work
6. Customer marks complete (admin: +$20, contractor: +$80)

### Edge Cases
1. Insufficient wallet balance
2. Offer rejected by contractor
3. Job cancelled after offer sent
4. Offer expires without response
5. Multiple contractors apply
6. Customer tries to send multiple offers

## Implementation Priority

1. **Phase 1**: Wallet system (deposit, balance, transactions)
2. **Phase 2**: Offer creation in job-request module
3. **Phase 3**: Offer acceptance/rejection
4. **Phase 4**: Job completion and payment release
5. **Phase 5**: Cancellation and refund handling
6. **Phase 6**: Admin dashboard for monitoring
7. **Phase 7**: Testing and edge cases
8. **Phase 8**: Production deployment

---

**Next Steps**: See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed implementation instructions.
