# JobSphere Payment System Documentation

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Status**: Production Ready + Stripe Integration Guide

---

## Overview

This directory contains complete documentation for the JobSphere payment system, including the current wallet-based implementation and comprehensive guides for Stripe integration.

---

## Documentation Structure

### Core Documentation

**[1. Main Reference](./1.MAIN-REFERENCE.md)** - Complete System Overview
- System architecture and features
- Commission structure (5% + 20% = 25%)
- Payment flow diagrams
- API endpoints reference
- Data models
- User roles and permissions
- Error handling
- Testing guide
- Production deployment

**[2. Backend Implementation](./2.BACKEND_IMPLEMENTATION.md)** - Implementation Guide
- Database models (Wallet, Offer, Transaction)
- Payment configuration
- Wallet module services
- Offer module services
- Job completion logic
- Transaction management
- Error handling patterns

### Stripe Integration Documentation

**[3. Stripe Integration Guide](./3.STRIPE_INTEGRATION_GUIDE.md)** - Complete Integration Tutorial
- High-level overview
- Stripe APIs to use (Payment Intents, Connect, Transfers, Webhooks)
- Database schema updates
- Implementation roadmap (8 weeks)
- Detailed implementation steps with code
- Webhook implementation
- Testing guide with Stripe CLI

**[4. Stripe Integration Task List](./4.STRIPE_INTEGRATION_TASKLIST.md)** - Detailed Task Breakdown
- Phase 1: Setup & Configuration (3-5 days)
- Phase 2: Customer Deposits (5-7 days)
- Phase 3: Contractor Onboarding (3-4 days)
- Phase 4: Contractor Withdrawals (4-5 days)
- Phase 5: Security & Error Handling (2-3 days)
- Phase 6: Testing & QA (3-4 days)
- Phase 7: Production Deployment (2-3 days)
- Each task includes acceptance criteria and time estimates

**[5. Stripe Implementation Overview](./5.STRIPE_IMPLEMENTATION_OVERVIEW.md)** - High-Level Guide
- What you're building (current vs future state)
- Stripe APIs overview with use cases
- Route-by-route implementation instructions
- Data flow diagrams
- Key concepts (test mode, webhooks, idempotency)
- Common pitfalls and solutions
- Quick reference guide

---

## Quick Start

### For Understanding the Current System

1. Start with **[1. Main Reference](./1.MAIN-REFERENCE.md)** for complete overview
2. Review **[2. Backend Implementation](./2.BACKEND_IMPLEMENTATION.md)** for code details
3. Check existing code in:
   - `src/db/models/wallet.model.ts`
   - `src/db/models/offer.model.ts`
   - `src/db/models/transaction.model.ts`
   - `src/api/wallet/services/`
   - `src/api/offer/services/`

### For Implementing Stripe Integration

1. Read **[5. Stripe Implementation Overview](./5.STRIPE_IMPLEMENTATION_OVERVIEW.md)** first
2. Review **[3. Stripe Integration Guide](./3.STRIPE_INTEGRATION_GUIDE.md)** for detailed steps
3. Follow **[4. Stripe Integration Task List](./4.STRIPE_INTEGRATION_TASKLIST.md)** for execution
4. Reference **[1. Main Reference](./1.MAIN-REFERENCE.md)** for business logic

---

## Current System Summary

### Commission Structure

```
$100 Job Example:
├── Customer Pays: $105 (100 + 5% platform fee)
├── Platform Fee: $5 → Admin (when offer accepted)
├── Service Fee: $20 → Admin (when job completed)
└── Contractor Gets: $80 (when job completed)

Total Admin Commission: $25 (25%)
```

### Payment Flow

```
1. Customer deposits money → Wallet balance
2. Customer sends offer → Escrow hold ($105)
3. Contractor accepts → Platform fee to admin ($5)
4. Job in progress → Contractor works
5. Customer marks complete → Service fee to admin ($20), contractor gets $80
6. Alternative: Rejection/cancellation → Full refund
```

### Key Features

- **Wallet System**: Internal balance tracking with escrow
- **One Offer Per Job**: Simplified workflow
- **Automatic Commissions**: Platform and service fees calculated automatically
- **Transaction History**: Complete audit trail
- **Automatic Refunds**: On rejection or cancellation
- **Withdrawal Support**: Contractors can withdraw earnings

---

## Stripe Integration Summary

### What Changes

**Customer Deposits**:
- Current: Manual balance increase
- Future: Real credit card processing via Stripe Payment Intents
- Webhook confirms payment before updating balance

**Contractor Withdrawals**:
- Current: Manual balance decrease
- Future: Real bank transfers via Stripe Connect
- Contractors onboard through Stripe
- Money arrives in 2-3 business days

### Implementation Timeline

- **Total Duration**: 4-6 weeks (22-31 days)
- **Phase 1** (Setup): 3-5 days
- **Phase 2** (Deposits): 5-7 days
- **Phase 3** (Onboarding): 3-4 days
- **Phase 4** (Withdrawals): 4-5 days
- **Phase 5** (Security): 2-3 days
- **Phase 6** (Testing): 3-4 days
- **Phase 7** (Production): 2-3 days

### Stripe APIs Used

1. **Payment Intents API** - Customer deposits
2. **Connect API** - Contractor onboarding
3. **Transfers API** - Contractor withdrawals
4. **Webhooks API** - Event notifications

---

## Database Models

### Wallet Model
```typescript
{
  user: ObjectId,
  balance: Number,              // Available funds
  escrowBalance: Number,        // Funds in escrow
  pendingDeposits: Number,      // Awaiting confirmation (Stripe)
  currency: String,
  isActive: Boolean,
  isFrozen: Boolean,
  totalEarnings: Number,
  totalSpent: Number,
  totalWithdrawals: Number,
  lastStripeSync: Date          // Stripe integration
}
```

### Offer Model
```typescript
{
  job: ObjectId,
  customer: ObjectId,
  contractor: ObjectId,
  amount: Number,               // Job budget
  platformFee: Number,          // 5%
  serviceFee: Number,           // 20%
  contractorPayout: Number,     // 80%
  totalCharge: Number,          // 105%
  timeline: String,
  description: String,
  status: String,               // pending, accepted, rejected, etc.
  expiresAt: Date               // 7 days
}
```

### Transaction Model
```typescript
{
  type: String,                 // deposit, withdrawal, platform_fee, etc.
  amount: Number,
  from: ObjectId,
  to: ObjectId,
  offer: ObjectId,
  job: ObjectId,
  status: String,               // pending, completed, failed
  stripePaymentIntentId: String, // Stripe integration
  stripeTransferId: String,      // Stripe integration
  stripeStatus: String,          // Stripe integration
  description: String
}
```

### User Model (Stripe Fields)
```typescript
{
  // ... existing fields
  stripeCustomerId: String,      // For deposits
  stripeAccountId: String,       // For withdrawals
  stripeAccountStatus: String,   // pending, active, restricted
  stripeOnboardingComplete: Boolean
}
```

---

## API Endpoints

### Current Endpoints

**Wallet Management**:
- `GET /api/wallet` - Get wallet balance
- `POST /api/wallet/deposit` - Deposit money (manual → Stripe)
- `POST /api/wallet/withdraw` - Withdraw money (manual → Stripe)
- `GET /api/wallet/transactions` - Transaction history

**Offer Management**:
- `POST /api/offer/application/:applicationId/send` - Send offer
- `POST /api/offer/:offerId/accept` - Accept offer
- `POST /api/offer/:offerId/reject` - Reject offer

**Job Management**:
- `PATCH /api/job/:id/status` - Update job status
- `POST /api/job/:id/complete` - Mark complete (releases payment)
- `POST /api/job/:id/cancel` - Cancel job (triggers refund)

### New Endpoints (Stripe Integration)

**Stripe Webhooks**:
- `POST /api/webhooks/stripe` - Receive Stripe events

**Contractor Onboarding**:
- `POST /api/wallet/connect-account` - Create Stripe Connect account
- `GET /api/wallet/connect-account/status` - Check onboarding status

---

## Testing

### Current System Testing

**Test Scenario 1: Happy Path**
1. Customer deposits $200
2. Customer sends $100 offer
3. Contractor accepts offer
4. Job completed
5. Contractor receives $80, admin gets $25

**Test Scenario 2: Rejection**
1. Customer sends offer
2. Contractor rejects
3. Customer receives full refund

**Test Scenario 3: Cancellation**
1. Offer accepted
2. Customer cancels job
3. Customer receives refund

### Stripe Integration Testing

**Test Cards**:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

**Stripe CLI**:
```bash
# Forward webhooks
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# Trigger events
stripe trigger payment_intent.succeeded
stripe trigger transfer.paid
```

**Test Data**:
- SSN: `000-00-0000`
- Bank Account: `000123456789`
- Routing: `110000000`

---

## Key Files

### Database Models
- `src/db/models/wallet.model.ts`
- `src/db/models/offer.model.ts`
- `src/db/models/transaction.model.ts`
- `src/db/models/user.model.ts`

### Services
- `src/api/wallet/services/deposit.service.ts`
- `src/api/wallet/services/withdraw.service.ts`
- `src/api/wallet/services/get-wallet.service.ts`
- `src/api/wallet/services/get-transactions.service.ts`
- `src/api/offer/services/send-offer.service.ts`
- `src/api/offer/services/accept-offer.service.ts`
- `src/api/offer/services/reject-offer.service.ts`
- `src/api/job/services/complete-job.service.ts`
- `src/api/job/services/cancel-job.service.ts`

### Configuration
- `src/common/payment-config.ts`
- `src/lib/stripe.ts` (to be created)

### Routes
- `src/api/wallet/wallet.route.ts`
- `src/api/offer/offer.route.ts`
- `src/api/webhooks/webhook.route.ts` (to be created)

---

## Environment Variables

### Current
```env
# Database
MONGODB_URI=mongodb://...

# JWT
ACCESS_SECRET=...
REFRESH_SECRET=...
```

### Stripe Integration (Add These)
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

---

## Common Issues & Solutions

### Issue 1: Insufficient Balance
**Error**: "Insufficient balance. Required: $X, Available: $Y"  
**Solution**: Customer needs to deposit more money

### Issue 2: Offer Already Exists
**Error**: "An offer already exists for this job"  
**Solution**: One offer per job rule - reject or cancel existing offer first

### Issue 3: Job Not Open
**Error**: "Job is not open for offers"  
**Solution**: Job must be in "open" status to send offers

### Issue 4: Wallet Frozen
**Error**: "Wallet is frozen. Please contact support."  
**Solution**: Admin must unfreeze wallet

### Issue 5: Stripe Webhook Signature Failed (Future)
**Error**: "Webhook signature verification failed"  
**Solution**: Check webhook secret, ensure raw body is used

---

## Best Practices

### Security
- Always validate input with Zod schemas
- Verify resource ownership before operations
- Use MongoDB transactions for atomic operations
- Verify Stripe webhook signatures
- Never expose Stripe secret keys

### Performance
- Use atomic operations for balance updates
- Index Stripe ID fields
- Implement pagination for transaction history
- Cache wallet balances when appropriate

### Error Handling
- Use try-catch in all service handlers
- Log errors with context
- Return user-friendly error messages
- Rollback on Stripe errors

### Testing
- Test all payment flows end-to-end
- Use Stripe test mode extensively
- Test webhook handling with Stripe CLI
- Test error scenarios and edge cases

---

## Support & Resources

### Internal Documentation
- [1. Main Reference](./1.MAIN-REFERENCE.md)
- [2. Backend Implementation](./2.BACKEND_IMPLEMENTATION.md)
- [3. Stripe Integration Guide](./3.STRIPE_INTEGRATION_GUIDE.md)
- [4. Stripe Integration Task List](./4.STRIPE_INTEGRATION_TASKLIST.md)
- [5. Stripe Implementation Overview](./5.STRIPE_IMPLEMENTATION_OVERVIEW.md)

### Stripe Documentation
- Payment Intents: https://stripe.com/docs/payments/payment-intents
- Connect: https://stripe.com/docs/connect
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

### Stripe Tools
- Dashboard: https://dashboard.stripe.com
- CLI: https://stripe.com/docs/stripe-cli
- API Reference: https://stripe.com/docs/api

---

## Changelog

### Version 1.0.0 (January 24, 2026)
- ✅ Complete payment system documentation
- ✅ Stripe integration guides created
- ✅ Task list with time estimates
- ✅ Implementation overview with diagrams
- ✅ Route-by-route instructions
- ✅ Common pitfalls documented
- ✅ Testing guides included

### Previous Versions
- Initial wallet system implementation
- Offer system with escrow
- Transaction history
- Automatic refunds
- Commission calculation

---

## Next Steps

1. **Understand Current System**: Read documents 1 and 2
2. **Plan Stripe Integration**: Review documents 3, 4, and 5
3. **Set Up Development Environment**: Create Stripe account, get test keys
4. **Start Implementation**: Follow task list in document 4
5. **Test Thoroughly**: Use Stripe CLI and test cards
6. **Deploy to Production**: Follow production deployment guide

---

**For questions or support, contact the development team.**

**Last Updated**: January 24, 2026  
**Maintained By**: JobSphere Backend Team
