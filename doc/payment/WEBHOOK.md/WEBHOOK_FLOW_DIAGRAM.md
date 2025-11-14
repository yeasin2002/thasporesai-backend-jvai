# Stripe Webhook Flow Diagrams

**Visual Guide to Webhook Integration**

---

## Table of Contents

1. [Deposit Flow with Webhooks](#deposit-flow-with-webhooks)
2. [Offer Acceptance Flow](#offer-acceptance-flow)
3. [Job Completion Flow](#job-completion-flow)
4. [Refund Flow](#refund-flow)
5. [Webhook Retry Logic](#webhook-retry-logic)

---

## Deposit Flow with Webhooks

### Without Webhooks (Current System)

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ Customer│                    │ Backend │                    │ Database │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ POST /api/wallet/deposit     │                              │
     │ { amount: 100 }              │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │                              │ Add $100 to wallet           │
     │                              ├─────────────────────────────>│
     │                              │                              │
     │                              │ Create transaction           │
     │                              ├─────────────────────────────>│
     │                              │                              │
     │ 200 OK                       │                              │
     │ { balance: 100 }             │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
     │ ⚠️ Problem: What if payment  │                              │
     │    actually failed in Stripe?│                              │
     │    User has $100 but Stripe  │                              │
     │    never charged them!       │                              │
     │                              │                              │
```

### With Webhooks (Recommended)

```
┌─────────┐     ┌─────────┐     ┌────────┐     ┌──────────┐     ┌──────────┐
│ Customer│     │ Backend │     │ Stripe │     │ Webhook  │     │ Database │
└────┬────┘     └────┬────┘     └───┬────┘     └────┬─────┘     └────┬─────┘
     │               │               │               │               │
     │ 1. POST /api/wallet/deposit   │               │               │
     │ { amount: 100 }               │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │               │ 2. Create Payment Intent      │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │ 3. Payment Intent Created     │               │
     │               │<──────────────┤               │               │
     │               │               │               │               │
     │               │ 4. Create transaction (pending)               │
     │               ├──────────────────────────────────────────────>│
     │               │               │               │               │
     │ 5. 200 OK     │               │               │               │
     │ { status: pending }           │               │               │
     │<──────────────┤               │               │               │
     │               │               │               │               │
     │               │               │ 6. Charge customer card       │
     │               │               │    (happens in background)    │
     │               │               │               │               │
     │               │               │ 7. POST /api/webhooks/stripe  │
     │               │               │ { type: payment_intent.succeeded }
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │               │               │               │ 8. Verify signature
     │               │               │               │               │
     │               │               │               │ 9. Update wallet
     │               │               │               ├──────────────>│
     │               │               │               │               │
     │               │               │               │ 10. Update transaction
     │               │               │               ├──────────────>│
     │               │               │               │               │
     │               │               │               │ 11. Send notification
     │               │               │               │               │
     │               │               │ 12. 200 OK    │               │
     │               │               │<──────────────┤               │
     │               │               │               │               │
     │ 13. Push notification         │               │               │
     │ "Deposit successful: $100"    │               │               │
     │<──────────────────────────────────────────────┤               │
     │               │               │               │               │
```

**Key Benefits**:
- ✅ Wallet only updated after Stripe confirms payment
- ✅ Customer notified of success/failure
- ✅ Transaction status accurately reflects reality
- ✅ No money added if payment fails

---

## Offer Acceptance Flow

### With Webhooks

```
┌───────────┐   ┌─────────┐   ┌────────┐   ┌──────────┐   ┌──────────┐
│Contractor │   │ Backend │   │ Stripe │   │ Webhook  │   │ Database │
└─────┬─────┘   └────┬────┘   └───┬────┘   └────┬─────┘   └────┬─────┘
      │              │             │             │             │
      │ 1. POST /api/job-request/offer/:id/accept             │
      ├─────────────>│             │             │             │
      │              │             │             │             │
      │              │ 2. Validate offer         │             │
      │              ├──────────────────────────────────────────>│
      │              │             │             │             │
      │              │ 3. Transfer platform fee ($5)           │
      │              │    to admin wallet        │             │
      │              ├──────────────────────────────────────────>│
      │              │             │             │             │
      │              │ 4. Update job status      │             │
      │              ├──────────────────────────────────────────>│
      │              │             │             │             │
      │ 5. 200 OK    │             │             │             │
      │ { offer: accepted }        │             │             │
      │<─────────────┤             │             │             │
      │              │             │             │             │
      │              │             │             │             │
      │ Note: If using Stripe for platform fee transfer:       │
      │              │             │             │             │
      │              │ 6. Create Transfer        │             │
      │              ├────────────>│             │             │
      │              │             │             │             │
      │              │             │ 7. POST /api/webhooks/stripe
      │              │             │ { type: transfer.created }│
      │              │             ├────────────>│             │
      │              │             │             │             │
      │              │             │             │ 8. Log transfer ID
      │              │             │             ├────────────>│
      │              │             │             │             │
      │              │             │ 9. 200 OK   │             │
      │              │             │<────────────┤             │
      │              │             │             │             │
```

---

## Job Completion Flow

### With Webhooks

```
┌──────────┐   ┌─────────┐   ┌────────┐   ┌──────────┐   ┌──────────┐
│ Customer │   │ Backend │   │ Stripe │   │ Webhook  │   │ Database │
└────┬─────┘   └────┬────┘   └───┬────┘   └────┬─────┘   └────┬─────┘
     │              │             │             │             │
     │ 1. POST /api/job/:id/complete           │             │
     ├─────────────>│             │             │             │
     │              │             │             │             │
     │              │ 2. Validate job           │             │
     │              ├──────────────────────────────────────────>│
     │              │             │             │             │
     │              │ 3. Transfer service fee ($20) to admin  │
     │              ├──────────────────────────────────────────>│
     │              │             │             │             │
     │              │ 4. Create Stripe Transfer ($80)         │
     │              │    to contractor          │             │
     │              ├────────────>│             │             │
     │              │             │             │             │
     │              │ 5. Transfer ID            │             │
     │              │<────────────┤             │             │
     │              │             │             │             │
     │              │ 6. Update offer & job     │             │
     │              ├──────────────────────────────────────────>│
     │              │             │             │             │
     │ 7. 200 OK    │             │             │             │
     │<─────────────┤             │             │             │
     │              │             │             │             │
     │              │             │ 8. POST /api/webhooks/stripe
     │              │             │ { type: transfer.paid }   │
     │              │             ├────────────>│             │
     │              │             │             │             │
     │              │             │             │ 9. Update contractor wallet
     │              │             │             ├────────────>│
     │              │             │             │             │
     │              │             │             │ 10. Update transaction
     │              │             │             ├────────────>│
     │              │             │             │             │
     │              │             │             │ 11. Send notification
     │              │             │             │    to contractor
     │              │             │             │             │
     │              │             │ 12. 200 OK  │             │
     │              │             │<────────────┤             │
     │              │             │             │             │
     │              │             │             │             │
     │ 13. Push notification to contractor      │             │
     │ "You received $80 for completing job"    │             │
     │              │             │             │             │
```

**What if transfer fails?**

```
     │              │             │             │             │
     │              │             │ 8. POST /api/webhooks/stripe
     │              │             │ { type: transfer.failed } │
     │              │             ├────────────>│             │
     │              │             │             │             │
     │              │             │             │ 9. Mark transaction failed
     │              │             │             ├────────────>│
     │              │             │             │             │
     │              │             │             │ 10. Return money to escrow
     │              │             │             ├────────────>│
     │              │             │             │             │
     │              │             │             │ 11. Alert admin
     │              │             │             │             │
     │              │             │ 12. 200 OK  │             │
     │              │             │<────────────┤             │
     │              │             │             │             │
```

---

## Refund Flow

### With Webhooks

```
┌───────────┐   ┌─────────┐   ┌────────┐   ┌──────────┐   ┌──────────┐
│Contractor │   │ Backend │   │ Stripe │   │ Webhook  │   │ Database │
└─────┬─────┘   └────┬────┘   └───┬────┘   └────┬─────┘   └────┬─────┘
      │              │             │             │             │
      │ 1. POST /api/job-request/offer/:id/reject             │
      ├─────────────>│             │             │             │
      │              │             │             │             │
      │              │ 2. Validate offer         │             │
      │              ├──────────────────────────────────────────>│
      │              │             │             │             │
      │              │ 3. Create Stripe Refund   │             │
      │              ├────────────>│             │             │
      │              │             │             │             │
      │              │ 4. Refund ID              │             │
      │              │<────────────┤             │             │
      │              │             │             │             │
      │              │ 5. Update offer status    │             │
      │              ├──────────────────────────────────────────>│
      │              │             │             │             │
      │              │ 6. Return money to wallet │             │
      │              ├──────────────────────────────────────────>│
      │              │             │             │             │
      │ 7. 200 OK    │             │             │             │
      │<─────────────┤             │             │             │
      │              │             │             │             │
      │              │             │ 8. POST /api/webhooks/stripe
      │              │             │ { type: charge.refunded } │
      │              │             ├────────────>│             │
      │              │             │             │             │
      │              │             │             │ 9. Confirm refund
      │              │             │             ├────────────>│
      │              │             │             │             │
      │              │             │             │ 10. Send notification
      │              │             │             │    to customer
      │              │             │             │             │
      │              │             │ 11. 200 OK  │             │
      │              │             │<────────────┤             │
      │              │             │             │             │
```

---

## Webhook Retry Logic

### Stripe's Automatic Retry

```
┌────────┐                                    ┌──────────┐
│ Stripe │                                    │ Backend  │
└───┬────┘                                    └────┬─────┘
    │                                              │
    │ 1. POST /api/webhooks/stripe                │
    │    { type: payment_intent.succeeded }       │
    ├────────────────────────────────────────────>│
    │                                              │
    │                                              │ ❌ Server down
    │                                              │    or error
    │                                              │
    │ 2. No response or 5xx error                 │
    │<─────────────────────────────────────────────┤
    │                                              │
    │ ⏱️ Wait 5 minutes                            │
    │                                              │
    │ 3. Retry #1                                  │
    ├────────────────────────────────────────────>│
    │                                              │
    │                                              │ ❌ Still failing
    │                                              │
    │ 4. No response or 5xx error                 │
    │<─────────────────────────────────────────────┤
    │                                              │
    │ ⏱️ Wait 30 minutes                           │
    │                                              │
    │ 5. Retry #2                                  │
    ├────────────────────────────────────────────>│
    │                                              │
    │                                              │ ✅ Server back up
    │                                              │
    │ 6. 200 OK                                    │
    │<─────────────────────────────────────────────┤
    │                                              │
```

**Retry Schedule**:
- Attempt 1: Immediate
- Attempt 2: 5 minutes later
- Attempt 3: 30 minutes later
- Attempt 4: 2 hours later
- Attempt 5: 6 hours later
- Attempt 6: 12 hours later
- Attempt 7: 24 hours later

**Total retry period**: Up to 3 days

### Handling Duplicate Events

```
┌────────┐                                    ┌──────────┐
│ Stripe │                                    │ Backend  │
└───┬────┘                                    └────┬─────┘
    │                                              │
    │ 1. POST /api/webhooks/stripe                │
    │    { id: "evt_123", type: "payment_intent.succeeded" }
    ├────────────────────────────────────────────>│
    │                                              │
    │                                              │ Check if event
    │                                              │ already processed
    │                                              │
    │                                              │ SELECT * FROM webhook_events
    │                                              │ WHERE stripe_event_id = 'evt_123'
    │                                              │
    │                                              │ ❌ Not found
    │                                              │
    │                                              │ Process event...
    │                                              │
    │                                              │ INSERT INTO webhook_events
    │                                              │ (stripe_event_id, processed_at)
    │                                              │
    │ 2. 200 OK                                    │
    │<─────────────────────────────────────────────┤
    │                                              │
    │ ⏱️ Network issue, Stripe retries             │
    │                                              │
    │ 3. POST /api/webhooks/stripe (DUPLICATE)    │
    │    { id: "evt_123", type: "payment_intent.succeeded" }
    ├────────────────────────────────────────────>│
    │                                              │
    │                                              │ Check if event
    │                                              │ already processed
    │                                              │
    │                                              │ SELECT * FROM webhook_events
    │                                              │ WHERE stripe_event_id = 'evt_123'
    │                                              │
    │                                              │ ✅ Found! Already processed
    │                                              │
    │                                              │ Skip processing
    │                                              │
    │ 4. 200 OK (idempotent)                      │
    │<─────────────────────────────────────────────┤
    │                                              │
```

---

## Error Handling Flow

### Payment Failure

```
┌─────────┐   ┌─────────┐   ┌────────┐   ┌──────────┐   ┌──────────┐
│ Customer│   │ Backend │   │ Stripe │   │ Webhook  │   │ Database │
└────┬────┘   └────┬────┘   └───┬────┘   └────┬─────┘   └────┬─────┘
     │             │             │             │             │
     │ 1. Attempt deposit        │             │             │
     ├────────────>│             │             │             │
     │             │             │             │             │
     │             │ 2. Create Payment Intent  │             │
     │             ├────────────>│             │             │
     │             │             │             │             │
     │             │             │ ❌ Card declined          │
     │             │             │             │             │
     │             │             │ 3. POST /api/webhooks/stripe
     │             │             │ { type: payment_intent.payment_failed }
     │             │             ├────────────>│             │
     │             │             │             │             │
     │             │             │             │ 4. Mark transaction failed
     │             │             │             ├────────────>│
     │             │             │             │             │
     │             │             │             │ 5. Reverse wallet balance
     │             │             │             │    (if added)
     │             │             │             ├────────────>│
     │             │             │             │             │
     │             │             │             │ 6. Send notification
     │             │             │             │             │
     │             │             │ 7. 200 OK   │             │
     │             │             │<────────────┤             │
     │             │             │             │             │
     │ 8. Push notification      │             │             │
     │ "Deposit failed: Card declined"         │             │
     │<────────────────────────────────────────┤             │
     │             │             │             │             │
```

---

## Summary

### Key Takeaways

1. **Webhooks are asynchronous**
   - Your API responds immediately
   - Stripe processes payment in background
   - Webhook confirms actual result

2. **Always verify signatures**
   - Prevents fake webhook attacks
   - Use `stripe.webhooks.constructEvent()`

3. **Implement idempotency**
   - Store processed event IDs
   - Skip duplicate events
   - Return 200 OK for duplicates

4. **Handle retries gracefully**
   - Stripe retries failed webhooks
   - Up to 3 days of retries
   - Always return 200 OK if processed

5. **Log everything**
   - Log all webhook events
   - Log processing results
   - Log errors with context

---

**Next Steps**: 
1. Implement webhook route
2. Test with Stripe CLI
3. Deploy to production
4. Monitor webhook delivery

For implementation details, see `STRIPE_WEBHOOK_GUIDE.md`.
