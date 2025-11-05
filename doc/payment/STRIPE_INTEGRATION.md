# Stripe Integration Guide

## Overview

JobSphere uses Stripe for secure payment processing, including payment capture, holds, and contractor payouts via Stripe Connect.

## Stripe Setup

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete business verification
3. Enable test mode for development

### 2. Get API Keys

```env
# Test Keys (for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Live Keys (for production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Enable Stripe Connect

1. Go to Stripe Dashboard → Connect
2. Enable Standard Connect
3. Configure branding and settings
4. Set up OAuth redirect URLs

---

## Payment Flow with Stripe

### Step 1: Create Payment Intent (Offer Creation)

**When**: Customer sends offer to contractor

**Purpose**: Reserve payment method, don't charge yet

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Create Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(offerAmount * 100), // Convert to cents
  currency: "usd",
  payment_method: paymentMethodId,
  confirmation_method: "manual",
  capture_method: "manual", // Don't capture immediately
  metadata: {
    offerId: offer._id.toString(),
    jobId: job._id.toString(),
    customerId: customer._id.toString(),
    contractorId: contractor._id.toString(),
  },
  description: `Payment for job: ${job.title}`,
});

// Confirm Payment Intent
const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
  payment_method: paymentMethodId,
});
```

**Result**: Payment method authorized, funds reserved, not yet captured

---

### Step 2: Capture Payment (Offer Acceptance)

**When**: Contractor accepts offer

**Purpose**: Actually charge the customer

```typescript
// Capture the payment
const capturedIntent = await stripe.paymentIntents.capture(paymentIntentId, {
  amount_to_capture: Math.round(offerAmount * 100),
});

// Calculate fees
const platformFee = offerAmount * 0.1; // 10%
const heldAmount = offerAmount - platformFee;

// Store in database
await Payment.create({
  offer: offerId,
  job: jobId,
  customer: customerId,
  contractor: contractorId,
  totalAmount: offerAmount,
  platformFee: platformFee,
  serviceFee: offerAmount * 0.2, // Will be deducted later
  contractorPayout: offerAmount * 0.7,
  paymentIntentId: paymentIntent.id,
  status: "captured",
  capturedAt: new Date(),
});
```

**Result**: Customer charged, platform fee (10%) taken, rest held

---

### Step 3: Transfer to Contractor (Job Completion)

**When**: Customer marks job as complete

**Purpose**: Pay contractor their 70% share

```typescript
// Get contractor's Stripe Connect account
const contractor = await User.findById(contractorId);

if (!contractor.stripeAccountId) {
  throw new Error("Contractor has not connected Stripe account");
}

// Calculate contractor payout (70%)
const contractorPayout = offerAmount * 0.7;

// Transfer to contractor
const transfer = await stripe.transfers.create({
  amount: Math.round(contractorPayout * 100),
  currency: "usd",
  destination: contractor.stripeAccountId,
  metadata: {
    jobId: jobId.toString(),
    offerId: offerId.toString(),
    contractorId: contractorId.toString(),
  },
  description: `Payment for completed job: ${job.title}`,
});

// Update payment record
await Payment.findOneAndUpdate(
  { offer: offerId },
  {
    transferId: transfer.id,
    status: "released",
    releasedAt: new Date(),
  }
);

// Update contractor wallet
await Wallet.findOneAndUpdate(
  { user: contractorId },
  {
    $inc: {
      balance: contractorPayout,
      totalEarnings: contractorPayout,
    },
  }
);
```

**Result**: Contractor receives 70%, admin keeps 30% (10% + 20%)

---

### Step 4: Refund (Offer Rejection or Cancellation)

**When**: Contractor rejects offer or job is cancelled

**Purpose**: Return money to customer

```typescript
// Create refund
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  reason: "requested_by_customer",
  metadata: {
    offerId: offerId.toString(),
    reason: rejectionReason,
  },
});

// Update payment record
await Payment.findOneAndUpdate(
  { offer: offerId },
  {
    refundId: refund.id,
    status: "refunded",
    refundedAt: new Date(),
    refundReason: rejectionReason,
  }
);

// Create transaction record
await Transaction.create({
  type: "refund",
  amount: offerAmount,
  from: "admin",
  to: customerId,
  offer: offerId,
  job: jobId,
  status: "completed",
  description: `Refund for rejected offer`,
  stripeTransactionId: refund.id,
  completedAt: new Date(),
});
```

**Result**: Full refund to customer

---

## Stripe Connect for Contractors

### Contractor Onboarding

**Step 1: Create Connect Account**

```typescript
// When contractor signs up or first time receiving payment
const account = await stripe.accounts.create({
  type: "standard", // or 'express' for simpler onboarding
  country: "US",
  email: contractor.email,
  capabilities: {
    transfers: { requested: true },
  },
  metadata: {
    userId: contractor._id.toString(),
  },
});

// Save to database
await User.findByIdAndUpdate(contractor._id, {
  stripeAccountId: account.id,
});

await Wallet.findOneAndUpdate(
  { user: contractor._id },
  {
    stripeAccountId: account.id,
    stripeAccountStatus: "pending",
  }
);
```

**Step 2: Create Account Link**

```typescript
// Generate onboarding link
const accountLink = await stripe.accountLinks.create({
  account: contractor.stripeAccountId,
  refresh_url: `${process.env.FRONTEND_URL}/contractor/stripe/refresh`,
  return_url: `${process.env.FRONTEND_URL}/contractor/stripe/success`,
  type: "account_onboarding",
});

// Return link to frontend
return {
  url: accountLink.url,
};
```

**Step 3: Verify Account Status**

```typescript
// Check if account is fully onboarded
const account = await stripe.accounts.retrieve(contractor.stripeAccountId);

const isOnboarded = account.charges_enabled && account.payouts_enabled;

// Update database
await Wallet.findOneAndUpdate(
  { user: contractor._id },
  {
    stripeAccountStatus: isOnboarded ? "active" : "pending",
  }
);
```

---

## Webhook Handling

### Setup Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen for
4. Copy webhook signing secret

### Webhook Events to Handle

```typescript
import { Request, Response } from "express";

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object);
      break;

    case "transfer.created":
      await handleTransferCreated(event.data.object);
      break;

    case "transfer.failed":
      await handleTransferFailed(event.data.object);
      break;

    case "account.updated":
      await handleAccountUpdated(event.data.object);
      break;

    case "charge.refunded":
      await handleChargeRefunded(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

// Handler functions
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const offerId = paymentIntent.metadata.offerId;

  await Payment.findOneAndUpdate(
    { paymentIntentId: paymentIntent.id },
    {
      status: "captured",
      capturedAt: new Date(),
    }
  );

  // Send notification to contractor
  await NotificationService.sendToUser({
    userId: paymentIntent.metadata.contractorId,
    title: "Payment Received",
    body: "Customer has paid for the job",
    type: "payment_received",
    data: { offerId },
  });
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  await Payment.findOneAndUpdate(
    { paymentIntentId: paymentIntent.id },
    {
      status: "failed",
      failureReason: paymentIntent.last_payment_error?.message,
    }
  );

  // Notify customer
  await NotificationService.sendToUser({
    userId: paymentIntent.metadata.customerId,
    title: "Payment Failed",
    body: "Your payment could not be processed",
    type: "general",
  });
}

async function handleTransferCreated(transfer: any) {
  await Payment.findOneAndUpdate(
    { transferId: transfer.id },
    {
      status: "released",
      releasedAt: new Date(),
    }
  );
}

async function handleTransferFailed(transfer: any) {
  // Handle failed transfer
  console.error("Transfer failed:", transfer);

  // Notify admin
  // Implement manual intervention
}

async function handleAccountUpdated(account: any) {
  const isOnboarded = account.charges_enabled && account.payouts_enabled;

  await Wallet.findOneAndUpdate(
    { stripeAccountId: account.id },
    {
      stripeAccountStatus: isOnboarded ? "active" : "pending",
    }
  );
}

async function handleChargeRefunded(charge: any) {
  // Handle refund completion
  console.log("Charge refunded:", charge.id);
}
```

---

## Error Handling

### Common Stripe Errors

```typescript
try {
  // Stripe operation
} catch (error: any) {
  if (error.type === "StripeCardError") {
    // Card was declined
    return sendError(res, 400, "Your card was declined");
  } else if (error.type === "StripeInvalidRequestError") {
    // Invalid parameters
    return sendError(res, 400, "Invalid payment details");
  } else if (error.type === "StripeAPIError") {
    // Stripe API error
    return sendError(res, 500, "Payment processing error");
  } else if (error.type === "StripeConnectionError") {
    // Network error
    return sendError(res, 500, "Network error, please try again");
  } else if (error.type === "StripeAuthenticationError") {
    // Authentication error
    console.error("Stripe authentication error:", error);
    return sendError(res, 500, "Payment system error");
  } else {
    // Unknown error
    console.error("Unknown Stripe error:", error);
    return sendError(res, 500, "An error occurred");
  }
}
```

---

## Testing

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
3D Secure: 4000 0027 6000 3184
```

### Test Webhooks

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger transfer.created
```

---

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Verify webhook signatures** to prevent tampering
3. **Use HTTPS** for all Stripe API calls
4. **Store minimal payment data** in your database
5. **Implement idempotency** for payment operations
6. **Log all transactions** for audit trail
7. **Monitor for suspicious activity**
8. **Implement rate limiting** on payment endpoints

---

## Production Checklist

- [ ] Switch to live API keys
- [ ] Configure live webhooks
- [ ] Test with real cards (small amounts)
- [ ] Set up monitoring and alerts
- [ ] Configure Stripe Connect settings
- [ ] Review and accept Stripe terms
- [ ] Set up bank account for payouts
- [ ] Configure tax settings
- [ ] Test refund process
- [ ] Document incident response procedures

---

## Monitoring & Analytics

### Key Metrics to Track

- Payment success rate
- Average payment amount
- Failed payment reasons
- Refund rate
- Transfer success rate
- Webhook delivery rate

### Stripe Dashboard

- Monitor transactions in real-time
- View detailed payment logs
- Analyze payment trends
- Export transaction data
- Manage disputes

---

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [Stripe Support](https://support.stripe.com)
