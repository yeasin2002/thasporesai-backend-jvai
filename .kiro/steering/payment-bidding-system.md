# Payment & Bidding System

## Overview

JobSphere's payment and bidding system is the **most critical feature** of the platform. It enables customers to hire contractors through a secure, commission-based marketplace using Stripe for payment processing.

## System Architecture

### Core Components

1. **Job-Request Module** (`/api/job-request`) - Applications + Offer management (extend existing)
2. **Wallet Module** (`/api/wallet`) - Balance and transaction management (NEW)
3. **Job Module** (`/api/job`) - Job lifecycle and completion (extend existing)
4. **Transaction System** - Audit trail for all money movements
5. **Escrow System** - Hold money until job completion

**Note**: No separate bidding module needed - job-request handles everything!

### Commission Structure

```
Total Offer Amount: 100%
├── Platform Fee (10%) → Admin (on offer acceptance- can be change, use constants)
├── Service Fee (20%) → Admin (on job completion -can be change, use constants)
└── Contractor Payout (70%) → Contractor (on job completion)
```

**Example**: $1000 offer

- Platform Fee: $100 (when contractor accepts)
- Service Fee: $200 (when job completes)
- Contractor Gets: $700 (when job completes)
- Admin Total: $300 (30%)

## Complete Flow

### Phase 1: Job Posting & Application

```
1. Customer posts job → Status: open
2. Contractors browse and apply
3. Customer reviews applications
4. Customer initiates chat with contractors
```

### Phase 2: Offer Creation

```
Customer sends offer:
├── Amount: $1000
├── Timeline: "7 days"
├── Description: Work details
└── Payment Method: Stripe card

Backend creates:
├── Stripe Payment Intent (manual capture)
├── Offer document (status: pending)
└── Notification to contractor
```

### Phase 3: Offer Decision

**If Contractor Accepts**:

```
1. Capture payment from Stripe
2. Deduct platform fee (10%) → $100 to admin
3. Hold remaining amount → $900
4. Update Offer (status: accepted)
5. Update Job (status: assigned, contractorId set)
6. Reject all other pending offers for this job
7. Hide job from public listings
8. Customer CANNOT send more offers
```

**If Contractor Rejects**:

```
1. Update Offer (status: rejected)
2. Refund full amount to customer via Stripe
3. Notify customer
```

### Phase 4: Work Execution

```
1. Contractor starts work → Job status: in_progress
2. Customer and contractor communicate via chat
3. Contractor completes work
4. Contractor notifies customer
```

### Phase 5: Job Completion

```
Customer marks job complete:
├── Deduct service fee (20%) → $200 to admin
├── Calculate contractor payout (70%) → $700
├── Update Job (status: completed)
├── Create Transaction records
├── Update Admin wallet (+$200)
├── Update Contractor wallet (+$700)
├── Transfer to contractor via Stripe Connect
└── Send notifications
```

## Database Models

### Offer Model

**File**: `src/db/models/offer.model.ts`

```typescript
{
  job: ObjectId,                     // Reference to Job
  customer: ObjectId,                // Reference to Customer
  contractor: ObjectId,              // Reference to Contractor
  amount: number,                    // Offer amount in dollars
  timeline: string,                  // Expected completion time
  description: string,               // Work description
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired",

  // Payment details
  paymentIntentId: string,           // Stripe Payment Intent ID
  paymentStatus: "pending" | "captured" | "refunded",

  // Timestamps
  acceptedAt?: Date,
  rejectedAt?: Date,
  cancelledAt?: Date,
  expiresAt?: Date,

  // Reasons
  rejectionReason?: string,
  cancellationReason?: string,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

- `(job, status)`
- `(contractor, status)`
- `(customer, status)`
- `(job, contractor, status)` - Unique for pending offers

### Payment Model

**File**: `src/db/models/payment.model.ts`

```typescript
{
  offer: ObjectId,                   // Reference to Offer
  job: ObjectId,                     // Reference to Job
  customer: ObjectId,                // Reference to Customer
  contractor: ObjectId,              // Reference to Contractor

  // Amounts
  totalAmount: number,               // Total offer amount
  platformFee: number,               // 10% platform fee
  serviceFee: number,                // 20% service fee
  contractorPayout: number,          // 70% contractor payout

  // Stripe details
  paymentIntentId: string,           // Stripe Payment Intent ID
  transferId?: string,               // Stripe Transfer ID
  refundId?: string,                 // Stripe Refund ID

  // Status
  status: "pending" | "captured" | "released" | "refunded" | "failed",

  // Timestamps
  capturedAt?: Date,
  releasedAt?: Date,
  refundedAt?: Date,

  // Metadata
  failureReason?: string,
  refundReason?: string,

  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model

**File**: `src/db/models/transaction.model.ts`

```typescript
{
  type: "platform_fee" | "service_fee" | "contractor_payout" | "refund" | "withdrawal",
  amount: number,

  // References
  from: ObjectId,                    // User ID (payer)
  to: ObjectId,                      // User ID (receiver)
  offer?: ObjectId,
  job?: ObjectId,
  payment?: ObjectId,

  // Status
  status: "pending" | "completed" | "failed",

  // Metadata
  description: string,
  stripeTransactionId?: string,
  failureReason?: string,
  completedAt?: Date,

  createdAt: Date,
  updatedAt: Date
}
```

### Wallet Model

**File**: `src/db/models/wallet.model.ts`

```typescript
{
  user: ObjectId,                    // Reference to User
  balance: number,                   // Current balance
  currency: string,                  // Currency code (USD)

  // Stripe Connect (for contractors)
  stripeAccountId?: string,          // Stripe Connect account ID
  stripeAccountStatus?: "pending" | "active" | "restricted",

  // Status
  isActive: boolean,
  isFrozen: boolean,

  // Metadata
  totalEarnings: number,
  totalWithdrawals: number,
  pendingBalance: number,

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

## API Endpoints

### Job-Request Module (Extend Existing `/api/job-request`)

**New Endpoints**:
- `POST /:applicationId/send-offer` - Customer sends offer
- `POST /offer/:offerId/accept` - Contractor accepts offer
- `POST /offer/:offerId/reject` - Contractor rejects offer
- `GET /offers/sent` - Customer views sent offers
- `GET /offers/received` - Contractor views received offers
- `GET /offer/:offerId` - Get offer details

### Wallet Module (`/api/wallet`)

- `GET /` - Get wallet balance
- `GET /transactions` - Get transaction history
- `POST /connect-stripe` - Connect Stripe account (Contractor only)
- `POST /withdraw` - Request withdrawal (Contractor only)

### Job Module (Extend Existing `/api/job`)

**New Endpoints**:
- `POST /:jobId/complete` - Mark job complete (Customer only)
- `POST /:jobId/cancel` - Cancel job (Customer or Admin)
- `PATCH /:jobId/status` - Update job status (Customer or Contractor)

### Wallet Module (NEW `/api/wallet`)

- `GET /` - Get wallet balance
- `POST /deposit` - Add money to wallet
- `POST /withdraw` - Withdraw money (Contractors only)
- `GET /transactions` - Get transaction history

## Stripe Integration

### Payment Intent Flow

**1. Create Payment Intent (Offer Creation)**:

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(offerAmount * 100), // Convert to cents
  currency: "usd",
  payment_method: paymentMethodId,
  confirmation_method: "manual",
  capture_method: "manual", // Don't capture immediately
  metadata: {
    offerId: offer._id.toString(),
    jobId: job._id.toString(),
    customerId: customer._id.toString(),
    contractorId: contractor._id.toString(),
  },
});
```

**2. Capture Payment (Offer Acceptance)**:

```typescript
await stripe.paymentIntents.capture(paymentIntentId);
```

**3. Transfer to Contractor (Job Completion)**:

```typescript
await stripe.transfers.create({
  amount: Math.round(contractorPayout * 100),
  currency: "usd",
  destination: contractor.stripeAccountId,
  metadata: {
    jobId: jobId.toString(),
    offerId: offerId.toString(),
  },
});
```

**4. Refund (Offer Rejection)**:

```typescript
await stripe.refunds.create({
  payment_intent: paymentIntentId,
  reason: "requested_by_customer",
});
```

### Stripe Connect for Contractors

**1. Create Connect Account**:

```typescript
const account = await stripe.accounts.create({
  type: "standard",
  country: "US",
  email: contractor.email,
  capabilities: {
    transfers: { requested: true },
  },
});
```

**2. Generate Onboarding Link**:

```typescript
const accountLink = await stripe.accountLinks.create({
  account: contractor.stripeAccountId,
  refresh_url: `${FRONTEND_URL}/contractor/stripe/refresh`,
  return_url: `${FRONTEND_URL}/contractor/stripe/success`,
  type: "account_onboarding",
});
```

### Webhook Events

Handle these Stripe events:

- `payment_intent.succeeded` - Payment captured successfully
- `payment_intent.payment_failed` - Payment failed
- `transfer.created` - Transfer to contractor created
- `transfer.failed` - Transfer failed
- `account.updated` - Stripe Connect account updated
- `charge.refunded` - Refund completed

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
- Customer can send offers
- Customer can chat with contractors

**assigned**:

- Hidden from public listings
- Customer CANNOT send more offers
- Contractor can start work
- Only assigned contractor can access

**in_progress**:

- Contractor actively working
- Customer and contractor can chat
- Contractor can request completion review

**completed**:

- Terminal state
- Payment released to contractor
- Customer can leave review
- No further status changes

**cancelled**:

- Terminal state
- Refund processed (if applicable)
- No further actions

### Offer Restrictions

**When job is `open`**:

- ✅ Customer can send multiple offers to different contractors
- ✅ Multiple pending offers allowed

**When job is `assigned`**:

- ❌ Customer CANNOT send new offers
- ❌ Other contractors CANNOT apply
- ❌ Pending offers automatically rejected

## Service Implementation Pattern

### Example: Accept Offer Service

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess } from "@/helpers";
import { db } from "@/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const acceptOffer: RequestHandler = async (req, res) => {
  try {
    const { offerId } = req.params;
    const contractorId = req.user!.id;

    // 1. Validate offer
    const offer = await db.offer.findOne({
      _id: offerId,
      contractor: contractorId,
      status: "pending",
    });

    if (!offer) {
      return sendError(res, 404, "Offer not found or already processed");
    }

    // 2. Capture payment from Stripe
    await stripe.paymentIntents.capture(offer.paymentIntentId);

    // 3. Calculate fees
    const platformFee = offer.amount * 0.1;
    const serviceFee = offer.amount * 0.2;
    const contractorPayout = offer.amount * 0.7;

    // 4. Update offer
    offer.status = "accepted";
    offer.acceptedAt = new Date();
    offer.paymentStatus = "captured";
    await offer.save();

    // 5. Update job
    await db.job.findByIdAndUpdate(offer.job, {
      status: "assigned",
      contractorId: contractorId,
      offerId: offerId,
      assignedAt: new Date(),
    });

    // 6. Create payment record
    await db.payment.create({
      offer: offerId,
      job: offer.job,
      customer: offer.customer,
      contractor: contractorId,
      totalAmount: offer.amount,
      platformFee,
      serviceFee,
      contractorPayout,
      paymentIntentId: offer.paymentIntentId,
      status: "captured",
      capturedAt: new Date(),
    });

    // 7. Create transaction (platform fee)
    await db.transaction.create({
      type: "platform_fee",
      amount: platformFee,
      from: offer.customer,
      to: "admin", // Admin user ID
      offer: offerId,
      job: offer.job,
      status: "completed",
      description: "Platform fee for accepted offer",
      completedAt: new Date(),
    });

    // 8. Update admin wallet
    await db.wallet.findOneAndUpdate(
      { user: "admin" },
      {
        $inc: {
          balance: platformFee,
          totalEarnings: platformFee,
        },
      },
      { upsert: true }
    );

    // 9. Reject other pending offers
    await db.offer.updateMany(
      {
        job: offer.job,
        _id: { $ne: offerId },
        status: "pending",
      },
      {
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: "Another offer was accepted",
      }
    );

    // 10. Send notifications
    await NotificationService.sendToUser({
      userId: offer.customer,
      title: "Offer Accepted",
      body: "Contractor has accepted your offer",
      type: "booking_confirmed",
      data: { offerId, jobId: offer.job },
    });

    return sendSuccess(res, 200, "Offer accepted successfully", {
      offer,
      payment: { platformFee, serviceFee, contractorPayout },
    });
  } catch (error) {
    console.error("Error accepting offer:", error);
    return sendInternalError(res, "Failed to accept offer");
  }
};
```

## Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Commission Rates (percentage)
PLATFORM_FEE_PERCENT=10
SERVICE_FEE_PERCENT=20

# Payment Settings
PAYMENT_CURRENCY=USD
PAYMENT_HOLD_DAYS=7

# Frontend URLs (for Stripe Connect)
FRONTEND_URL=http://localhost:3000
```

## Dependencies

```json
{
  "stripe": "^14.x",
  "decimal.js": "^10.x"
}
```

Install with: `bun add stripe decimal.js`

## Security Considerations

1. **Payment Security**:

   - All payments processed through Stripe
   - No credit card data stored in database
   - Secure webhook verification

2. **Authorization**:

   - Verify user roles before actions
   - Check ownership of resources
   - Validate offer status before processing

3. **Transaction Integrity**:

   - Use database transactions for atomic operations
   - Implement optimistic locking for offers
   - Idempotency keys for Stripe operations

4. **Error Handling**:
   - Rollback on payment failures
   - Retry mechanism for failed webhooks
   - Admin alerts for critical errors

## Testing Strategy

### Unit Tests

- Test offer creation
- Test offer acceptance/rejection
- Test payment calculations
- Test wallet operations

### Integration Tests

- Test complete flow (offer → accept → complete)
- Test cancellation flow
- Test refund flow
- Test Stripe webhook handling

### Manual Testing

- Use Stripe test cards
- Test all user flows
- Verify commission calculations
- Test edge cases

## Common Edge Cases

### 1. Multiple Offers Accepted Simultaneously

**Solution**: Use optimistic locking with status check in update query

### 2. Payment Capture Fails

**Solution**: Rollback offer status, notify customer, allow retry

### 3. Customer Cancels After Assignment

**Solution**: Refund minus platform fee if work not started, admin review if started

### 4. Contractor Abandons Job

**Solution**: Customer reports, admin reviews, full refund, contractor penalized

### 5. Dispute After Completion

**Solution**: Hold payment, admin reviews evidence, make decision

## Monitoring & Alerts

### Key Metrics

- Payment success rate
- Average offer amount
- Commission earnings
- Failed payment count
- Refund rate
- Wallet balances

### Admin Alerts

- Payment capture failures
- Transfer failures
- Webhook delivery failures
- Jobs stuck in status
- High refund rate

## Implementation Priority

1. **Phase 1**: Database models (Offer, Wallet, Transaction) - Update Job & JobApplicationRequest
2. **Phase 2**: Payment configuration constants
3. **Phase 3**: Wallet module (deposit, balance, transactions)
4. **Phase 4**: Extend job-request module (send offer, accept, reject)
5. **Phase 5**: Extend job module (complete, cancel, status updates)
6. **Phase 6**: Edge cases (expiration, cancellation, refunds)
7. **Phase 7**: Admin endpoints (earnings, monitoring)
8. **Phase 8**: Testing (manual + automated)
9. **Phase 9**: Documentation
10. **Phase 10**: Deployment

**Total Time**: ~12 days

**See**: `doc/payment/IMPLEMENTATION_GUIDE.md` for detailed step-by-step instructions

## Best Practices

1. **Always validate** offer status before processing
2. **Check wallet balance** before deducting
3. **Use escrow** for holding money safely
4. **Log all transactions** for audit trail
5. **Send notifications** at every step
6. **Handle errors gracefully** with user-friendly messages
7. **Test edge cases** thoroughly (expiration, cancellation, etc.)
8. **Keep commission rates** configurable in constants
9. **Document all flows** clearly
10. **Review code** before deployment
11. **One offer per job** - enforce this rule strictly
12. **Atomic operations** - use database transactions for money movements

## Summary

This payment and bidding system is the **core revenue generator** for JobSphere. It must be:

- ✅ Secure and reliable
- ✅ Simple and intuitive
- ✅ Well-tested
- ✅ Properly monitored
- ✅ Clearly documented

The 30% commission (10% + 20%) provides sustainable revenue while keeping 70% for contractors, ensuring fair compensation for all parties.
