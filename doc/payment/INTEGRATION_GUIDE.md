# Integration Guide - Connecting Payment System with Existing Codebase

## Overview

This guide shows how to integrate the payment and bidding system with your existing JobSphere codebase, following established patterns and conventions.

## Project Structure Integration

### New Modules to Create

```
src/api/
├── bidding/              # NEW - Offer management
│   ├── bidding.route.ts
│   ├── bidding.validation.ts
│   ├── bidding.openapi.ts
│   └── services/
│       ├── index.ts
│       ├── create-offer.service.ts
│       ├── accept-offer.service.ts
│       ├── reject-offer.service.ts
│       ├── cancel-offer.service.ts
│       ├── get-sent-offers.service.ts
│       ├── get-received-offers.service.ts
│       └── get-offer-details.service.ts
├── payment/              # NEW - Payment processing
│   ├── payment.route.ts
│   ├── payment.validation.ts
│   ├── payment.openapi.ts
│   └── services/
│       ├── index.ts
│       ├── get-payment-history.service.ts
│       ├── get-payment-details.service.ts
│       └── request-refund.service.ts
└── wallet/               # NEW - Wallet management
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

### Database Models Location

```
src/db/models/
├── offer.model.ts        # NEW
├── payment.model.ts      # NEW
├── transaction.model.ts  # NEW
├── wallet.model.ts       # NEW
└── job.model.ts          # UPDATE - Add new fields
```

### Lib/Utilities

```
src/lib/
├── stripe.ts             # NEW - Stripe service wrapper
└── index.ts              # UPDATE - Export stripe utilities
```

## Following Existing Patterns

### 1. Module Generator Usage

You can use the existing module generator for scaffolding:

```bash
# Generate bidding module
bun run generate:module --module bidding

# Generate payment module
bun run generate:module --module payment

# Generate wallet module
bun run generate:module --module wallet
```

Then customize the generated files according to payment system requirements.

### 2. Validation Pattern (Zod + OpenAPI)

Follow the existing pattern from your codebase:

```typescript
// bidding.validation.ts
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const CreateOfferSchema = z
  .object({
    jobId: z.string().min(1).openapi({ description: "Job ID" }),
    contractorId: z.string().min(1).openapi({ description: "Contractor ID" }),
    amount: z
      .number()
      .positive()
      .openapi({ description: "Offer amount in dollars" }),
    timeline: z
      .string()
      .min(1)
      .openapi({ description: "Expected completion time" }),
    description: z.string().min(1).openapi({ description: "Work description" }),
    paymentMethodId: z
      .string()
      .min(1)
      .openapi({ description: "Stripe payment method ID" }),
  })
  .openapi("CreateOffer");

export type CreateOffer = z.infer<typeof CreateOfferSchema>;
```

### 3. Service Handler Pattern

Follow your existing service pattern:

```typescript
// services/create-offer.service.ts
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";
import type { CreateOffer } from "../bidding.validation";

export const createOffer: RequestHandler<{}, any, CreateOffer> = async (
  req,
  res
) => {
  try {
    const customerId = req.user!.id;
    const {
      jobId,
      contractorId,
      amount,
      timeline,
      description,
      paymentMethodId,
    } = req.body;

    // Validation logic
    const job = await db.job.findById(jobId);
    if (!job) {
      return sendBadRequest(res, "Job not found");
    }

    if (job.status !== "open") {
      return sendBadRequest(res, "Job is not open for offers");
    }

    // Business logic here...

    return sendSuccess(res, 201, "Offer created successfully", offer);
  } catch (error) {
    console.error("Error creating offer:", error);
    return sendInternalError(res, "Failed to create offer");
  }
};
```

### 4. Route Registration Pattern

Follow your existing route pattern:

```typescript
// bidding.route.ts
import "./bidding.openapi";

import { requireAuth, requireRole } from "@/middleware";
import {
  validateBody,
  validateParams,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import { CreateOfferSchema, OfferIdParamSchema } from "./bidding.validation";
import {
  createOffer,
  acceptOffer,
  rejectOffer,
  getSentOffers,
  getReceivedOffers,
} from "./services";

export const bidding: Router = express.Router();

// Customer endpoints
bidding.post(
  "/offer",
  requireAuth,
  requireRole("customer"),
  validateBody(CreateOfferSchema),
  createOffer
);

bidding.get(
  "/offers/sent",
  requireAuth,
  requireRole("customer"),
  getSentOffers
);

// Contractor endpoints
bidding.get(
  "/offers/received",
  requireAuth,
  requireRole("contractor"),
  getReceivedOffers
);

bidding.post(
  "/offer/:offerId/accept",
  requireAuth,
  requireRole("contractor"),
  validateParams(OfferIdParamSchema),
  acceptOffer
);
```

### 5. OpenAPI Documentation Pattern

Follow your existing OpenAPI pattern:

```typescript
// bidding.openapi.ts
import { registry } from "@/lib/openapi";
import { openAPITags, mediaTypeFormat } from "@/common/constants";
import {
  CreateOfferSchema,
  OfferResponseSchema,
  ErrorResponseSchema,
} from "./bidding.validation";

// Register schemas
registry.register("CreateOffer", CreateOfferSchema);
registry.register("OfferResponse", OfferResponseSchema);

// Register path
registry.registerPath({
  method: "post",
  path: "/api/bidding/offer",
  description: "Create and send an offer to a contractor",
  summary: "Create offer",
  tags: ["Bidding"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        [mediaTypeFormat.json]: {
          schema: CreateOfferSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Offer created successfully",
      content: {
        [mediaTypeFormat.json]: {
          schema: OfferResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
```

## Constants Integration

Add payment-related constants to `src/common/constants.ts`:

```typescript
export const openAPITags = {
  // ... existing tags
  bidding: {
    name: "Bidding",
    basepath: "/api/bidding",
  },
  payment: {
    name: "Payment",
    basepath: "/api/payment",
  },
  wallet: {
    name: "Wallet",
    basepath: "/api/wallet",
  },
};
```

## Database Integration

### Update db/index.ts

```typescript
// src/db/index.ts
import { Offer } from "./models/offer.model";
import { Payment } from "./models/payment.model";
import { Transaction } from "./models/transaction.model";
import { Wallet } from "./models/wallet.model";

export const db = {
  // ... existing models
  offer: Offer,
  payment: Payment,
  transaction: Transaction,
  wallet: Wallet,
};
```

### Create Stripe Service

```typescript
// src/lib/stripe.ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Helper functions
export const createPaymentIntent = async (
  amount: number,
  paymentMethodId: string,
  metadata: Record<string, string>
) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: process.env.PAYMENT_CURRENCY || "usd",
    payment_method: paymentMethodId,
    confirmation_method: "manual",
    capture_method: "manual",
    metadata,
  });
};

export const capturePayment = async (paymentIntentId: string) => {
  return await stripe.paymentIntents.capture(paymentIntentId);
};

export const refundPayment = async (
  paymentIntentId: string,
  reason?: string
) => {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: reason || "requested_by_customer",
  });
};

export const createTransfer = async (
  amount: number,
  destination: string,
  metadata: Record<string, string>
) => {
  return await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: process.env.PAYMENT_CURRENCY || "usd",
    destination,
    metadata,
  });
};
```

## App.ts Integration

Register new routes in `src/app.ts`:

```typescript
// Import new modules
import { bidding } from "@/api/bidding/bidding.route";
import { payment } from "@/api/payment/payment.route";
import { wallet } from "@/api/wallet/wallet.route";

// Register routes (after existing routes)
app.use("/api/bidding", bidding);
app.use("/api/payment", payment);
app.use("/api/wallet", wallet);

// Webhook endpoint (before other routes, needs raw body)
import { stripeWebhook } from "@/api/webhooks/stripe.route";
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
```

## Notification Integration

Use existing NotificationService for payment notifications:

```typescript
import { NotificationService } from "@/common/service/notification.service";

// In accept-offer.service.ts
await NotificationService.sendToUser({
  userId: offer.customer,
  title: "Offer Accepted",
  body: "Contractor has accepted your offer",
  type: "booking_confirmed",
  data: { offerId: offer._id.toString(), jobId: offer.job.toString() },
});

// In complete-job.service.ts
await NotificationService.sendToUser({
  userId: contractorId,
  title: "Payment Released",
  body: `You received $${contractorPayout} for completed job`,
  type: "payment_received",
  data: { jobId: job._id.toString(), amount: contractorPayout },
});
```

## Job Module Integration

### Update Job Services

Add new services to `src/api/job/services/`:

```typescript
// complete-job.service.ts
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { NotificationService } from "@/common/service/notification.service";

export const completeJob: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const customerId = req.user!.id;

    // Validate job
    const job = await db.job.findOne({
      _id: jobId,
      customerId,
      status: "in_progress",
    });

    if (!job) {
      return sendBadRequest(res, "Job not found or not in progress");
    }

    // Get payment details
    const payment = await db.payment.findOne({
      job: jobId,
      status: "captured",
    });

    if (!payment) {
      return sendBadRequest(res, "Payment not found");
    }

    // Calculate fees
    const serviceFee = payment.totalAmount * 0.2;
    const contractorPayout = payment.totalAmount * 0.7;

    // Get contractor
    const contractor = await db.user.findById(job.contractorId);
    if (!contractor?.stripeAccountId) {
      return sendBadRequest(res, "Contractor Stripe account not connected");
    }

    // Transfer to contractor
    const transfer = await stripe.transfers.create({
      amount: Math.round(contractorPayout * 100),
      currency: "usd",
      destination: contractor.stripeAccountId,
      metadata: {
        jobId: jobId.toString(),
        offerId: payment.offer.toString(),
      },
    });

    // Update job
    job.status = "completed";
    job.completedAt = new Date();
    await job.save();

    // Update payment
    payment.status = "released";
    payment.transferId = transfer.id;
    payment.releasedAt = new Date();
    await payment.save();

    // Create transactions
    await db.transaction.create({
      type: "service_fee",
      amount: serviceFee,
      from: payment.offer,
      to: "admin", // Admin user ID
      offer: payment.offer,
      job: jobId,
      payment: payment._id,
      status: "completed",
      description: "Service fee for completed job",
      stripeTransactionId: transfer.id,
      completedAt: new Date(),
    });

    await db.transaction.create({
      type: "contractor_payout",
      amount: contractorPayout,
      from: payment.offer,
      to: job.contractorId,
      offer: payment.offer,
      job: jobId,
      payment: payment._id,
      status: "completed",
      description: "Payment for completed job",
      stripeTransactionId: transfer.id,
      completedAt: new Date(),
    });

    // Update wallets
    await db.wallet.findOneAndUpdate(
      { user: "admin" },
      {
        $inc: {
          balance: serviceFee,
          totalEarnings: serviceFee,
        },
      },
      { upsert: true }
    );

    await db.wallet.findOneAndUpdate(
      { user: job.contractorId },
      {
        $inc: {
          balance: contractorPayout,
          totalEarnings: contractorPayout,
        },
      },
      { upsert: true }
    );

    // Send notifications
    await NotificationService.sendToUser({
      userId: job.contractorId,
      title: "Payment Released",
      body: `You received $${contractorPayout} for completed job`,
      type: "payment_received",
      data: { jobId: jobId.toString(), amount: contractorPayout },
    });

    return sendSuccess(res, 200, "Job marked as complete", {
      job,
      payment: {
        serviceFee,
        contractorPayout,
        adminCommission: serviceFee + payment.platformFee,
      },
    });
  } catch (error) {
    console.error("Error completing job:", error);
    return sendInternalError(res, "Failed to complete job");
  }
};
```

### Update Job Routes

```typescript
// job.route.ts
import { completeJob, cancelJob } from "./services";

// Add new routes
job.post(
  "/:jobId/complete",
  requireAuth,
  requireRole("customer"),
  validateParams(JobIdParamSchema),
  completeJob
);

job.post(
  "/:jobId/cancel",
  requireAuth,
  requireAnyRole(["customer", "admin"]),
  validateParams(JobIdParamSchema),
  cancelJob
);
```

## Webhook Integration

Create webhook handler following your patterns:

```typescript
// src/api/webhooks/stripe.route.ts
import type { Request, Response } from "express";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { NotificationService } from "@/common/service/notification.service";
import { logger } from "@/lib/logger";

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    logger.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
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
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error("Error handling webhook:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const offerId = paymentIntent.metadata.offerId;

  await db.payment.findOneAndUpdate(
    { paymentIntentId: paymentIntent.id },
    {
      status: "captured",
      capturedAt: new Date(),
    }
  );

  logger.info(`Payment intent succeeded: ${paymentIntent.id}`);
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  await db.payment.findOneAndUpdate(
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

  logger.error(`Payment intent failed: ${paymentIntent.id}`);
}

async function handleTransferCreated(transfer: any) {
  await db.payment.findOneAndUpdate(
    { transferId: transfer.id },
    {
      status: "released",
      releasedAt: new Date(),
    }
  );

  logger.info(`Transfer created: ${transfer.id}`);
}

async function handleTransferFailed(transfer: any) {
  logger.error(`Transfer failed: ${transfer.id}`, transfer);
  // Implement admin notification
}

async function handleAccountUpdated(account: any) {
  const isOnboarded = account.charges_enabled && account.payouts_enabled;

  await db.wallet.findOneAndUpdate(
    { stripeAccountId: account.id },
    {
      stripeAccountStatus: isOnboarded ? "active" : "pending",
    }
  );

  logger.info(`Account updated: ${account.id}, onboarded: ${isOnboarded}`);
}

async function handleChargeRefunded(charge: any) {
  logger.info(`Charge refunded: ${charge.id}`);
}
```

## Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Commission Rates (percentage)
PLATFORM_FEE_PERCENT=10
SERVICE_FEE_PERCENT=20

# Payment Settings
PAYMENT_CURRENCY=USD
PAYMENT_HOLD_DAYS=7

# Frontend URLs (for Stripe Connect)
FRONTEND_URL=http://localhost:3000
```

## Testing Integration

### Test with Existing Patterns

```typescript
// __tests__/bidding/create-offer.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "@/db";
import { connectDB } from "@/lib/connect-mongo";

describe("Create Offer", () => {
  beforeAll(async () => {
    await connectDB();
  });

  test("should create offer successfully", async () => {
    // Test implementation
  });

  afterAll(async () => {
    // Cleanup
  });
});
```

## Migration Steps

### Step 1: Install Dependencies

```bash
bun add stripe decimal.js
```

### Step 2: Create Database Models

1. Create `offer.model.ts`
2. Create `payment.model.ts`
3. Create `transaction.model.ts`
4. Create `wallet.model.ts`
5. Update `job.model.ts`
6. Update `db/index.ts`

### Step 3: Create Stripe Service

1. Create `lib/stripe.ts`
2. Update `lib/index.ts`

### Step 4: Generate Modules

```bash
bun run generate:module --module bidding
bun run generate:module --module payment
bun run generate:module --module wallet
```

### Step 5: Implement Services

Follow the service patterns from documentation:

- Bidding services (7 services)
- Payment services (3 services)
- Wallet services (4 services)
- Job update services (2 services)

### Step 6: Create Webhook Handler

1. Create `webhooks/stripe.route.ts`
2. Register in `app.ts`

### Step 7: Update Constants

Add payment-related tags to `common/constants.ts`

### Step 8: Testing

1. Unit tests for each service
2. Integration tests for complete flows
3. Manual testing with Stripe test cards

### Step 9: Documentation

1. Update OpenAPI docs
2. Test API documentation UI
3. Verify all endpoints documented

## Common Pitfalls to Avoid

1. **Don't forget to import OpenAPI files** at the top of route files
2. **Always validate offer status** before processing
3. **Use database transactions** for atomic operations
4. **Handle Stripe errors** properly with try-catch
5. **Send notifications** at every step
6. **Log all transactions** for audit trail
7. **Test webhook handling** with Stripe CLI
8. **Verify commission calculations** thoroughly
9. **Check authorization** on all endpoints
10. **Use environment variables** for configuration

## Verification Checklist

- [ ] All models created and registered in `db/index.ts`
- [ ] Stripe service created in `lib/stripe.ts`
- [ ] All modules generated and customized
- [ ] Routes registered in `app.ts`
- [ ] Webhook handler created and registered
- [ ] Constants updated with payment tags
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] OpenAPI documentation complete
- [ ] Notifications integrated
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Tests written
- [ ] Manual testing completed

## Next Steps

1. Review all documentation in `doc/payment/`
2. Follow implementation checklist
3. Test each component thoroughly
4. Deploy to staging environment
5. Monitor for issues
6. Deploy to production

---

**Remember**: This is the most critical feature of your platform. Take time to implement it correctly, test thoroughly, and monitor closely after deployment.
