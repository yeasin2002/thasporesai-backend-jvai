# Implementation Tasks: Stripe Payment Integration (MVP)

## Overview

Minimal MVP implementation focused on core payment functionality. Manual testing only - no unit tests. Fast delivery focused on getting payment system working.

## Task List

### Phase 1: Database Schema Updates

- [x] 1. Update Wallet Model
  - Remove `escrowBalance` field
  - Add `stripeCustomerId` field (string, nullable, sparse index)
  - Add `stripeConnectAccountId` field (string, nullable, sparse index)
  - Update TypeScript interface

- [x] 2. Update Transaction Model
  - Add `stripePaymentIntentId`, `stripeTransferId`, `stripeCheckoutSessionId` fields
  - Update transaction type enum: add `wallet_transfer`, `contractor_payout`, remove `escrow_hold`, `escrow_release`, `platform_fee`, `service_fee`
  - Update TypeScript interface

- [x] 3. Create CompletionRequest Model
  - Create schema with fields: job, offer, customer, contractor, status, approvedBy, rejectedBy, rejectionReason, timestamps
  - Add indexes: job (unique), status + createdAt (compound)
  - Register in db/index.ts

- [x] 4. Create WithdrawalRequest Model
  - Create schema with fields: contractor, amount, status, approvedBy, rejectedBy, rejectionReason, stripeTransferId, timestamps
  - Add indexes: contractor + status + createdAt, status + createdAt
  - Register in db/index.ts

### Phase 2: Stripe Setup

- [x] 5. Configure Stripe SDK
  - Install stripe package
  - Create src/lib/stripe.ts with Stripe initialization
  - Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env.example

- [-] 6. Create Stripe Helper Services
  - Create Stripe Checkout Session helper (returns URL)
  - Create Stripe Connect account helper (create/retrieve account)
  - Create Stripe Connect onboarding link helper
  - Create Stripe Connect transfer helper
  - Create Stripe Connect status check helper

### Phase 3: Core Payment Endpoints

- [~] 7. Implement Deposit Flow
  - POST /api/wallet/deposit: Create Checkout Session, return URL
  - POST /api/webhooks/stripe: Verify signature, handle checkout.session.completed, update wallet balance, create transaction record
  - GET /api/wallet: Return wallet balance and Stripe Connect status
  - GET /api/wallet/transactions: Return paginated transaction history

- [~] 8. Update Offer Endpoints
  - Update POST /api/job-request/:applicationId/send-offer: Calculate commissions, validate balance (no deduction), create offer with expiresAt
  - Update POST /api/job-request/offer/:offerId/accept: MongoDB transaction to transfer funds (customer → admin), update job/offer status
  - Update POST /api/job-request/offer/:offerId/reject: If accepted, MongoDB transaction to refund (admin → customer), update status

- [~] 9. Implement Job Completion Flow
  - POST /api/job/:id/complete: Create CompletionRequest with status "pending"
  - POST /api/admin/completion-requests/:id/approve: MongoDB transaction (admin → contractor), initiate Stripe Connect transfer, update job/offer status
  - POST /api/admin/completion-requests/:id/reject: Update request status, send notification
  - Update POST /api/job/:id/cancel: If offer accepted, MongoDB transaction to refund (admin → customer)

### Phase 4: Admin Approval System

- [~] 10. Implement Admin Endpoints
  - GET /api/admin/completion-requests: Return paginated completion requests with filters
  - GET /api/admin/withdrawal-requests: Return paginated withdrawal requests with filters
  - POST /api/admin/withdrawal-requests/:id/approve: MongoDB transaction (deduct from contractor), initiate Stripe Connect transfer
  - POST /api/admin/withdrawal-requests/:id/reject: Update request status, send notification

### Phase 5: Contractor Withdrawal & Connect

- [~] 11. Implement Withdrawal & Connect
  - POST /api/wallet/withdraw: Validate contractor role, balance, Connect account, create WithdrawalRequest
  - POST /api/wallet/stripe/onboard: Create/retrieve Connect account, generate onboarding link, return URL
  - GET /api/wallet/stripe/status: Query Stripe API, return account status and requirements

### Phase 6: Cron Job

- [~] 12. Implement Offer Expiration
  - Create src/jobs/expire-offers.ts cron job (runs hourly)
  - Query expired accepted offers
  - For each: MongoDB transaction to refund (admin → customer), update offer status to "expired", send notifications

### Phase 7: Validation & Documentation

- [~] 13. Add Validation & OpenAPI
  - Add Zod validation schemas for all new/updated endpoints
  - Add OpenAPI documentation for all endpoints
  - Update existing validation schemas where needed

### Phase 8: Deployment Setup

- [~] 14. Configure Stripe Dashboard
  - Set up webhook endpoint in Stripe Dashboard
  - Configure webhook events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed
  - Set up Stripe Connect settings
  - Test with Stripe CLI in development

## Manual Testing Checklist

After implementation, manually test these flows:

1. **Deposit Flow**: Create deposit → Open Checkout URL in browser → Complete payment → Verify webhook updates wallet
2. **Offer Flow**: Send offer (balance validation) → Accept offer (DB wallet transfer) → Verify balances updated
3. **Completion Flow**: Mark complete → Admin approves → Verify DB update + Stripe transfer initiated
4. **Rejection Flow**: Reject accepted offer → Verify refund in DB
5. **Cancellation Flow**: Cancel job with accepted offer → Verify refund in DB
6. **Withdrawal Flow**: Request withdrawal → Admin approves → Verify Stripe transfer
7. **Connect Flow**: Onboard contractor → Check status → Verify account verified
8. **Expiration Flow**: Create expired offer → Run cron → Verify refund

## Notes

- All MongoDB transactions must have proper error handling and rollback
- All Stripe API calls must have error handling
- Use Stripe test mode keys for development
- Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:4000/api/webhooks/stripe`
- Manual testing only - no automated tests for MVP
