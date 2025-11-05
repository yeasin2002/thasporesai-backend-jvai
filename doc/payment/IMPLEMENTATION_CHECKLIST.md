# Implementation Checklist

## Overview

This checklist guides you through implementing the complete payment and bidding system.

---

## Phase 1: Database Setup

### Create New Models

- [ ] **Offer Model** (`src/db/models/offer.model.ts`)
  - [ ] Define schema with all fields
  - [ ] Add indexes
  - [ ] Add validation
  - [ ] Export model

- [ ] **Payment Model** (`src/db/models/payment.model.ts`)
  - [ ] Define schema
  - [ ] Add indexes
  - [ ] Export model

- [ ] **Transaction Model** (`src/db/models/transaction.model.ts`)
  - [ ] Define schema
  - [ ] Add indexes
  - [ ] Export model

- [ ] **Wallet Model** (`src/db/models/wallet.model.ts`)
  - [ ] Define schema
  - [ ] Add indexes
  - [ ] Export model

### Update Existing Models

- [ ] **Job Model** (`src/db/models/job.model.ts`)
  - [ ] Add `contractorId` field
  - [ ] Add `offerId` field
  - [ ] Update status enum to include `assigned`
  - [ ] Add `assignedAt`, `completedAt`, `cancelledAt` fields
  - [ ] Add indexes

### Register Models

- [ ] Update `src/db/index.ts`
  - [ ] Import all new models
  - [ ] Export in `db` object
  ```typescript
  export const db = {
    // ... existing models
    offer: Offer,
    payment: Payment,
    transaction: Transaction,
    wallet: Wallet,
  };
  ```

---

## Phase 2: Stripe Setup

### Stripe Account

- [ ] Create Stripe account
- [ ] Complete business verification
- [ ] Get API keys (test mode)
- [ ] Enable Stripe Connect
- [ ] Configure webhook endpoint

### Environment Variables

- [ ] Add to `.env`:
  ```env
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  PLATFORM_FEE_PERCENT=10
  SERVICE_FEE_PERCENT=20
  PAYMENT_CURRENCY=USD
  ```

### Install Dependencies

- [ ] Run: `bun add stripe decimal.js`
- [ ] Update `package.json`

---

## Phase 3: Bidding Module

### Create Module Structure

```
src/api/bidding/
├── bidding.route.ts
├── bidding.validation.ts
├── bidding.openapi.ts
└── services/
    ├── index.ts
    ├── create-offer.service.ts
    ├── get-sent-offers.service.ts
    ├── get-received-offers.service.ts
    ├── get-offer-details.service.ts
    ├── accept-offer.service.ts
    ├── reject-offer.service.ts
    └── cancel-offer.service.ts
```

### Validation Schemas

- [ ] Create `bidding.validation.ts`
  - [ ] `CreateOfferSchema`
  - [ ] `OfferIdParamSchema`
  - [ ] `RejectOfferSchema`
  - [ ] `SearchOffersSchema`
  - [ ] Response schemas

### Services

- [ ] **create-offer.service.ts**
  - [ ] Validate job is open
  - [ ] Validate contractor applied
  - [ ] Create Stripe Payment Intent
  - [ ] Create Offer document
  - [ ] Send notification

- [ ] **accept-offer.service.ts**
  - [ ] Validate offer is pending
  - [ ] Capture Stripe payment
  - [ ] Calculate fees
  - [ ] Update Offer status
  - [ ] Update Job (status, contractorId)
  - [ ] Create Payment record
  - [ ] Create Transactions
  - [ ] Update Admin wallet
  - [ ] Reject other offers
  - [ ] Send notifications

- [ ] **reject-offer.service.ts**
  - [ ] Update Offer status
  - [ ] Refund via Stripe
  - [ ] Send notification

- [ ] **cancel-offer.service.ts**
  - [ ] Validate offer is pending
  - [ ] Refund via Stripe
  - [ ] Update Offer status

- [ ] **get-sent-offers.service.ts**
  - [ ] Query offers by customer
  - [ ] Populate job and contractor
  - [ ] Pagination

- [ ] **get-received-offers.service.ts**
  - [ ] Query offers by contractor
  - [ ] Populate job and customer
  - [ ] Pagination

- [ ] **get-offer-details.service.ts**
  - [ ] Get single offer
  - [ ] Populate all fields
  - [ ] Authorization check

### Routes

- [ ] Update `bidding.route.ts`
  - [ ] POST `/offer` - Create offer
  - [ ] GET `/offers/sent` - Get sent offers
  - [ ] GET `/offers/received` - Get received offers
  - [ ] GET `/offer/:offerId` - Get offer details
  - [ ] POST `/offer/:offerId/accept` - Accept offer
  - [ ] POST `/offer/:offerId/reject` - Reject offer
  - [ ] DELETE `/offer/:offerId` - Cancel offer

### OpenAPI Documentation

- [ ] Create `bidding.openapi.ts`
  - [ ] Register all schemas
  - [ ] Register all paths
  - [ ] Add descriptions and examples

### Register Module

- [ ] Update `src/app.ts`
  ```typescript
  import { bidding } from "@/api/bidding/bidding.route";
  app.use("/api/bidding", bidding);
  ```

---

## Phase 4: Payment Module

### Create Module Structure

```
src/api/payment/
├── payment.route.ts
├── payment.validation.ts
├── payment.openapi.ts
└── services/
    ├── index.ts
    ├── get-payment-history.service.ts
    ├── get-payment-details.service.ts
    └── request-refund.service.ts
```

### Services

- [ ] **get-payment-history.service.ts**
  - [ ] Query payments by user
  - [ ] Filter by type (sent/received)
  - [ ] Pagination

- [ ] **get-payment-details.service.ts**
  - [ ] Get single payment
  - [ ] Populate all fields
  - [ ] Authorization check

- [ ] **request-refund.service.ts**
  - [ ] Create refund request
  - [ ] Notify admin

### Routes

- [ ] POST `/history` - Get payment history
- [ ] GET `/:paymentId` - Get payment details
- [ ] POST `/:paymentId/refund` - Request refund

### Register Module

- [ ] Update `src/app.ts`

---

## Phase 5: Wallet Module

### Create Module Structure

```
src/api/wallet/
├── wallet.route.ts
├── wallet.validation.ts
├── wallet.openapi.ts
└── services/
    ├── index.ts
    ├── get-wallet.service.ts
    ├── get-transactions.service.ts
    ├── connect-stripe.service.ts
    └── request-withdrawal.service.ts
```

### Services

- [ ] **get-wallet.service.ts**
  - [ ] Get or create wallet
  - [ ] Return balance and details

- [ ] **get-transactions.service.ts**
  - [ ] Query transactions by user
  - [ ] Filter by type
  - [ ] Pagination

- [ ] **connect-stripe.service.ts**
  - [ ] Create Stripe Connect account
  - [ ] Generate account link
  - [ ] Update wallet

- [ ] **request-withdrawal.service.ts**
  - [ ] Validate balance
  - [ ] Create Stripe transfer
  - [ ] Update wallet
  - [ ] Create transaction

### Routes

- [ ] GET `/` - Get wallet
- [ ] GET `/transactions` - Get transactions
- [ ] POST `/connect-stripe` - Connect Stripe
- [ ] POST `/withdraw` - Request withdrawal

### Register Module

- [ ] Update `src/app.ts`

---

## Phase 6: Stripe Service

### Create Stripe Service

- [ ] Create `src/lib/stripe.ts`
  - [ ] Initialize Stripe
  - [ ] `createPaymentIntent()`
  - [ ] `capturePayment()`
  - [ ] `refundPayment()`
  - [ ] `createTransfer()`
  - [ ] `createConnectAccount()`
  - [ ] `createAccountLink()`

### Webhook Handler

- [ ] Create `src/api/webhooks/stripe.route.ts`
  - [ ] Verify signature
  - [ ] Handle events:
    - [ ] `payment_intent.succeeded`
    - [ ] `payment_intent.payment_failed`
    - [ ] `transfer.created`
    - [ ] `transfer.failed`
    - [ ] `account.updated`
    - [ ] `charge.refunded`

### Register Webhook

- [ ] Update `src/app.ts`
  ```typescript
  app.use("/api/webhooks/stripe", stripeWebhook);
  ```

---

## Phase 7: Job Module Updates

### Update Job Services

- [ ] **complete-job.service.ts** (new)
  - [ ] Validate job is in_progress
  - [ ] Calculate service fee
  - [ ] Calculate contractor payout
  - [ ] Update Job status
  - [ ] Create Transactions
  - [ ] Update Wallets
  - [ ] Transfer to contractor
  - [ ] Send notifications

- [ ] **cancel-job.service.ts** (new)
  - [ ] Determine refund amount
  - [ ] Process refund
  - [ ] Update Job status
  - [ ] Send notifications

### Update Job Routes

- [ ] Add to `job.route.ts`
  - [ ] POST `/:jobId/complete` - Mark complete
  - [ ] POST `/:jobId/cancel` - Cancel job

---

## Phase 8: Admin Module

### Create Admin Endpoints

- [ ] GET `/admin/earnings` - Commission earnings
- [ ] GET `/admin/payments` - All payments
- [ ] POST `/admin/refund/:refundId/review` - Review refund
- [ ] GET `/admin/wallets` - All wallets
- [ ] POST `/admin/wallet/:walletId/freeze` - Freeze wallet

---

## Phase 9: Testing

### Unit Tests

- [ ] Test Offer creation
- [ ] Test Offer acceptance
- [ ] Test Offer rejection
- [ ] Test Payment capture
- [ ] Test Refund processing
- [ ] Test Wallet operations
- [ ] Test Transaction creation

### Integration Tests

- [ ] Test complete flow (offer → accept → complete)
- [ ] Test cancellation flow
- [ ] Test refund flow
- [ ] Test Stripe webhook handling

### Manual Testing

- [ ] Create offer with test card
- [ ] Accept offer
- [ ] Complete job
- [ ] Verify payments
- [ ] Test refunds
- [ ] Test withdrawals

---

## Phase 10: Deployment

### Pre-Deployment

- [ ] Switch to live Stripe keys
- [ ] Configure live webhooks
- [ ] Test with real cards (small amounts)
- [ ] Set up monitoring
- [ ] Configure alerts

### Deployment

- [ ] Deploy to production
- [ ] Verify webhook endpoint
- [ ] Test critical flows
- [ ] Monitor for errors

### Post-Deployment

- [ ] Monitor transactions
- [ ] Check webhook delivery
- [ ] Verify commission calculations
- [ ] Review error logs

---

## Phase 11: Documentation

- [ ] Update API documentation
- [ ] Create user guides
- [ ] Document admin procedures
- [ ] Create troubleshooting guide

---

## Verification Checklist

### Functionality

- [ ] Customer can send offer
- [ ] Contractor can accept/reject offer
- [ ] Payment captured on acceptance
- [ ] Job assigned correctly
- [ ] Other offers rejected automatically
- [ ] Customer cannot send more offers
- [ ] Job completion triggers payment release
- [ ] Fees calculated correctly (10% + 20%)
- [ ] Contractor receives 70%
- [ ] Refunds work correctly
- [ ] Wallets update properly
- [ ] Transactions recorded
- [ ] Notifications sent

### Security

- [ ] Authentication required
- [ ] Authorization checks
- [ ] Input validation
- [ ] Stripe signature verification
- [ ] SQL injection prevention
- [ ] XSS prevention

### Performance

- [ ] Database indexes created
- [ ] Queries optimized
- [ ] Pagination implemented
- [ ] Rate limiting configured

### Monitoring

- [ ] Error logging
- [ ] Transaction logging
- [ ] Webhook logging
- [ ] Performance metrics

---

## Common Issues & Solutions

### Issue: Payment capture fails

**Solution**: Check Stripe logs, verify card details, ensure sufficient funds

### Issue: Webhook not received

**Solution**: Verify webhook URL, check Stripe dashboard, test with Stripe CLI

### Issue: Duplicate offers accepted

**Solution**: Implement optimistic locking, use database transactions

### Issue: Wallet balance incorrect

**Solution**: Verify transaction records, check for race conditions

---

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- Project documentation in `doc/payment/`
- Team Slack channel

---

## Estimated Timeline

- Phase 1-2: 2 days (Database & Stripe setup)
- Phase 3: 3 days (Bidding module)
- Phase 4-5: 2 days (Payment & Wallet modules)
- Phase 6: 2 days (Stripe service & webhooks)
- Phase 7-8: 2 days (Job & Admin updates)
- Phase 9: 3 days (Testing)
- Phase 10-11: 2 days (Deployment & Documentation)

**Total**: ~16 days

---

## Notes

- Test thoroughly in development before production
- Use Stripe test mode for all development
- Keep commission rates configurable
- Document all edge cases
- Monitor system closely after launch
