# Payment System

## Overview

JobSphere uses a wallet-based escrow payment system with a 25% total commission structure (5% platform fee + 20% service fee). The system ensures secure transactions between customers and contractors with complete audit trails.

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
   └─> Wallet balance increases

2. CUSTOMER SENDS OFFER
   └─> POST /api/job-request/:applicationId/send-offer
   └─> Wallet: balance -= $105, escrowBalance += $105
   └─> Offer created with status "pending"
   └─> Transaction: escrow_hold

3. CONTRACTOR ACCEPTS OFFER
   └─> POST /api/job-request/offer/:offerId/accept
   └─> Platform fee $5 → Admin wallet
   └─> Escrow: $105 → $100 (platform fee released)
   └─> Job status → "assigned"
   └─> Offer status → "accepted"
   └─> Transaction: platform_fee

4. CONTRACTOR WORKS
   └─> PATCH /api/job/:id/status { "status": "in_progress" }
   └─> Job status → "in_progress"

5. CUSTOMER MARKS COMPLETE
   └─> POST /api/job/:id/complete
   └─> Service fee $20 → Admin wallet
   └─> Contractor payout $80 → Contractor wallet
   └─> Escrow released: $100 → $0
   └─> Job status → "completed"
   └─> Offer status → "completed"
   └─> Transactions: service_fee, contractor_payout

ALTERNATIVE: REJECTION/CANCELLATION
   └─> POST /api/job-request/offer/:offerId/reject
   └─> OR POST /api/job/:id/cancel
   └─> Full refund $105 → Customer wallet
   └─> Escrow released
   └─> Transaction: refund
```

## Database Models

### Wallet Model

```typescript
{
  user: ObjectId (unique),
  balance: Number,              // Available funds
  escrowBalance: Number,        // Funds in escrow
  currency: String,             // "USD"
  isActive: Boolean,
  isFrozen: Boolean,            // Admin security control
  totalEarnings: Number,        // Lifetime earnings
  totalSpent: Number,           // Lifetime spending
  totalWithdrawals: Number      // Lifetime withdrawals
}
```

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
  type: String,                 // platform_fee, service_fee, contractor_payout, refund, deposit, withdrawal, escrow_hold, escrow_release
  amount: Number,
  from: ObjectId,               // Sender user
  to: ObjectId,                 // Receiver user
  offer: ObjectId,              // Related offer
  job: ObjectId,                // Related job
  status: String,               // pending, completed, failed
  description: String,
  failureReason: String,
  completedAt: Date
}
```

## API Endpoints

### Wallet Management

- `GET /api/wallet` - Get wallet balance and details
- `POST /api/wallet/deposit` - Add money (manual, Stripe pending)
- `POST /api/wallet/withdraw` - Withdraw money (contractors only)
- `GET /api/wallet/transactions` - Transaction history with pagination

### Offer Management

- `POST /api/job-request/:applicationId/send-offer` - Customer sends offer
- `POST /api/job-request/offer/:offerId/accept` - Contractor accepts
- `POST /api/job-request/offer/:offerId/reject` - Contractor rejects

### Job Completion

- `PATCH /api/job/:id/status` - Update job status
- `POST /api/job/:id/complete` - Mark complete (releases payment)
- `POST /api/job/:id/cancel` - Cancel job (triggers refund)

## Business Rules

### Offer Rules

- One offer per job (enforced by unique index)
- Customer must have sufficient balance (budget + 5%)
- Job must be in "open" status to send offer
- Only offer recipient can accept/reject
- Offers expire after 7 days if not accepted

### Payment Rules

- Money moves to escrow immediately on offer send
- Platform fee released on offer acceptance
- Service fee and contractor payout released on job completion
- Full refund on offer rejection or job cancellation
- Contractors can only withdraw their available balance
- Wallets can be frozen by admin for security

### Transaction Rules

- All money movements create transaction records
- Transactions are atomic (MongoDB transactions)
- Transaction status: pending → completed/failed
- Complete audit trail maintained

## Stripe Integration (Future)

### Current Status

- ✅ Wallet system (manual deposits/withdrawals)
- ✅ Escrow-based offer system
- ✅ Commission calculation and distribution
- ✅ Transaction audit trail
- ❌ Stripe integration (pending)
- ❌ Real payment processing (pending)

### Planned Implementation

**Phase 1: Deposits**

- Stripe Payment Intents for credit card processing
- Customer deposits real money into wallet
- Webhook confirmation for payment success/failure

**Phase 2: Withdrawals**

- Stripe Connect for contractor accounts
- Bank transfers for contractor payouts
- KYC verification for contractors

**Phase 3: Webhooks**

- Payment confirmation webhooks
- Transfer completion webhooks
- Failure handling and notifications

### Stripe Resources

- Stripe MCP Power available for integration
- Documentation: `doc/payment/4.STRIPE_INTEGRATION.md` (to be created)
- Use Stripe MCP for latest Stripe API documentation

## Error Handling

### Common Errors

- "Insufficient balance. Required: $X, Available: $Y"
- "Job is not open for offers"
- "An offer already exists for this job"
- "Only contractors can withdraw funds"
- "Wallet is frozen. Please contact support."
- "Offer not found or already processed"

### Error Prevention

- Validate balance before offer send
- Check job status before operations
- Verify user roles and ownership
- Use MongoDB transactions for atomicity
- Implement idempotency (one offer per job)

## Testing

### Test Scenarios

1. Customer deposits money
2. Customer sends offer (check balance deduction)
3. Contractor accepts offer (check platform fee transfer)
4. Job completion (check service fee and payout)
5. Offer rejection (check full refund)
6. Job cancellation (check refund)
7. Insufficient balance handling
8. Duplicate offer prevention

### Test Data

- Customer with $200 balance
- Contractor with $0 balance
- Job with $100 budget
- Expected: Customer pays $105, contractor gets $80, admin gets $25

## Documentation

### Complete Guides

Located in `doc/payment/`:

1. **README.md** - Navigation hub and quick reference
2. **1.SYSTEM_OVERVIEW.md** - Business logic, architecture, money flow
3. **2.BACKEND_IMPLEMENTATION.md** - Database models, services, implementation
4. **3.FRONTEND_API_GUIDE.md** - API reference with React/Flutter examples
5. **REFERENCE.md** - Original detailed reference document

### Quick Reference

- Commission: 5% + 20% = 25% total
- Customer pays: Budget + 5%
- Contractor gets: Budget × 80%
- Admin gets: Budget × 25%
- One offer per job
- Escrow-based security

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
