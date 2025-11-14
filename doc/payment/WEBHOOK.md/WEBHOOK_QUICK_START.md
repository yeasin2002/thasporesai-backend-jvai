# Stripe Webhook Quick Start

**Get webhooks working in 30 minutes**

---

## Prerequisites

- ✅ Payment system already implemented (wallet, offers, jobs)
- ✅ Stripe account created
- ✅ Node.js/Bun environment
- ✅ MongoDB database

---

## Step 1: Install Stripe SDK (2 minutes)

```bash
bun add stripe
```

---

## Step 2: Get Stripe Keys (5 minutes)

### A. Get API Keys

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Toggle **Test mode** ON
3. Go to **Developers** → **API keys**
4. Copy keys to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

### B. Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `http://localhost:4000/api/webhooks/stripe`
4. Click **Select events** and choose:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `transfer.paid`
   - `transfer.failed`
   - `charge.refunded`
   - `account.updated`
5. Click **Add endpoint**
6. Copy **Signing secret** to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Step 3: Create Webhook Route (10 minutes)

### A. Create File

**File**: `src/api/webhooks/stripe.route.ts`

```typescript
import { Router } from "express";
import Stripe from "stripe";
import { db } from "@/db";
import { NotificationService } from "@/common/service/notification.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export const stripeWebhook = Router();

stripeWebhook.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "transfer.paid":
        await handleTransferPaid(event.data.object as Stripe.Transfer);
        break;

      case "transfer.failed":
        await handleTransferFailed(event.data.object as Stripe.Transfer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook: ${error.message}`);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { userId, transactionId } = paymentIntent.metadata;

  await db.transaction.findByIdAndUpdate(transactionId, {
    status: "completed",
    completedAt: new Date(),
  });

  await NotificationService.sendToUser({
    userId,
    title: "Deposit Successful",
    body: `Your deposit of $${(paymentIntent.amount / 100).toFixed(
      2
    )} was successful`,
    type: "payment_received",
  });

  console.log(`✅ Payment processed for user ${userId}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { userId, transactionId } = paymentIntent.metadata;

  await db.transaction.findByIdAndUpdate(transactionId, {
    status: "failed",
    failureReason: paymentIntent.last_payment_error?.message,
  });

  await db.wallet.findOneAndUpdate(
    { user: userId },
    { $inc: { balance: -(paymentIntent.amount / 100) } }
  );

  await NotificationService.sendToUser({
    userId,
    title: "Deposit Failed",
    body: "Your deposit failed. Please try again.",
    type: "general",
  });

  console.log(`❌ Payment failed for user ${userId}`);
}

async function handleTransferPaid(transfer: Stripe.Transfer) {
  const { contractorId, offerId } = transfer.metadata;

  await db.transaction.findOneAndUpdate(
    { offer: offerId, to: contractorId, type: "contractor_payout" },
    { status: "completed", completedAt: new Date() }
  );

  await NotificationService.sendToUser({
    userId: contractorId,
    title: "Payment Received",
    body: `You received $${(transfer.amount / 100).toFixed(2)}`,
    type: "payment_received",
  });

  console.log(`✅ Transfer completed for contractor ${contractorId}`);
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  const { contractorId, offerId } = transfer.metadata;

  await db.transaction.findOneAndUpdate(
    { offer: offerId, to: contractorId, type: "contractor_payout" },
    { status: "failed", failureReason: transfer.failure_message }
  );

  console.error(`❌ Transfer failed for contractor ${contractorId}`);
}
```

### B. Register Route in App

**File**: `src/app.ts`

**IMPORTANT**: Add BEFORE `express.json()` middleware!

```typescript
import express from "express";
import { stripeWebhook } from "@/api/webhooks/stripe.route";

const app = express();

// ⚠️ Webhook route MUST come BEFORE express.json()
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// Now add JSON middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... rest of your routes
```

---

## Step 4: Update Deposit Service (5 minutes)

**File**: `src/api/wallet/services/deposit.service.ts`

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

    let wallet = await db.wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: userId,
        balance: 0,
        escrowBalance: 0,
      });
    }

    // Create transaction (pending)
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
      amount: Math.round(amount * 100),
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
    });

    // If succeeded immediately
    if (paymentIntent.status === "succeeded") {
      wallet.balance += amount;
      await wallet.save();

      transaction.status = "completed";
      transaction.completedAt = new Date();
      await transaction.save();
    }

    return sendSuccess(res, 200, "Deposit initiated", {
      wallet,
      transaction,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
      },
    });
  } catch (error: any) {
    console.error("Error depositing:", error);

    if (error.type === "StripeCardError") {
      return sendBadRequest(res, error.message);
    }

    return sendInternalError(res, "Failed to process deposit");
  }
};
```

---

## Step 5: Test with Stripe CLI (5 minutes)

### A. Install Stripe CLI

**Mac**:

```bash
brew install stripe/stripe-cli/stripe
```

**Windows**:

```bash
scoop install stripe
```

**Linux**:

```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### B. Login

```bash
stripe login
```

### C. Forward Webhooks

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

**Copy the webhook signing secret** shown and update `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### D. Trigger Test Events

Open new terminal:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test transfer
stripe trigger transfer.paid
```

Check your server logs for:

```
✅ Webhook received: payment_intent.succeeded
✅ Payment processed for user 123
```

---

## Step 6: Test End-to-End (3 minutes)

### A. Test Deposit

```bash
curl -X POST http://localhost:4000/api/wallet/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "paymentMethodId": "pm_card_visa"
  }'
```

### B. Check Logs

You should see:

```
✅ Webhook received: payment_intent.succeeded
✅ Payment processed for user 123
```

### C. Verify Database

```javascript
// Check transaction status
db.transactions.findOne({ _id: "transaction_id" });
// Should show: status: "completed"

// Check wallet balance
db.wallets.findOne({ user: "user_id" });
// Should show: balance: 100
```

---

## Troubleshooting

### Webhook Not Receiving Events

**Check**:

```bash
# Test webhook endpoint
curl -X POST http://localhost:4000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Should return**: `400 Bad Request` (signature verification failed - this is expected)

### Signature Verification Failed

**Check**:

1. Webhook secret is correct in `.env`
2. Webhook route is BEFORE `express.json()`
3. Using `express.raw()` for webhook route

### Events Not Processing

**Check**:

1. Server logs for errors
2. Event handler exists for event type
3. Metadata contains required fields

**Add logging**:

```typescript
console.log("Event type:", event.type);
console.log("Metadata:", event.data.object.metadata);
```

---

## Production Deployment

### Before Going Live

1. **Switch to live keys**:

   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Update webhook URL**:

   - Go to Stripe Dashboard
   - Create new webhook for production URL
   - Copy new webhook secret

3. **Test with real card**:

   - Make small deposit ($1)
   - Verify webhook received
   - Check transaction completed

4. **Monitor**:
   - Set up error alerts
   - Monitor webhook delivery rate
   - Track failed events

---

## Next Steps

- [ ] Implement remaining webhook events
- [ ] Add idempotency check
- [ ] Set up monitoring
- [ ] Add error alerts
- [ ] Test all payment flows
- [ ] Deploy to production

---

## Resources

- **Full Guide**: `doc/payment/STRIPE_WEBHOOK_GUIDE.md`
- **Dashboard Setup**: `doc/payment/STRIPE_DASHBOARD_SETUP.md`
- **Flow Diagrams**: `doc/payment/WEBHOOK_FLOW_DIAGRAM.md`
- **Stripe Docs**: [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)

---

**Estimated Time**: 30 minutes  
**Difficulty**: Intermediate  
**Status**: Ready to implement

Good luck! 🚀
