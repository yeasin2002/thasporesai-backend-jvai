# Payment System

## Overview

JobSphere uses a wallet-based payment system with Stripe integration and a 25% total commission structure (5% platform fee + 20% service fee). The system uses Stripe as the "bank" while tracking all transactions via database wallet balances, ensuring secure transactions between customers and contractors with complete audit trails.

**Status**: ✅ Stripe Integration Complete (v2.0)

## Commission Structure

### Breakdown

```
$100 Job Example:
├── Customer Pays: $105 (100 + 5% platform fee)
├── Platform Fee: $5 → Admin (when offer accepted)
├── Service Fee: $20 → Admin (when job completed)
└── Contractor Gets: $80 (when job completed)

Total Admin Commission: $25 (25%)
```

### Calculation

- **Platform Fee**: 5% of job budget (charged to customer on offer acceptance)
- **Service Fee**: 20% of job budget (deducted from contractor on completion)
- **Contractor Payout**: 80% of job budget (paid on completion)
- **Customer Total**: 105% of job budget (budget + platform fee)

## Payment Flow

### Complete Lifecycle

```
1. CUSTOMER DEPOSITS MONEY
   └─> POST /api/wallet/deposit
   └─> Backend creates Stripe Checkout Session
   └─> Returns checkout URL to customer
   └─> Customer opens URL in browser (not in-app)
   └─> Customer completes payment on Stripe
   └─> Stripe sends webhook to backend
   └─> Backend verifies and updates wallet balance in DB

2. CUSTOMER SENDS OFFER
   └─> POST /api/job-request/:applicationId/send-offer
   └─> Offer created with status "pending"
   └─> No wallet changes yet (pending acceptance)

3. CONTRACTOR ACCEPTS OFFER
   └─> POST /api/job-request/offer/:offerId/accept
   └─> Wallet updates (DB only, no real money transfer):
       - Customer wallet: -$105
       - Admin wallet: +$105
   └─> Job status → "assigned"
   └─> Offer status → "accepted"
   └─> Transaction: wallet_transfer

4. CONTRACTOR WORKS
   └─> PATCH /api/job/:id/status { "status": "in_progress" }
   └─> Job status → "in_progress"

5. CUSTOMER MARKS COMPLETE
   └─> POST /api/job/:id/complete
   └─> Creates completion request for admin

6. ADMIN APPROVES COMPLETION
   └─> POST /api/admin/completion-requests/:id/approve
   └─> Wallet updates (DB):
       - Admin wallet: -$80 (keeps $25 commission)
       - Contractor wallet: +$80
   └─> Admin initiates Stripe Connect transfer ($80 to contractor)
   └─> Job status → "completed"
   └─> Offer status → "completed"
   └─> Transactions: contractor_payout

ALTERNATIVE: REJECTION/CANCELLATION
   └─> POST /api/job-request/offer/:offerId/reject
   └─> OR POST /api/job/:id/cancel
   └─> Wallet updates (DB only):
       - Admin wallet: -$105
       - Customer wallet: +$105 (full refund)
   └─> Transaction: refund
```

## Database Models

### Wallet Model

```typescript
{
  user: ObjectId (unique),
  balance: Number,              // Single balance (no escrow)
  currency: String,             // "USD"
  isActive: Boolean,
  isFrozen: Boolean,            // Admin security control
  totalEarnings: Number,        // Lifetime earnings
  totalSpent: Number,           // Lifetime spending
  totalWithdrawals: Number,     // Lifetime withdrawals
  stripeCustomerId: String,     // For deposits (all users)
  stripeConnectAccountId: String // For payouts (contractors only)
}
```

**Key Changes in v2.0**:
- ❌ Removed `escrowBalance` field
- ✅ Single `balance` field tracks everything
- ✅ Added `stripeCustomerId` for all users
- ✅ Added `stripeConnectAccountId` for contractors

### Offer Model

```typescript
{
  job: ObjectId (unique),       // One offer per job
  customer: ObjectId,
  contractor: ObjectId,
  application: ObjectId,
  amount: Number,               // Job budget (100)
  platformFee: Number,          // 5% (5)
  serviceFee: Number,           // 20% (20)
  contractorPayout: Number,     // 80% (80)
  totalCharge: Number,          // Total (105)
  timeline: String,
  description: String,
  status: String,               // pending, accepted, rejected, cancelled, completed, expired
  acceptedAt: Date,
  rejectedAt: Date,
  cancelledAt: Date,
  completedAt: Date,
  expiresAt: Date,              // Auto-expires after 7 days
  rejectionReason: String,
  cancellationReason: String
}
```

### Transaction Model

```typescript
{
  type: String,                 // deposit, withdrawal, wallet_transfer, contractor_payout, refund
  amount: Number,
  from: ObjectId,               // Sender user
  to: ObjectId,                 // Receiver user
  offer: ObjectId,              // Related offer
  job: ObjectId,                // Related job
  status: String,               // pending, completed, failed
  description: String,
  failureReason: String,
  stripePaymentIntentId: String,    // For deposits
  stripeTransferId: String,         // For payouts/withdrawals
  stripeCheckoutSessionId: String,  // For deposits
  completedAt: Date
}
```

**Transaction Types in v2.0**:
- `deposit`: Real money added via Stripe
- `withdrawal`: Real money withdrawn via Stripe Connect
- `wallet_transfer`: Internal balance movement (offer acceptance)
- `contractor_payout`: Payment to contractor (DB + Stripe transfer)
- `refund`: Refund to customer (DB only)

## API Endpoints

### Wallet Management

- `GET /api/wallet` - Get wallet balance and details
- `POST /api/wallet/deposit` - Create Stripe Checkout Session (returns URL)
- `POST /api/wallet/withdraw` - Request withdrawal (requires admin approval)
- `GET /api/wallet/transactions` - Transaction history with pagination
- `POST /api/webhooks/stripe` - Stripe webhook handler (payment confirmations)

### Offer Management

- `POST /api/job-request/:applicationId/send-offer` - Customer sends offer
- `POST /api/job-request/offer/:offerId/accept` - Contractor accepts
- `POST /api/job-request/offer/:offerId/reject` - Contractor rejects

### Job Completion

- `PATCH /api/job/:id/status` - Update job status
- `POST /api/job/:id/complete` - Request completion (customer)
- `POST /api/admin/completion-requests/:id/approve` - Approve completion (admin)
- `POST /api/job/:id/cancel` - Cancel job (triggers refund)

### Stripe Connect (Contractors)

- `POST /api/wallet/stripe/onboard` - Get Stripe Connect onboarding link
- `GET /api/wallet/stripe/status` - Check Connect account status

## Business Rules

### Offer Rules

- One offer per job (enforced by unique index)
- Customer must have sufficient balance (budget + 5%)
- Job must be in "open" status to send offer
- Only offer recipient can accept/reject
- Offers expire after 7 days if not accepted
- Wallet deduction occurs only on acceptance (not on send)

### Payment Rules

- Money moves in DB only when offer accepted (no real Stripe transfer)
- Real Stripe transfers occur only for deposits and admin-approved payouts
- Full refund on offer rejection or job cancellation (DB only)
- Contractors can only withdraw with admin approval
- Wallets can be frozen by admin for security
- All outgoing money requires admin approval

### Transaction Rules

- All money movements create transaction records
- Transactions are atomic (MongoDB transactions)
- Transaction status: pending → completed/failed
- Complete audit trail maintained
- Stripe transfers tracked via `stripeTransferId`

## Stripe Integration

### Current Status

- ✅ Stripe Checkout for deposits (hosted payment page)
- ✅ Stripe Connect for contractor payouts
- ✅ Webhook handling for payment confirmations
- ✅ Admin approval workflow
- ✅ Complete integration implemented

### How It Works

**Deposits**:
1. Customer requests deposit
2. Backend creates Stripe Checkout Session
3. Returns session URL to customer
4. Customer opens URL in browser (external, not in-app)
5. Customer completes payment on Stripe
6. Stripe sends webhook to backend
7. Backend verifies signature and updates wallet in DB

**Withdrawals/Payouts**:
1. Contractor requests withdrawal OR admin approves job completion
2. Admin reviews in admin dashboard
3. Admin approves request
4. Backend initiates Stripe Connect transfer
5. Money transfers from platform Stripe account to contractor's bank
6. Wallet balance updated in DB
7. Transaction marked complete

### Stripe Resources

- Stripe MCP available for integration testing
- Webhook endpoint: `/api/webhooks/stripe`
- Test mode: Use Stripe CLI for local webhook forwarding
- Production: Configure webhook in Stripe Dashboard

## Error Handling

### Common Errors

- "Insufficient balance. Required: $X, Available: $Y"
- "Job is not open for offers"
- "An offer already exists for this job"
- "Only contractors can withdraw funds"
- "Wallet is frozen. Please contact support."
- "Offer not found or already processed"
- "Stripe payment failed. Please try again."

### Error Prevention

- Validate balance before offer send
- Check job status before operations
- Verify user roles and ownership
- Use MongoDB transactions for atomicity
- Implement idempotency (one offer per job)
- Verify Stripe webhook signatures
- Handle Stripe API errors gracefully

## Testing

### Test Scenarios

1. Customer deposits money via Stripe Checkout
2. Customer sends offer (check no balance change)
3. Contractor accepts offer (check DB wallet changes)
4. Customer marks job complete
5. Admin approves completion (check Stripe transfer initiated)
6. Contractor requests withdrawal
7. Admin approves withdrawal (check Stripe transfer)
8. Offer rejection (check DB refund)
9. Job cancellation (check DB refund)
10. Stripe webhook handling (success/failure)

### Test Data

- Customer with $0 balance → deposits $200 via Stripe
- Contractor with $0 balance
- Job with $100 budget
- Expected: Customer pays $105, contractor gets $80, admin gets $25

### Testing with Stripe

- Use Stripe test keys (`sk_test_`, `pk_test_`)
- Use Stripe CLI for webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Test card: `4242 4242 4242 4242`
- Test Connect accounts: Use Stripe test mode

## Documentation

### Complete Guides

Located in `doc/payment/`:

1. **README.md** - Navigation hub and quick reference
2.**1.MAIN-REFERENCE.md** - Complete system documentation with Stripe
3. **2.BACKEND_IMPLEMENTATION.md** - Implementation guide for backend team
4. **3.FRONTEND_API_GUIDE.md** - API reference for Flutter developers

### Quick Reference

- Commission: 5% + 20% = 25% total
- Customer pays: Budget + 5%
- Contractor gets: Budget × 80%
- Admin gets: Budget × 25%
- One offer per job
- Wallet-based tracking (no escrow)
- Stripe for real money (deposits/withdrawals only)

## Implementation Notes

### Key Files

- Models: `src/db/models/wallet.model.ts`, `offer.model.ts`, `transaction.model.ts`
- Services: `src/api/wallet/services/`, `src/api/job-request/services/`
- Config: `src/common/payment-config.ts`
- Routes: `src/api/wallet/wallet.route.ts`, `src/api/job-request/job-request.route.ts`

### Best Practices

- Always use MongoDB transactions for money movements
- Create transaction records for audit trail
- Validate before making changes
- Send notifications for payment events
- Handle errors gracefully with clear messages
- Verify user permissions before operations

### Atomic Operations

All payment operations use MongoDB transactions to ensure:

- All operations succeed together or fail together
- No partial updates
- Data consistency
- Race condition prevention
