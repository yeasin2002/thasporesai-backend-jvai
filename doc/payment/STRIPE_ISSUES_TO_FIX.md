# Stripe Integration - Issues to Fix

**Created**: January 25, 2026  
**Status**: Action Required  
**Source**: STRIPE_INTEGRATION_REVIEW.md

---

## 🚨 Priority 1: CRITICAL (Fix Immediately)

### ✅ Issue 1.1: API Version Using Preview Release (FIXED)

**Status**: ✅ FIXED on January 25, 2026

**File**: `src/lib/stripe.ts`

**Problem**: Using preview API version `2025-10-29.clover` which is not stable for production

**Solution Applied**:
```typescript
// @ts-expect-error - Using stable API version instead of preview version from types
apiVersion: "2024-12-18.acacia"
```

**Verification Required**:
- [ ] Test all Stripe endpoints with stable version
- [ ] Verify webhook events work correctly
- [ ] Test in staging environment

**Documentation**: See `doc/payment/STRIPE_API_VERSION_FIX.md`

---

### ✅ Issue 1.2: Missing Webhook Event Handlers

**Status**:  FIXED

**File**: `src/api/webhooks/services/stripe-webhook.service.ts`

**Problem**: Missing handlers for important payment lifecycle events

**Missing Events**:
1. `payment_intent.processing` - Payment is being processed
2. `payment_intent.requires_action` - Requires customer action (3DS)
3. `charge.refunded` - Payment was refunded
4. `customer.updated` - Customer information changed
5. `transfer.created` - Transfer initiated
6. `transfer.updated` - Transfer status changed

**Current Code**:
```typescript
switch (event.type) {
  case "payment_intent.succeeded": ✅
  case "payment_intent.payment_failed": ✅
  case "payment_intent.canceled": ✅
  case "account.updated": ✅
  case "transfer.reversed": ✅
  // Missing events listed above ❌
}
```

**Required Fix**:
```typescript
switch (event.type) {
  // ... existing cases ...
  
  case "payment_intent.processing":
    await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
    break;
    
  case "payment_intent.requires_action":
    await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
    break;
    
  case "charge.refunded":
    await handleChargeRefunded(event.data.object as Stripe.Charge);
    break;
    
  case "customer.updated":
    await handleCustomerUpdated(event.data.object as Stripe.Customer);
    break;
    
  case "transfer.created":
    console.log(`💸 Transfer created: ${(event.data.object as Stripe.Transfer).id}`);
    // Update transaction status to "processing"
    break;
    
  case "transfer.updated":
    await handleTransferUpdated(event.data.object as Stripe.Transfer);
    break;
}
```

**Action Items**:
- [ ] Implement `handlePaymentIntentProcessing` function
- [ ] Implement `handlePaymentIntentRequiresAction` function
- [ ] Implement `handleChargeRefunded` function
- [ ] Implement `handleCustomerUpdated` function
- [ ] Implement `handleTransferUpdated` function
- [ ] Remove unused `handleTransferPaid` and `handleTransferFailed` functions
- [ ] Test all webhook events with Stripe CLI

**Testing**:
```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
stripe trigger payment_intent.processing
stripe trigger payment_intent.requires_action
stripe trigger charge.refunded
```

**Impact**: Incomplete payment status tracking, users may not see accurate payment states

---

### ✅ Issue 1.3: Notification System Not Implemented

**Status**:  FIXED

**Files**: Multiple service files with TODO comments

**Problem**: All services have `// TODO: Send notification` comments but no actual implementation

**Affected Files**:
1. `src/api/webhooks/services/stripe-webhook.service.ts`


**Action Items**:
- [ ] Replace all TODO comments with actual notification calls
- [ ] Add notification for successful deposit
- [ ] Add notification for failed deposit
- [ ] Add notification for canceled deposit
- [ ] Add notification for account verified
- [ ] Add notification for account rejected
- [ ] Add notification for withdrawal completed
- [ ] Add notification for withdrawal failed
- [ ] Test end-to-end notification flow

**Impact**: Users are not informed about payment status changes

---

## ⚠️ Priority 2: HIGH (Fix Before Production)


### Issue 2.3: No Webhook Event Logging

**Status**: ❌ NOT FIXED

**Problem**: Webhook events are not logged to database for audit trail

**Required Implementation**:

#### Create Webhook Log Model
```typescript
// src/db/models/webhook-log.model.ts
export interface WebhookLog {
  eventId: string;
  eventType: string;
  payload: any;
  status: "pending" | "processed" | "failed";
  processedAt?: Date;
  error?: string;
  retryCount: number;
}
```

#### Update Webhook Handler
```typescript
// src/api/webhooks/services/stripe-webhook.service.ts

// Log webhook event
const webhookLog = await db.webhookLog.create({
  eventId: event.id,
  eventType: event.type,
  payload: event,
  status: "pending",
  retryCount: 0,
});

try {
  // Process event
  await handleEvent(event);
  
  // Mark as processed
  webhookLog.status = "processed";
  webhookLog.processedAt = new Date();
  await webhookLog.save();
} catch (error) {
  // Mark as failed
  webhookLog.status = "failed";
  webhookLog.error = error.message;
  await webhookLog.save();
}
```

**Action Items**:
- [ ] Create WebhookLog model
- [ ] Add webhook logging to handler
- [ ] Add webhook replay functionality
- [ ] Add webhook monitoring dashboard
- [ ] Add webhook retry mechanism

---

### ✅ Issue 2.4: No Retry Logic for Failed Transactions

**Status**:  FIXED

**Problem**: Failed transactions are not automatically retried

**Required Implementation**:

#### Update Transaction Model
```typescript
// Already has these fields ✅
retryCount?: number;
maxRetries?: number; // Add this
nextRetryAt?: Date;
lastRetryAt?: Date;
```

#### Create Retry Service
```typescript
// src/jobs/retry-failed-transactions.ts

export const retryFailedTransactions = async () => {
  const failedTransactions = await db.transaction.find({
    status: "failed",
    retryCount: { $lt: 3 },
    nextRetryAt: { $lte: new Date() },
  });

  for (const txn of failedTransactions) {
    // Check if error is retryable
    if (!isRetryable(txn.stripeError)) continue;
    
    try {
      // Retry based on transaction type
      if (txn.type === "deposit") {
        await retryDeposit(txn);
      } else if (txn.type === "withdrawal") {
        await retryWithdrawal(txn);
      }
      
      txn.status = "completed";
      txn.completedAt = new Date();
    } catch (error) {
      txn.retryCount += 1;
      txn.lastRetryAt = new Date();
      txn.nextRetryAt = calculateNextRetry(txn.retryCount);
    }
    
    await txn.save();
  }
};

// Run every hour
setInterval(retryFailedTransactions, 60 * 60 * 1000);
```

**Action Items**:
- [ ] Add `maxRetries` field to transaction model
- [ ] Create retry service
- [ ] Implement error categorization (retryable vs non-retryable)
- [ ] Add exponential backoff
- [ ] Schedule retry job
- [ ] Add monitoring for retry failures

---

### Issue 2.5: No Monitoring and Alerting

**Status**: ❌ NOT FIXED

**Problem**: No monitoring for payment operations and errors

**Required Implementation**:

#### Add Prometheus Metrics
```typescript
// src/lib/metrics.ts
import { Counter, Histogram } from "prom-client";

export const depositCounter = new Counter({
  name: "stripe_deposits_total",
  help: "Total number of deposits",
  labelNames: ["status"],
});

export const depositAmount = new Histogram({
  name: "stripe_deposit_amount",
  help: "Deposit amount distribution",
  buckets: [10, 50, 100, 500, 1000, 5000],
});

export const withdrawalCounter = new Counter({
  name: "stripe_withdrawals_total",
  help: "Total number of withdrawals",
  labelNames: ["status"],
});

export const webhookCounter = new Counter({
  name: "stripe_webhooks_total",
  help: "Total webhook events received",
  labelNames: ["event_type", "status"],
});
```

#### Add Sentry Error Tracking
```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Stripe(),
  ],
});
```

**Action Items**:
- [ ] Install Prometheus client
- [ ] Add metrics to all Stripe operations
- [ ] Install Sentry
- [ ] Configure error tracking
- [ ] Set up alerting rules
- [ ] Create monitoring dashboard

---

## ⚠️ Priority 3: MEDIUM (Fix Soon)

### Issue 3.1: Hardcoded Currency

**Status**: ❌ NOT FIXED

**File**: `src/api/wallet/services/deposit.service.ts`

**Problem**: Currency is hardcoded to "usd"

**Current Code**:
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: "usd", // ❌ Hardcoded
  // ...
});
```

**Required Fix**:
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: wallet.currency.toLowerCase(), // ✅ Dynamic
  // ...
});
```

**Action Items**:
- [ ] Update deposit service to use wallet currency
- [ ] Ensure wallet model has currency field (already exists ✅)
- [ ] Test with different currencies
- [ ] Update validation to support multiple currencies

**Impact**: Cannot support multi-currency payments

---

### Issue 3.2: Hardcoded Country

**Status**: ❌ NOT FIXED

**File**: `src/api/wallet/services/create-connect-account.service.ts`

**Problem**: Country is hardcoded to "US"

**Current Code**:
```typescript
const account = await stripe.accounts.create({
  type: "express",
  country: "US", // ❌ Hardcoded
  // ...
});
```

**Required Fix**:
```typescript
// 1. Add country field to user model
// src/db/models/user.model.ts
country?: string; // ISO 3166-1 alpha-2 country code

// 2. Update Connect account creation
const account = await stripe.accounts.create({
  type: "express",
  country: user.country || "US", // ✅ Dynamic with fallback
  // ...
});
```

**Action Items**:
- [ ] Add `country` field to user model
- [ ] Update user registration to collect country
- [ ] Update Connect account service to use user country
- [ ] Add country validation
- [ ] Test with different countries

**Impact**: Cannot support international contractors

---

### Issue 3.3: Missing 3D Secure Handling

**Status**: ❌ NOT FIXED

**File**: `src/api/wallet/services/deposit.service.ts`

**Problem**: No explicit handling for 3D Secure authentication

**Required Fix**:
```typescript
// After creating payment intent
const paymentIntent = await stripe.paymentIntents.create({...});

// Check if requires action (3DS)
if (paymentIntent.status === "requires_action") {
  return sendSuccess(res, 200, "Additional authentication required", {
    requiresAction: true,
    clientSecret: paymentIntent.client_secret,
    nextAction: paymentIntent.next_action,
    paymentIntentId: paymentIntent.id,
  });
}

// Check if processing (async payment methods)
if (paymentIntent.status === "processing") {
  return sendSuccess(res, 200, "Payment is being processed", {
    processing: true,
    paymentIntentId: paymentIntent.id,
  });
}

// Only return success if payment succeeded
if (paymentIntent.status === "succeeded") {
  return sendSuccess(res, 200, "Payment successful", {...});
}
```

**Action Items**:
- [ ] Add 3DS status handling in deposit service
- [ ] Return appropriate response for `requires_action`
- [ ] Add frontend documentation for 3DS flow
- [ ] Test with 3DS test cards

**Test Card**: `4000 0027 6000 3184` (requires 3DS)

---

### Issue 3.4: Insufficient Error Logging

**Status**: ❌ NOT FIXED

**Problem**: Error logs lack context for debugging

**Current Code**:
```typescript
catch (error) {
  console.error("Error processing deposit:", error);
  return sendInternalError(res, "Failed to process deposit", error);
}
```

**Required Fix**:
```typescript
catch (error) {
  // ✅ Add context to error logs
  console.error("Error processing deposit:", {
    userId,
    amount,
    paymentMethodId,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
  
  // Log to external service (Sentry)
  Sentry.captureException(error, {
    tags: {
      operation: "deposit",
      userId,
    },
    extra: {
      amount,
      paymentMethodId,
    },
  });
  
  return sendInternalError(res, "Failed to process deposit", error);
}
```

**Action Items**:
- [ ] Add context to all error logs
- [ ] Include user ID, amount, and operation type
- [ ] Add structured logging
- [ ] Integrate with error tracking service

---

### Issue 3.5: No Webhook Replay Protection

**Status**: ❌ NOT FIXED

**Problem**: No protection against webhook replay attacks

**Required Fix**:
```typescript
// src/api/webhooks/services/stripe-webhook.service.ts

// Store processed event IDs (use Redis in production)
const processedEvents = new Set<string>();

export const handleStripeWebhook: RequestHandler = async (req, res) => {
  // ... signature verification ...
  
  // Check if event already processed
  if (processedEvents.has(event.id)) {
    console.log(`⚠️ Duplicate webhook event: ${event.id}`);
    return res.json({ received: true, duplicate: true });
  }
  
  // Check in database
  const existingLog = await db.webhookLog.findOne({ eventId: event.id });
  if (existingLog && existingLog.status === "processed") {
    console.log(`⚠️ Webhook already processed: ${event.id}`);
    return res.json({ received: true, duplicate: true });
  }
  
  // Process event
  processedEvents.add(event.id);
  // ... handle event ...
};
```

**Action Items**:
- [ ] Add event ID tracking
- [ ] Use Redis for distributed systems
- [ ] Add database check for processed events
- [ ] Add TTL for event ID cache (24 hours)

---

### Issue 3.6: No Amount Limits

**Status**: ❌ NOT FIXED

**Problem**: No maximum limits for deposits

**Current Code**:
```typescript
// Only minimum validation
if (amount < 10) {
  return sendBadRequest(res, "Minimum deposit amount is $10");
}
```

**Required Fix**:
```typescript
// Add maximum validation
if (amount < 10) {
  return sendBadRequest(res, "Minimum deposit amount is $10");
}

if (amount > 50000) {
  return sendBadRequest(res, "Maximum deposit amount is $50,000");
}

// Add daily limit check
const todayDeposits = await db.transaction.aggregate([
  {
    $match: {
      from: userId,
      type: "deposit",
      status: "completed",
      createdAt: { $gte: startOfDay(new Date()) },
    },
  },
  {
    $group: {
      _id: null,
      total: { $sum: "$amount" },
    },
  },
]);

const dailyTotal = todayDeposits[0]?.total || 0;
if (dailyTotal + amount > 100000) {
  return sendBadRequest(res, "Daily deposit limit exceeded ($100,000)");
}
```

**Action Items**:
- [ ] Add maximum deposit limit ($50,000)
- [ ] Add daily deposit limit ($100,000)
- [ ] Add monthly deposit limit (optional)
- [ ] Add configurable limits per user tier

---

## 📝 Priority 4: LOW (Nice to Have)

### Issue 4.1: No Multi-Currency Support

**Status**: ❌ NOT FIXED

**Problem**: System only supports USD

**Required for Multi-Currency**:
- [ ] Currency conversion service
- [ ] Exchange rate API integration
- [ ] Currency-specific validation
- [ ] Display amounts in user's currency
- [ ] Handle currency conversion fees

---

### Issue 4.2: No Subscription Billing

**Status**: ❌ NOT FIXED

**Problem**: No support for recurring payments

**Required for Subscriptions**:
- [ ] Subscription model
- [ ] Stripe subscription integration
- [ ] Subscription lifecycle management
- [ ] Proration handling
- [ ] Subscription webhooks

---

### Issue 4.3: No Refund Processing

**Status**: ❌ NOT FIXED

**Problem**: No API for processing refunds

**Required for Refunds**:
- [ ] Refund service
- [ ] Partial refund support
- [ ] Refund reason tracking
- [ ] Refund webhooks
- [ ] Refund notifications

---

### Issue 4.4: No Dispute Handling

**Status**: ❌ NOT FIXED

**Problem**: No system for handling payment disputes

**Required for Disputes**:
- [ ] Dispute model
- [ ] Dispute webhooks
- [ ] Evidence submission
- [ ] Dispute notifications
- [ ] Dispute resolution tracking

---

## Summary Statistics

### Issues by Priority

- **Priority 1 (Critical)**: 3 issues (1 fixed, 2 remaining)
- **Priority 2 (High)**: 5 issues (0 fixed)
- **Priority 3 (Medium)**: 6 issues (0 fixed)
- **Priority 4 (Low)**: 4 issues (0 fixed)

**Total Issues**: 18 (1 fixed, 17 remaining)

### Issues by Status

- ✅ **Fixed**: 1 issue (5.6%)
- ❌ **Not Fixed**: 17 issues (94.4%)

### Estimated Time to Fix

- **Priority 1**: 2-3 days
- **Priority 2**: 5-7 days
- **Priority 3**: 3-4 days
- **Priority 4**: 10-15 days (optional)

**Total Time (P1-P3)**: 10-14 days
**Total Time (All)**: 20-29 days

---

## Quick Action Plan

### Week 1: Critical Issues
- [x] Day 1: Fix API version (DONE)
- [ ] Day 2-3: Add missing webhook handlers
- [ ] Day 4-5: Implement notification system

### Week 2: High Priority Issues
- [ ] Day 1-2: Write unit tests
- [ ] Day 3-4: Write integration tests
- [ ] Day 5: Add webhook logging and retry logic

### Week 3: Medium Priority Issues
- [ ] Day 1: Fix hardcoded currency and country
- [ ] Day 2: Add 3DS handling
- [ ] Day 3: Improve error logging
- [ ] Day 4: Add webhook replay protection
- [ ] Day 5: Add amount limits and monitoring

---

## Next Steps

1. **Review this document** with your team
2. **Prioritize issues** based on your timeline
3. **Assign tasks** to developers
4. **Track progress** using this document
5. **Update status** as issues are fixed
6. **Test thoroughly** after each fix

---

**Document Version**: 1.0  
**Last Updated**: January 25, 2026  
**Next Update**: After fixing Priority 1 issues
