# Quick Reference - Payment & Bidding System

## Commission Breakdown

```
$1000 Offer Amount
├── $100 (10%) → Admin (when contractor accepts)
├── $200 (20%) → Admin (when job completes)
└── $700 (70%) → Contractor (when job completes)
```

## Status Flow

```
Job: open → assigned → in_progress → completed
Offer: pending → accepted/rejected
Payment: pending → captured → released
```

## Key Rules

1. **Job is `open`**: Customer can send multiple offers
2. **Contractor accepts**: Job becomes `assigned`, other offers rejected
3. **Job is `assigned`**: Customer CANNOT send more offers
4. **Job completes**: Payment released to contractor

## Critical Endpoints

### Customer Actions

- `POST /api/bidding/offer` - Send offer
- `POST /api/job/:jobId/complete` - Mark complete
- `GET /api/bidding/offers/sent` - View sent offers

### Contractor Actions

- `POST /api/bidding/offer/:offerId/accept` - Accept offer
- `POST /api/bidding/offer/:offerId/reject` - Reject offer
- `GET /api/bidding/offers/received` - View received offers
- `POST /api/wallet/connect-stripe` - Connect payout account

## Database Models Priority

1. **Offer** - Stores offer details and payment intent
2. **Payment** - Tracks payment lifecycle
3. **Transaction** - Audit trail for all money movements
4. **Wallet** - User balance tracking
5. **Job** (update) - Add `contractorId`, `offerId`, new status

## Stripe Operations

### Create Payment Intent (Offer)

```typescript
stripe.paymentIntents.create({
  amount: amount * 100,
  capture_method: "manual", // Don't charge yet
});
```

### Capture Payment (Accept)

```typescript
stripe.paymentIntents.capture(paymentIntentId);
```

### Transfer to Contractor (Complete)

```typescript
stripe.transfers.create({
  amount: payout * 100,
  destination: contractor.stripeAccountId,
});
```

### Refund (Reject)

```typescript
stripe.refunds.create({
  payment_intent: paymentIntentId,
});
```

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PLATFORM_FEE_PERCENT=10
SERVICE_FEE_PERCENT=20
PAYMENT_CURRENCY=USD
FRONTEND_URL=http://localhost:3000
```

## Common Validations

### Before Creating Offer

- ✅ Job exists and status is `open`
- ✅ Contractor applied to job
- ✅ No existing accepted offer for this job
- ✅ Customer owns the job

### Before Accepting Offer

- ✅ Offer exists and status is `pending`
- ✅ Contractor is the offer recipient
- ✅ Job is still `open`

### Before Completing Job

- ✅ Job status is `in_progress`
- ✅ Customer owns the job
- ✅ Payment exists and is `captured`
- ✅ Contractor has Stripe account connected

## Notification Types

- `booking_confirmed` - Offer accepted
- `booking_declined` - Offer rejected
- `payment_received` - Payment released to contractor
- `job_completed` - Job marked complete
- `general` - Other notifications

## Error Handling

```typescript
try {
  // Stripe operation
} catch (error: any) {
  if (error.type === "StripeCardError") {
    return sendError(res, 400, "Card declined");
  }
  // Log and return generic error
  console.error("Stripe error:", error);
  return sendInternalError(res, "Payment processing failed");
}
```

## Testing Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient: 4000 0000 0000 9995
```

## Module Structure

```
bidding/
├── bidding.route.ts
├── bidding.validation.ts
├── bidding.openapi.ts
└── services/
    ├── create-offer.service.ts
    ├── accept-offer.service.ts
    ├── reject-offer.service.ts
    └── ...
```

## Implementation Order

1. Database models (Offer, Payment, Transaction, Wallet)
2. Stripe service (`lib/stripe.ts`)
3. Bidding module (offer management)
4. Payment module (history, details)
5. Wallet module (balance, withdrawals)
6. Job updates (complete, cancel)
7. Webhook handler
8. Testing

## Security Checklist

- [ ] Verify user roles before actions
- [ ] Check resource ownership
- [ ] Validate offer status before processing
- [ ] Verify webhook signatures
- [ ] Use HTTPS in production
- [ ] Never store card details
- [ ] Log all transactions
- [ ] Implement rate limiting

## Monitoring Metrics

- Payment success rate
- Average offer amount
- Commission earnings
- Failed payment count
- Refund rate
- Jobs stuck in status

## Common Mistakes to Avoid

1. ❌ Forgetting to import OpenAPI file in route
2. ❌ Not validating offer status before processing
3. ❌ Allowing multiple offers after job assigned
4. ❌ Not handling Stripe errors properly
5. ❌ Forgetting to send notifications
6. ❌ Not logging transactions
7. ❌ Skipping webhook signature verification
8. ❌ Using live keys in development

## Quick Commands

```bash
# Generate module
bun run generate:module --module bidding

# Install dependencies
bun add stripe decimal.js

# Test webhook locally
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# Run development server
bun dev

# Check types
bun check-types
```

## Support Resources

- Stripe Docs: https://stripe.com/docs
- Project Docs: `doc/payment/`
- Kiro Steering: `.kiro/steering/payment-bidding-system.md`
- Existing Code: `src/api/job/`, `src/api/auth/`

---

**Remember**: This is your core revenue feature. Test thoroughly!
