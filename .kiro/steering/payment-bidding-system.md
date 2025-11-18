# Payment & Offer System

## Overview

Wallet-based payment system with escrow for secure job transactions. Customers send offers to contractors, payments are held in escrow, and released upon job completion.

## Architecture

### Core Modules
1. **Offer Module** (`/api/offer`) - Offer management (send, accept, reject)
2. **Wallet Module** (`/api/wallet`) - Balance and transaction management
3. **Job Module** (`/api/job`) - Job lifecycle and completion
4. **Transaction System** - Audit trail for all money movements

### Commission Structure

```
Job Budget: $100
├── Platform Fee (5%) → $5 (charged on offer acceptance)
├── Service Fee (20%) → $20 (charged on job completion)
└── Contractor Payout (80%) → $80 (released on job completion)

Total Customer Pays: $105 (budget + platform fee)
Admin Total: $25 (5% + 20%)
```

## Payment Flow

### 1. Job Posting & Application
- Customer posts job (status: `open`)
- Contractors apply via `/api/job-request`
- Customer reviews applications

### 2. Offer Creation
- Customer sends offer via `POST /api/offer/send`
- Wallet charged: job budget + 5% platform fee
- Offer status: `pending`
- Notification sent to contractor

### 3. Offer Decision

**Accept**:
- Contractor accepts via `POST /api/offer/:id/accept`
- Platform fee (5%) → Admin wallet
- Remaining amount → Escrow
- Job status → `assigned`
- One offer per job (enforced)

**Reject**:
- Contractor rejects via `POST /api/offer/:id/reject`
- Full refund to customer wallet
- Offer status → `rejected`

### 4. Work Execution
- Job status → `in_progress`
- Chat communication enabled
- Contractor completes work

### 5. Job Completion
- Customer marks complete via `POST /api/job/:id/complete`
- Service fee (20%) → Admin wallet
- Contractor payout (80%) → Contractor wallet
- Job status → `completed`
- Transaction records created

## Key Models

### Offer
- Job, customer, contractor references
- Amount breakdown: amount, platformFee, serviceFee, contractorPayout, totalCharge
- Status: pending/accepted/rejected/cancelled/completed/expired
- Timeline, description, timestamps
- **Unique index**: One offer per job

### Wallet
- User reference, balance, escrowBalance
- Total earnings, spent, withdrawals
- Status: isActive, isFrozen

### Transaction
- Type: platform_fee, service_fee, contractor_payout, refund, deposit, withdrawal, escrow_hold, escrow_release
- Amount, from/to users, offer/job references
- Status: pending/completed/failed


### Job Model Extensions
- `contractorId`, `offerId` - Track assigned contractor and accepted offer
- `status` - Job lifecycle state
- `assignedAt`, `completedAt`, `cancelledAt` - Timestamps
- `cancellationReason` - Audit trail

## API Endpoints

### Offer Module (`/api/offer`)
- `POST /send` - Customer sends offer
- `POST /:id/accept` - Contractor accepts
- `POST /:id/reject` - Contractor rejects

### Wallet Module (`/api/wallet`)
- `GET /` - Get balance
- `POST /deposit` - Add funds
- `POST /withdraw` - Withdraw (contractors only)
- `GET /transactions` - Transaction history

### Job Module (`/api/job`)
- `POST /:id/complete` - Mark complete (triggers payment release)
- `POST /:id/cancel` - Cancel job (triggers refund)
- `PATCH /:id/status` - Update status

## Future: Stripe Integration
- Payment intent creation with manual capture
- Stripe Connect for contractor payouts
- Webhook handling for payment events
- Refund processing

## Job Lifecycle

### Status Transitions
```
open → assigned → in_progress → completed
  ↓                                  ↓
cancelled ←─────────────────────────┘
```

### Status Rules
- **open**: Public, contractors can apply, customer can send offers
- **assigned**: Hidden, one offer accepted, contractor assigned
- **in_progress**: Work in progress, chat enabled
- **completed**: Terminal, payment released, review enabled
- **cancelled**: Terminal, refund processed

### Offer Constraints
- **One offer per job** (unique index enforced)
- When job assigned: No new offers, other applications rejected
- Offer expiration: Auto-expire after configurable period

## Implementation Notes

### Service Layer Pattern
- Each action in separate service file (e.g., `accept-offer.service.ts`)
- Use `db` object for database access
- Standard response format via helpers
- Transaction creation for audit trail
- Notification sending for all state changes

### Key Business Logic
1. **Send Offer**: Validate wallet balance, charge customer, create offer, notify contractor
2. **Accept Offer**: Transfer platform fee, hold escrow, update job status, reject other offers
3. **Reject Offer**: Refund customer, update offer status, notify customer
4. **Complete Job**: Transfer service fee, release contractor payout, update job status
5. **Cancel Job**: Calculate refund, process refund, update job status

### Security & Validation
- Role-based authorization (customer/contractor/admin)
- Wallet balance checks before transactions
- Job status validation before state changes
- One offer per job enforcement
- Frozen wallet checks

## Edge Cases & Best Practices

### Common Scenarios
1. **Multiple Offers**: Prevented by unique index on job
2. **Payment Failures**: Rollback offer status, notify customer
3. **Cancellations**: Refund logic based on job status
4. **Disputes**: Admin review with evidence
5. **Abandoned Jobs**: Customer reports, admin handles

### Best Practices
- Validate offer status before processing
- Check wallet balance before deductions
- Create transaction records for audit trail
- Send notifications at every state change
- Use database transactions for atomic operations
- Keep commission rates configurable
- Log all errors for monitoring

## Related Documentation
- Implementation details: `doc/bidding-payment-details/`
- API design: `doc/payment/API_DESIGN.md`
- Database schema: `doc/payment/DATABASE_SCHEMA.md`
