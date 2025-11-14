# Stripe Webhook Integration Guide

**Version**: 1.0.0  
**Last Updated**: November 14, 2025  
**Status**: Implementation Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Why Webhooks Are Essential](#why-webhooks-are-essential)
3. [Stripe Dashboard Setup](#stripe-dashboard-setup)
4. [Backend Implementation](#backend-implementation)
5. [Webhook Events to Handle](#webhook-events-to-handle)
6. [Testing Webhooks](#testing-webhooks)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## Overview

Webhooks are HTTP callbacks that Stripe sends to your server when events occur in your Stripe account. They're essential for handling asynchronous payment events like successful charges, failed payments, and completed transfers.

### What Webhooks Do

- **Notify your server** when payments succeed or fail
- **Confirm transfers** to contractors complete successfully
- **Alert you** when refunds are processed
- **Update account status** when contractors complete Stripe Connect onboarding
- **Handle disputes** and chargebacks automatically

### Current Payment System Integration

Your JobSphere payment system currently handles:

- ✅ Wallet deposits and withdrawals
- ✅ Offer creation with escrow holds
- ✅ Platform fee collection (5%)
- ✅ Service fee collection (20%)
- ✅ Contractor payouts (80%)
- ✅ Automatic refunds on rejection/cancellation
- ❌ **Stripe webhook integration** (needs implementation)

---

## Why Webhooks Are Essential

### Without Webhooks

Your current system works for basic wallet operations but has limitations:

1. **No Payment Confirmation**: When customer deposits money, you don't know if Stripe actually charged them
2. **No Transfer Verification**: When paying contractors, you can't confirm money reached their account
3. **No Failure Handling**: If a payment fails, you won't know until customer complains
4. **No Refund Confirmation**: Refunds might fail silently
5. **No Dispute Alerts**: Chargebacks could happen without your knowledge

### With Webhooks

Webhooks solve these problems:

1. ✅ **Real-time payment confirmation**
2. ✅ **Automatic failure handling**
3. ✅ **Transfer success verification**
4. ✅ **Refund status tracking**
5. ✅ **Dispute notifications**
6. ✅ **Account status updates**

---

## Stripe Dashboard Setup

### Step 1: Access Stripe Dashboard

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign in to your account
3. **Important**: Make sure you're in **Test Mode** (toggle in top right)

### Step 2: Navigate to Webhooks

1. Click **Developers** in the left sidebar
2. Click **Webhooks** tab
3. Click **Add endpoint** button

### Step 3: Configure Webhook Endpoint

#### Endpoint URL

**Development (Local Testing)**:

```
http://localhost:4000/api/webhooks/stripe
```

**Staging**:

```
https://staging-api.jobsphere.com/api/webhooks/stripe
```

**Production**:

```
https://api.jobsphere.com/api/webhooks/stripe
```

#### Select Events to Listen

Click **Select events** and choose these events:

**Payment Events** (Critical):

- ✅ `payment_intent.succeeded` - Payment captured successfully
- ✅ `payment_intent.payment_failed` - Payment failed
- ✅ `payment_intent.canceled` - Payment canceled

**Transfer Events** (For Contractor Payouts):

- ✅ `transfer.created` - Transfer initiated
- ✅ `transfer.paid` - Transfer completed
- ✅ `transfer.failed` - Transfer failed
- ✅ `transfer.reversed` - Transfer reversed

**Refund Events**:

- ✅ `charge.refunded` - Refund processed
- ✅ `charge.refund.updated` - Refund status changed

**Stripe Connect Events** (For Contractor Accounts):

- ✅ `account.updated` - Account status changed
- ✅ `account.application.authorized` - Account authorized
- ✅ `account.application.deauthorized` - Account deauthorized

**Dispute Events** (Optional but Recommended):

- ✅ `charge.dispute.created` - Dispute opened
- ✅ `charge.dispute.closed` - Dispute resolved

### Step 4: Get Webhook Signing Secret

After creating the endpoint:

1. Click on the webhook endpoint you just created
2. Find **Signing secret** section
3. Click **Reveal** to show the secret
4. Copy the secret (starts with `whsec_`)
5. Add to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 5: Test the Endpoint

1. In the webhook details page, click **Send test webhook**
2. Select an event type (e.g., `payment_intent.succeeded`)
3. Click **Send test webhook**
4. Check your server logs to verify it received the event

---

## Backend Implementation

### Step 1: Install Dependencies

```bash
bun add stripe
```

### Step 2: Create Webhook Route

**File**: `src/api/webhooks/stripe.route.ts`

```typescript
import { Router } from "express";
import Stripe from "stripe";
import { db } from "@/db";
import { NotificationService } from "@/common/service/notification.service";
import { logError, logInfo } from "@/lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export const stripeWebhook = Router();

// IMPORTANT: This route needs raw body, not JSON parsed
stripeWebhook.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    logError(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logInfo(`Received webhook event: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "transfer.created":
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case "transfer.paid":
        await handleTransferPaid(event.data.object as Stripe.Transfer);
        break;

      case "transfer.failed":
        await handleTransferFailed(event.data.object as Stripe.Transfer);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        logInfo(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    logError(`Error handling webhook: ${error.message}`);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

// ============================================
// Event Handlers
// ============================================

/**
 * Handle successful payment
 * This confirms customer deposit was successful
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  logInfo(`Payment succeeded: ${paymentIntent.id}`);

  const { userId, transactionId } = paymentIntent.metadata;

  if (!userId || !transactionId) {
    logError("Missing metadata in payment intent");
    return;
  }

  // Update transaction status
  await db.transaction.findByIdAndUpdate(transactionId, {
    status: "completed",
    completedAt: new Date(),
    stripeTransactionId: paymentIntent.id,
  });

  // Send notification to user
  await NotificationService.sendToUser({
    userId,
    title: "Deposit Successful",
    body: `Your deposit of $${(paymentIntent.amount / 100).toFixed(
      2
    )} was successful`,
    type: "payment_received",
    data: {
      transactionId,
      amount: (paymentIntent.amount / 100).toString(),
    },
  });

  logInfo(`Payment processed successfully for user ${userId}`);
}

/**
 * Handle failed payment
 * This alerts customer their deposit failed
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logError(`Payment failed: ${paymentIntent.id}`);

  const { userId, transactionId } = paymentIntent.metadata;

  if (!userId || !transactionId) {
    logError("Missing metadata in payment intent");
    return;
  }

  const failureReason =
    paymentIntent.last_payment_error?.message || "Unknown error";

  // Update transaction status
  await db.transaction.findByIdAndUpdate(transactionId, {
    status: "failed",
    failureReason,
  });

  // Reverse wallet balance if it was already added
  await db.wallet.findOneAndUpdate(
    { user: userId },
    {
      $inc: {
        balance: -(paymentIntent.amount / 100),
      },
    }
  );

  // Send notification to user
  await NotificationService.sendToUser({
    userId,
    title: "Deposit Failed",
    body: `Your deposit failed: ${failureReason}`,
    type: "general",
    data: {
      transactionId,
      reason: failureReason,
    },
  });

  logError(`Payment failed for user ${userId}: ${failureReason}`);
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent
) {
  logInfo(`Payment canceled: ${paymentIntent.id}`);

  const { userId, transactionId } = paymentIntent.metadata;

  if (!userId || !transactionId) {
    return;
  }

  await db.transaction.findByIdAndUpdate(transactionId, {
    status: "failed",
    failureReason: "Payment canceled",
  });
}

/**
 * Handle transfer created
 * This confirms payout to contractor was initiated
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  logInfo(`Transfer created: ${transfer.id}`);

  const { offerId, contractorId } = transfer.metadata;

  if (!offerId || !contractorId) {
    return;
  }

  // Update offer with transfer ID
  await db.offer.findByIdAndUpdate(offerId, {
    stripeTransferId: transfer.id,
  });

  logInfo(`Transfer initiated for contractor ${contractorId}`);
}

/**
 * Handle transfer completed
 * This confirms contractor received their payout
 */
async function handleTransferPaid(transfer: Stripe.Transfer) {
  logInfo(`Transfer paid: ${transfer.id}`);

  const { offerId, contractorId, jobId } = transfer.metadata;

  if (!offerId || !contractorId) {
    return;
  }

  // Find the contractor payout transaction
  const transaction = await db.transaction.findOne({
    offer: offerId,
    to: contractorId,
    type: "contractor_payout",
  });

  if (transaction) {
    transaction.status = "completed";
    transaction.completedAt = new Date();
    transaction.stripeTransactionId = transfer.id;
    await transaction.save();
  }

  // Send notification to contractor
  await NotificationService.sendToUser({
    userId: contractorId,
    title: "Payment Received",
    body: `You received $${(transfer.amount / 100).toFixed(
      2
    )} for completing the job`,
    type: "payment_received",
    data: {
      offerId,
      jobId,
      amount: (transfer.amount / 100).toString(),
    },
  });

  logInfo(`Transfer completed for contractor ${contractorId}`);
}

/**
 * Handle transfer failed
 * This alerts admin that contractor payout failed
 */
async function handleTransferFailed(transfer: Stripe.Transfer) {
  logError(`Transfer failed: ${transfer.id}`);

  const { offerId, contractorId, jobId } = transfer.metadata;

  if (!offerId || !contractorId) {
    return;
  }

  const failureReason = transfer.failure_message || "Unknown error";

  // Update transaction status
  await db.transaction.findOneAndUpdate(
    {
      offer: offerId,
      to: contractorId,
      type: "contractor_payout",
    },
    {
      status: "failed",
      failureReason,
    }
  );

  // Return money to escrow
  const offer = await db.offer.findById(offerId);
  if (offer) {
    await db.wallet.findOneAndUpdate(
      { user: offer.customer },
      {
        $inc: {
          escrowBalance: offer.contractorPayout,
        },
      }
    );
  }

  // Notify admin (you'll need to implement this)
  logError(`Transfer failed for contractor ${contractorId}: ${failureReason}`);

  // TODO: Send email to admin about failed transfer
}

/**
 * Handle refund completed
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  logInfo(`Charge refunded: ${charge.id}`);

  // Refunds are already handled in your reject/cancel logic
  // This webhook just confirms it completed successfully
}

/**
 * Handle Stripe Connect account updated
 * This tracks contractor onboarding status
 */
async function handleAccountUpdated(account: Stripe.Account) {
  logInfo(`Account updated: ${account.id}`);

  const isOnboarded = account.charges_enabled && account.payouts_enabled;

  // Update contractor wallet status
  await db.wallet.findOneAndUpdate(
    { stripeAccountId: account.id },
    {
      stripeAccountStatus: isOnboarded ? "active" : "pending",
    }
  );

  // If onboarding completed, notify contractor
  if (isOnboarded) {
    const wallet = await db.wallet.findOne({ stripeAccountId: account.id });
    if (wallet) {
      await NotificationService.sendToUser({
        userId: wallet.user.toString(),
        title: "Stripe Account Activated",
        body: "Your Stripe account is now active. You can receive payments!",
        type: "general",
      });
    }
  }
}

/**
 * Handle dispute created
 * This alerts admin about chargebacks
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  logError(`Dispute created: ${dispute.id}`);

  // TODO: Implement admin notification system
  // This is critical - you need to respond to disputes within 7 days

  logError(`Dispute amount: $${(dispute.amount / 100).toFixed(2)}`);
  logError(`Dispute reason: ${dispute.reason}`);
}
```

### Step 3: Update App.ts

**File**: `src/app.ts`

**IMPORTANT**: Webhook route must be registered BEFORE `express.json()` middleware because Stripe needs raw body for signature verification.

```typescript
import express from "express";
import { stripeWebhook } from "@/api/webhooks/stripe.route";

const app = express();

// ⚠️ CRITICAL: Webhook route BEFORE express.json()
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// Now add JSON middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... rest of your routes
```

### Step 4: Update Wallet Deposit Service

**File**: `src/api/wallet/services/deposit.service.ts`

Update to integrate with Stripe:

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export const deposit: RequestHandler<{}, any, Deposit> = async (req, res) => {
  try {
    const userId = req.user!.id;
    const { amount, paymentMethodId } = req.body;

    if (amount < 10) {
      return sendBadRequest(res, "Minimum deposit amount is $10");
    }

    // Get or create wallet
    let wallet = await db.wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: userId,
        balance: 0,
        escrowBalance: 0,
      });
    }

    // Create transaction record (pending)
    const transaction = await db.transaction.create({
      type: "deposit",
      amount,
      from: userId,
      to: userId,
      status: "pending",
      description: `Wallet deposit of $${amount}`,
    });

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        userId: userId.toString(),
        transactionId: transaction._id.toString(),
      },
      description: `Wallet deposit for user ${userId}`,
    });

    // If payment succeeded immediately
    if (paymentIntent.status === "succeeded") {
      wallet.balance += amount;
      await wallet.save();

      transaction.status = "completed";
      transaction.completedAt = new Date();
      transaction.stripeTransactionId = paymentIntent.id;
      await transaction.save();

      return sendSuccess(res, 200, "Deposit successful", {
        wallet,
        transaction,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      });
    }

    // If payment requires additional action (3D Secure)
    if (paymentIntent.status === "requires_action") {
      return sendSuccess(res, 200, "Payment requires additional action", {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret,
        },
      });
    }

    // Payment failed
    return sendBadRequest(res, "Payment failed");
  } catch (error: any) {
    console.error("Error depositing:", error);

    if (error.type === "StripeCardError") {
      return sendBadRequest(res, error.message);
    }

    return sendInternalError(res, "Failed to process deposit");
  }
};
```

### Step 5: Add Stripe Transaction ID to Models

**File**: `src/db/models/transaction.model.ts`

Add field:

```typescript
stripeTransactionId: {
  type: String,
  index: true,
},
```

**File**: `src/db/models/offer.model.ts`

Add field:

```typescript
stripeTransferId: {
  type: String,
  index: true,
},
```

---

## Webhook Events to Handle

### Critical Events (Must Implement)

| Event                           | When It Fires                 | What To Do                                   |
| ------------------------------- | ----------------------------- | -------------------------------------------- |
| `payment_intent.succeeded`      | Payment captured successfully | Update transaction status, send notification |
| `payment_intent.payment_failed` | Payment failed                | Reverse wallet balance, notify user          |
| `transfer.paid`                 | Contractor received payout    | Confirm transaction, notify contractor       |
| `transfer.failed`               | Payout to contractor failed   | Return money to escrow, alert admin          |
| `charge.refunded`               | Refund completed              | Confirm refund status                        |

### Important Events (Recommended)

| Event                     | When It Fires                     | What To Do                                |
| ------------------------- | --------------------------------- | ----------------------------------------- |
| `account.updated`         | Contractor account status changed | Update wallet status, notify if activated |
| `payment_intent.canceled` | Payment canceled                  | Update transaction status                 |
| `transfer.created`        | Payout initiated                  | Log transfer ID                           |

### Optional Events (Nice to Have)

| Event                    | When It Fires            | What To Do                           |
| ------------------------ | ------------------------ | ------------------------------------ |
| `charge.dispute.created` | Customer disputes charge | Alert admin, freeze funds            |
| `charge.dispute.closed`  | Dispute resolved         | Update records, release/refund funds |

---

## Testing Webhooks

### Method 1: Stripe CLI (Recommended)

#### Install Stripe CLI

**Windows**:

```bash
scoop install stripe
```

**Mac**:

```bash
brew install stripe/stripe-cli/stripe
```

**Linux**:

```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

#### Login to Stripe

```bash
stripe login
```

This opens browser to authenticate.

#### Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

This will:

- Show your webhook signing secret (copy to `.env`)
- Forward all Stripe events to your local server
- Display events in real-time

#### Trigger Test Events

Open new terminal:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test transfer
stripe trigger transfer.created

# Test refund
stripe trigger charge.refunded
```

### Method 2: Stripe Dashboard

1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **Send test webhook**
4. Select event type
5. Click **Send test webhook**
6. Check your server logs

### Method 3: Manual Testing with Real Payments

Use Stripe test cards:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
3D Secure: 4000 0027 6000 3184
```

---

## Security Best Practices

### 1. Always Verify Webhook Signature

```typescript
// ✅ GOOD
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET!
);

// ❌ BAD - Never trust webhook without verification
const event = req.body;
```

### 2. Use Raw Body for Webhooks

```typescript
// ✅ GOOD - Raw body for signature verification
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// ❌ BAD - JSON parsed body breaks signature
app.use(express.json());
app.use("/api/webhooks/stripe", stripeWebhook);
```

### 3. Implement Idempotency

```typescript
// Check if event already processed
const existingEvent = await db.webhookEvent.findOne({
  stripeEventId: event.id,
});

if (existingEvent) {
  return res.json({ received: true }); // Already processed
}

// Process event...

// Save event ID
await db.webhookEvent.create({
  stripeEventId: event.id,
  type: event.type,
  processedAt: new Date(),
});
```

### 4. Handle Errors Gracefully

```typescript
try {
  await handlePaymentIntentSucceeded(paymentIntent);
  res.json({ received: true });
} catch (error) {
  logError(`Webhook handler failed: ${error.message}`);
  // Return 200 to prevent Stripe retries
  res.json({ received: true, error: error.message });
}
```

### 5. Log Everything

```typescript
logInfo(`Webhook received: ${event.type}`);
logInfo(`Event ID: ${event.id}`);
logInfo(`Metadata: ${JSON.stringify(event.data.object.metadata)}`);
```

---

## Troubleshooting

### Webhook Not Receiving Events

**Check**:

1. Webhook URL is correct
2. Server is running and accessible
3. Firewall allows incoming connections
4. Stripe CLI is forwarding (for local testing)

**Solution**:

```bash
# Test with curl
curl -X POST http://localhost:4000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Signature Verification Failed

**Check**:

1. Webhook secret is correct in `.env`
2. Using raw body, not JSON parsed
3. Webhook route registered before `express.json()`

**Solution**:

```typescript
// Verify secret
console.log("Webhook Secret:", process.env.STRIPE_WEBHOOK_SECRET);

// Check body type
console.log("Body type:", typeof req.body);
console.log("Body:", req.body);
```

### Events Not Processing

**Check**:

1. Event handler exists for event type
2. No errors in handler function
3. Database connection working
4. Metadata contains required fields

**Solution**:

```typescript
// Add detailed logging
console.log("Event type:", event.type);
console.log("Event data:", JSON.stringify(event.data.object, null, 2));
console.log("Metadata:", event.data.object.metadata);
```

### Duplicate Event Processing

**Check**:

1. Stripe retries failed webhooks
2. Multiple webhook endpoints configured
3. No idempotency check

**Solution**:

```typescript
// Implement idempotency
const eventId = event.id;
const existing = await db.webhookEvent.findOne({ stripeEventId: eventId });
if (existing) {
  return res.json({ received: true });
}
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Switch to live Stripe API keys
- [ ] Update webhook endpoint URL to production
- [ ] Configure webhook in live mode
- [ ] Test with small real transactions
- [ ] Set up monitoring and alerts
- [ ] Configure error logging
- [ ] Test all critical events
- [ ] Document incident response procedures

### Environment Variables

```env
# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Staging
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Monitoring

**Track These Metrics**:

- Webhook delivery rate
- Failed webhook count
- Average processing time
- Error rate by event type

**Set Up Alerts For**:

- Webhook signature failures
- Payment failures
- Transfer failures
- Dispute creations

### Logging

```typescript
// Log all webhook events
logInfo(`Webhook: ${event.type} - ${event.id}`);

// Log errors with context
logError(`Webhook failed: ${event.type}`, {
  eventId: event.id,
  error: error.message,
  metadata: event.data.object.metadata,
});
```

---

## Summary

### What You Need to Do

1. **Stripe Dashboard**:

   - Create webhook endpoint
   - Select events to listen for
   - Copy webhook signing secret

2. **Backend**:

   - Create webhook route
   - Implement event handlers
   - Update deposit service to use Stripe
   - Add Stripe transaction IDs to models

3. **Testing**:

   - Install Stripe CLI
   - Test with `stripe trigger`
   - Verify events are processed correctly

4. **Production**:
   - Switch to live keys
   - Update webhook URL
   - Monitor webhook delivery
   - Set up alerts

### Key Points

- ✅ Webhooks are essential for production
- ✅ Always verify webhook signatures
- ✅ Use raw body for webhook route
- ✅ Implement idempotency
- ✅ Log everything
- ✅ Handle errors gracefully
- ✅ Test thoroughly before production

---

**Next Steps**: Implement the webhook route, test with Stripe CLI, then deploy to production.

For questions or issues, refer to [Stripe Webhook Documentation](https://stripe.com/docs/webhooks).
