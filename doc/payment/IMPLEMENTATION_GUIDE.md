# Implementation Guide - Step by Step

## Overview

This guide provides a clear, step-by-step approach to implementing the payment system for JobSphere. Follow these steps in order.

## Prerequisites

- Existing modules: `job`, `job-request`, `chat` (already working)
- Node.js/Bun environment
- MongoDB database
- Basic understanding of Express.js and TypeScript

## Phase 1: Database Models (Day 1-2)

### Step 1.1: Create Offer Model

**File**: `src/db/models/offer.model.ts`

```typescript
import { Schema, Types, model, type Document } from "mongoose";

export interface Offer {
  job: Types.ObjectId;
  customer: Types.ObjectId;
  contractor: Types.ObjectId;
  application: Types.ObjectId;
  
  // Amounts
  amount: number;
  platformFee: number;
  serviceFee: number;
  contractorPayout: number;
  totalCharge: number;
  
  // Details
  timeline: string;
  description: string;
  
  // Status
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed" | "expired";
  
  // Timestamps
  acceptedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  
  // Reasons
  rejectionReason?: string;
  cancellationReason?: string;
}

export interface OfferDocument extends Offer, Document {}

const offerSchema = new Schema<OfferDocument>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contractor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: "JobApplicationRequest",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceFee: {
      type: Number,
      required: true,
      min: 0,
    },
    contractorPayout: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    timeline: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed", "expired"],
      default: "pending",
      index: true,
    },
    acceptedAt: Date,
    rejectedAt: Date,
    cancelledAt: Date,
    completedAt: Date,
    expiresAt: Date,
    rejectionReason: String,
    cancellationReason: String,
  },
  { timestamps: true }
);

// Indexes
offerSchema.index({ job: 1 }, { unique: true }); // One offer per job
offerSchema.index({ contractor: 1, status: 1 });
offerSchema.index({ customer: 1, status: 1 });

export const Offer = model<OfferDocument>("Offer", offerSchema);
```

### Step 1.2: Create Wallet Model

**File**: `src/db/models/wallet.model.ts`

```typescript
import { Schema, Types, model, type Document } from "mongoose";

export interface Wallet {
  user: Types.ObjectId;
  balance: number;
  escrowBalance: number;
  currency: string;
  isActive: boolean;
  isFrozen: boolean;
  totalEarnings: number;
  totalSpent: number;
  totalWithdrawals: number;
}

export interface WalletDocument extends Wallet, Document {}

const walletSchema = new Schema<WalletDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    escrowBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const Wallet = model<WalletDocument>("Wallet", walletSchema);
```

### Step 1.3: Create Transaction Model

**File**: `src/db/models/transaction.model.ts`

```typescript
import { Schema, Types, model, type Document } from "mongoose";

export interface Transaction {
  type: "platform_fee" | "service_fee" | "contractor_payout" | "refund" | "deposit" | "withdrawal" | "escrow_hold" | "escrow_release";
  amount: number;
  from: Types.ObjectId;
  to: Types.ObjectId;
  offer?: Types.ObjectId;
  job?: Types.ObjectId;
  status: "pending" | "completed" | "failed";
  description: string;
  failureReason?: string;
  completedAt?: Date;
}

export interface TransactionDocument extends Transaction, Document {}

const transactionSchema = new Schema<TransactionDocument>(
  {
    type: {
      type: String,
      enum: ["platform_fee", "service_fee", "contractor_payout", "refund", "deposit", "withdrawal", "escrow_hold", "escrow_release"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    offer: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      index: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    failureReason: String,
    completedAt: Date,
  },
  { timestamps: true }
);

// Indexes
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });

export const Transaction = model<TransactionDocument>("Transaction", transactionSchema);
```

### Step 1.4: Update Job Model

**File**: `src/db/models/job.model.ts`

Add these fields to existing schema:

```typescript
// Add to interface
contractorId?: Types.ObjectId;
offerId?: Types.ObjectId;
assignedAt?: Date;
completedAt?: Date;
cancelledAt?: Date;
cancellationReason?: string;

// Update status enum
status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";

// Add to schema
contractorId: {
  type: Schema.Types.ObjectId,
  ref: "User",
  index: true,
},
offerId: {
  type: Schema.Types.ObjectId,
  ref: "Offer",
},
assignedAt: Date,
completedAt: Date,
cancelledAt: Date,
cancellationReason: String,
```

### Step 1.5: Update JobApplicationRequest Model

**File**: `src/db/models/job-application-request.model.ts`

Update status enum and add offerId:

```typescript
// Update interface
status: "pending" | "accepted" | "rejected" | "offer_sent";
offerId?: Types.ObjectId;

// Update schema
status: {
  type: String,
  enum: ["pending", "accepted", "rejected", "offer_sent"],
  default: "pending",
},
offerId: {
  type: Schema.Types.ObjectId,
  ref: "Offer",
},
```

### Step 1.6: Register Models

**File**: `src/db/index.ts`

```typescript
import { Offer } from "./models/offer.model";
import { Wallet } from "./models/wallet.model";
import { Transaction } from "./models/transaction.model";

export const db = {
  // ... existing models
  offer: Offer,
  wallet: Wallet,
  transaction: Transaction,
};
```


## Phase 2: Payment Configuration (Day 2)

### Step 2.1: Create Payment Constants

**File**: `src/common/payment-config.ts`

```typescript
export const PAYMENT_CONFIG = {
  // Commission rates (percentage)
  PLATFORM_FEE_PERCENT: 5,           // Charged to buyer
  SERVICE_FEE_PERCENT: 20,           // Deducted from seller
  
  // Calculated rates
  BUYER_TOTAL_PERCENT: 105,          // Buyer pays 105%
  CONTRACTOR_PAYOUT_PERCENT: 80,     // Contractor gets 80%
  ADMIN_TOTAL_PERCENT: 25,           // Admin gets 25% total
  
  // Currency
  CURRENCY: "USD",
  
  // Limits
  MIN_JOB_BUDGET: 10,                // Minimum $10
  MAX_JOB_BUDGET: 10000,             // Maximum $10,000
  MIN_WALLET_BALANCE: 0,
  
  // Offer expiration
  OFFER_EXPIRY_DAYS: 7,              // Offers expire after 7 days
};

/**
 * Calculate all payment amounts for a job
 */
export const calculatePaymentAmounts = (jobBudget: number) => {
  const platformFee = jobBudget * (PAYMENT_CONFIG.PLATFORM_FEE_PERCENT / 100);
  const serviceFee = jobBudget * (PAYMENT_CONFIG.SERVICE_FEE_PERCENT / 100);
  const contractorPayout = jobBudget - serviceFee;
  const totalCharge = jobBudget + platformFee;
  const adminTotal = platformFee + serviceFee;
  
  return {
    jobBudget,
    platformFee,
    serviceFee,
    contractorPayout,
    totalCharge,
    adminTotal,
  };
};

/**
 * Example:
 * calculatePaymentAmounts(100)
 * Returns:
 * {
 *   jobBudget: 100,
 *   platformFee: 5,
 *   serviceFee: 20,
 *   contractorPayout: 80,
 *   totalCharge: 105,
 *   adminTotal: 25
 * }
 */
```

### Step 2.2: Update Constants File

**File**: `src/common/constants.ts`

Add wallet and offer tags:

```typescript
export const openAPITags = {
  // ... existing tags
  wallet: {
    name: "Wallet",
    basepath: "/api/wallet",
  },
};
```

## Phase 3: Wallet Module (Day 3-4)

### Step 3.1: Generate Wallet Module

```bash
bun run generate:module --module wallet
```

### Step 3.2: Create Wallet Validation

**File**: `src/api/wallet/wallet.validation.ts`

```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const DepositSchema = z.object({
  amount: z.number().positive().openapi({ description: "Amount to deposit" }),
  paymentMethodId: z.string().min(1).openapi({ description: "Payment method ID" }),
}).openapi("Deposit");

export const WithdrawSchema = z.object({
  amount: z.number().positive().openapi({ description: "Amount to withdraw" }),
}).openapi("Withdraw");

export const TransactionQuerySchema = z.object({
  type: z.enum(["platform_fee", "service_fee", "contractor_payout", "refund", "deposit", "withdrawal", "escrow_hold", "escrow_release"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
}).openapi("TransactionQuery");

export type Deposit = z.infer<typeof DepositSchema>;
export type Withdraw = z.infer<typeof WithdrawSchema>;
export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;
```

### Step 3.3: Create Wallet Services

**File**: `src/api/wallet/services/get-wallet.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess } from "@/helpers";
import { db } from "@/db";

export const getWallet: RequestHandler = async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get or create wallet
    let wallet = await db.wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = await db.wallet.create({
        user: userId,
        balance: 0,
        escrowBalance: 0,
        currency: "USD",
      });
    }

    return sendSuccess(res, 200, "Wallet retrieved successfully", wallet);
  } catch (error) {
    console.error("Error getting wallet:", error);
    return sendInternalError(res, "Failed to get wallet");
  }
};
```

**File**: `src/api/wallet/services/deposit.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";
import type { Deposit } from "../wallet.validation";

export const deposit: RequestHandler<{}, any, Deposit> = async (req, res) => {
  try {
    const userId = req.user!.id;
    const { amount, paymentMethodId } = req.body;

    // Validate amount
    if (amount < 10) {
      return sendBadRequest(res, "Minimum deposit amount is $10");
    }

    // TODO: Process payment with Stripe
    // For now, just add to wallet

    // Get or create wallet
    let wallet = await db.wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: userId,
        balance: 0,
        escrowBalance: 0,
      });
    }

    // Update wallet
    wallet.balance += amount;
    await wallet.save();

    // Create transaction record
    await db.transaction.create({
      type: "deposit",
      amount,
      from: userId,
      to: userId,
      status: "completed",
      description: `Wallet deposit of $${amount}`,
      completedAt: new Date(),
    });

    return sendSuccess(res, 200, "Deposit successful", {
      wallet,
      transaction: { amount, type: "deposit" },
    });
  } catch (error) {
    console.error("Error depositing:", error);
    return sendInternalError(res, "Failed to deposit");
  }
};
```

**File**: `src/api/wallet/services/get-transactions.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess } from "@/helpers";
import { db } from "@/db";

export const getTransactions: RequestHandler = async (req, res) => {
  try {
    const userId = req.user!.id;
    const { type, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {
      $or: [{ from: userId }, { to: userId }],
    };

    if (type) {
      query.type = type;
    }

    // Get transactions
    const transactions = await db.transaction
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("from", "full_name email")
      .populate("to", "full_name email");

    const total = await db.transaction.countDocuments(query);

    return sendSuccess(res, 200, "Transactions retrieved successfully", {
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error getting transactions:", error);
    return sendInternalError(res, "Failed to get transactions");
  }
};
```

### Step 3.4: Create Wallet Routes

**File**: `src/api/wallet/wallet.route.ts`

```typescript
import "./wallet.openapi";

import { requireAuth } from "@/middleware";
import { validateBody, validateQuery } from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import { DepositSchema, WithdrawSchema, TransactionQuerySchema } from "./wallet.validation";
import { getWallet, deposit, getTransactions } from "./services";

export const wallet: Router = express.Router();

// Get wallet balance
wallet.get("/", requireAuth, getWallet);

// Deposit money
wallet.post("/deposit", requireAuth, validateBody(DepositSchema), deposit);

// Get transaction history
wallet.get("/transactions", requireAuth, validateQuery(TransactionQuerySchema), getTransactions);

// TODO: Withdraw money (contractors only)
```

### Step 3.5: Register Wallet Module

**File**: `src/app.ts`

```typescript
import { wallet } from "@/api/wallet/wallet.route";

// Register route
app.use("/api/wallet", wallet);
```


## Phase 4: Extend Job-Request Module for Offers (Day 5-7)

### Step 4.1: Update Job-Request Validation

**File**: `src/api/job-request/job-request.validation.ts`

Add these schemas:

```typescript
// Send offer schema
export const SendOfferSchema = z.object({
  amount: z.number().positive().openapi({ description: "Job budget amount" }),
  timeline: z.string().min(1).openapi({ description: "Expected completion time" }),
  description: z.string().min(1).openapi({ description: "Work description" }),
}).openapi("SendOffer");

// Offer ID parameter schema
export const OfferIdParamSchema = z.object({
  offerId: z.string().min(1).openapi({ description: "Offer ID" }),
}).openapi("OfferIdParam");

// Reject offer schema
export const RejectOfferSchema = z.object({
  reason: z.string().min(1).openapi({ description: "Rejection reason" }),
}).openapi("RejectOffer");

// Export types
export type SendOffer = z.infer<typeof SendOfferSchema>;
export type OfferIdParam = z.infer<typeof OfferIdParamSchema>;
export type RejectOffer = z.infer<typeof RejectOfferSchema>;
```

### Step 4.2: Create Send Offer Service

**File**: `src/api/job-request/services/send-offer.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";
import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import type { SendOffer } from "../job-request.validation";

export const sendOffer: RequestHandler<{ applicationId: string }, any, SendOffer> = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const customerId = req.user!.id;
    const { amount, timeline, description } = req.body;

    // 1. Validate application
    const application = await db.jobApplicationRequest.findById(applicationId)
      .populate("job")
      .populate("contractor", "full_name email");

    if (!application) {
      return sendBadRequest(res, "Application not found");
    }

    const job = application.job as any;

    // 2. Verify customer owns the job
    if (job.customerId.toString() !== customerId) {
      return sendBadRequest(res, "Not authorized");
    }

    // 3. Check job is still open
    if (job.status !== "open") {
      return sendBadRequest(res, "Job is not open for offers");
    }

    // 4. Check for existing offer
    const existingOffer = await db.offer.findOne({
      job: job._id,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingOffer) {
      return sendBadRequest(res, "An offer already exists for this job");
    }

    // 5. Calculate payment amounts
    const amounts = calculatePaymentAmounts(amount);

    // 6. Check wallet balance
    let wallet = await db.wallet.findOne({ user: customerId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: customerId,
        balance: 0,
        escrowBalance: 0,
      });
    }

    if (wallet.balance < amounts.totalCharge) {
      return sendBadRequest(
        res,
        `Insufficient balance. Required: $${amounts.totalCharge}, Available: $${wallet.balance}`
      );
    }

    // 7. Create offer
    const offer = await db.offer.create({
      job: job._id,
      customer: customerId,
      contractor: application.contractor._id,
      application: applicationId,
      amount: amounts.jobBudget,
      platformFee: amounts.platformFee,
      serviceFee: amounts.serviceFee,
      contractorPayout: amounts.contractorPayout,
      totalCharge: amounts.totalCharge,
      timeline,
      description,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // 8. Deduct from wallet and move to escrow
    wallet.balance -= amounts.totalCharge;
    wallet.escrowBalance += amounts.totalCharge;
    wallet.totalSpent += amounts.totalCharge;
    await wallet.save();

    // 9. Create transaction record
    await db.transaction.create({
      type: "escrow_hold",
      amount: amounts.totalCharge,
      from: customerId,
      to: "escrow",
      offer: offer._id,
      job: job._id,
      status: "completed",
      description: `Escrow hold for job offer: $${amounts.totalCharge}`,
      completedAt: new Date(),
    });

    // 10. Update application status
    application.status = "offer_sent";
    application.offerId = offer._id;
    await application.save();

    // 11. Send notification to contractor
    await NotificationService.sendToUser({
      userId: application.contractor._id.toString(),
      title: "New Offer Received",
      body: `You received an offer of $${amount} for "${job.title}"`,
      type: "booking_confirmed",
      data: {
        offerId: offer._id.toString(),
        jobId: job._id.toString(),
        amount: amount.toString(),
      },
    });

    return sendSuccess(res, 201, "Offer sent successfully", {
      offer,
      walletBalance: wallet.balance,
      amounts,
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    return sendInternalError(res, "Failed to send offer");
  }
};
```

### Step 4.3: Create Accept Offer Service

**File**: `src/api/job-request/services/accept-offer.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";
import { NotificationService } from "@/common/service/notification.service";

export const acceptOfferService: RequestHandler = async (req, res) => {
  try {
    const { offerId } = req.params;
    const contractorId = req.user!.id;

    // 1. Validate offer
    const offer = await db.offer.findOne({
      _id: offerId,
      contractor: contractorId,
      status: "pending",
    }).populate("job").populate("customer", "full_name email");

    if (!offer) {
      return sendBadRequest(res, "Offer not found or already processed");
    }

    const job = offer.job as any;

    // 2. Update offer status
    offer.status = "accepted";
    offer.acceptedAt = new Date();
    await offer.save();

    // 3. Update job
    job.status = "assigned";
    job.contractorId = contractorId;
    job.offerId = offerId;
    job.assignedAt = new Date();
    await job.save();

    // 4. Update application
    await db.jobApplicationRequest.findByIdAndUpdate(offer.application, {
      status: "accepted",
    });

    // 5. Reject other applications
    await db.jobApplicationRequest.updateMany(
      {
        job: job._id,
        _id: { $ne: offer.application },
        status: "pending",
      },
      {
        status: "rejected",
      }
    );

    // 6. Transfer platform fee to admin
    const adminWallet = await db.wallet.findOneAndUpdate(
      { user: "admin" }, // You need to create admin user
      {
        $inc: {
          balance: offer.platformFee,
          totalEarnings: offer.platformFee,
        },
      },
      { upsert: true, new: true }
    );

    // 7. Update customer escrow
    await db.wallet.findOneAndUpdate(
      { user: offer.customer },
      {
        $inc: {
          escrowBalance: -offer.platformFee,
        },
      }
    );

    // 8. Create transaction for platform fee
    await db.transaction.create({
      type: "platform_fee",
      amount: offer.platformFee,
      from: offer.customer,
      to: "admin",
      offer: offerId,
      job: job._id,
      status: "completed",
      description: `Platform fee (5%) for accepted offer`,
      completedAt: new Date(),
    });

    // 9. Send notifications
    await NotificationService.sendToUser({
      userId: offer.customer._id.toString(),
      title: "Offer Accepted",
      body: `Your offer has been accepted by the contractor`,
      type: "booking_confirmed",
      data: {
        offerId: offerId.toString(),
        jobId: job._id.toString(),
      },
    });

    // Notify rejected applicants
    const rejectedApplications = await db.jobApplicationRequest.find({
      job: job._id,
      status: "rejected",
    }).populate("contractor", "_id");

    for (const app of rejectedApplications) {
      await NotificationService.sendToUser({
        userId: (app.contractor as any)._id.toString(),
        title: "Job Filled",
        body: `The job "${job.title}" has been filled`,
        type: "general",
      });
    }

    return sendSuccess(res, 200, "Offer accepted successfully", {
      offer,
      job,
      payment: {
        platformFee: offer.platformFee,
        serviceFee: offer.serviceFee,
        contractorPayout: offer.contractorPayout,
      },
    });
  } catch (error) {
    console.error("Error accepting offer:", error);
    return sendInternalError(res, "Failed to accept offer");
  }
};
```

### Step 4.4: Create Reject Offer Service

**File**: `src/api/job-request/services/reject-offer.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";
import { NotificationService } from "@/common/service/notification.service";
import type { RejectOffer } from "../job-request.validation";

export const rejectOfferService: RequestHandler<{ offerId: string }, any, RejectOffer> = async (req, res) => {
  try {
    const { offerId } = req.params;
    const contractorId = req.user!.id;
    const { reason } = req.body;

    // 1. Validate offer
    const offer = await db.offer.findOne({
      _id: offerId,
      contractor: contractorId,
      status: "pending",
    }).populate("customer", "full_name email");

    if (!offer) {
      return sendBadRequest(res, "Offer not found or already processed");
    }

    // 2. Update offer status
    offer.status = "rejected";
    offer.rejectedAt = new Date();
    offer.rejectionReason = reason;
    await offer.save();

    // 3. Update application
    await db.jobApplicationRequest.findByIdAndUpdate(offer.application, {
      status: "rejected",
    });

    // 4. Refund customer wallet
    await db.wallet.findOneAndUpdate(
      { user: offer.customer },
      {
        $inc: {
          balance: offer.totalCharge,
          escrowBalance: -offer.totalCharge,
        },
      }
    );

    // 5. Create refund transaction
    await db.transaction.create({
      type: "refund",
      amount: offer.totalCharge,
      from: "escrow",
      to: offer.customer,
      offer: offerId,
      job: offer.job,
      status: "completed",
      description: `Refund for rejected offer: $${offer.totalCharge}`,
      completedAt: new Date(),
    });

    // 6. Send notification to customer
    await NotificationService.sendToUser({
      userId: offer.customer._id.toString(),
      title: "Offer Rejected",
      body: `Your offer was rejected. Reason: ${reason}`,
      type: "booking_declined",
      data: {
        offerId: offerId.toString(),
        jobId: offer.job.toString(),
      },
    });

    return sendSuccess(res, 200, "Offer rejected successfully", {
      offer,
      refundAmount: offer.totalCharge,
    });
  } catch (error) {
    console.error("Error rejecting offer:", error);
    return sendInternalError(res, "Failed to reject offer");
  }
};
```

### Step 4.5: Update Job-Request Routes

**File**: `src/api/job-request/job-request.route.ts`

Add these routes:

```typescript
import { SendOfferSchema, OfferIdParamSchema, RejectOfferSchema } from "./job-request.validation";
import { sendOffer, acceptOfferService, rejectOfferService } from "./services";

// Customer sends offer
jobRequest.post(
  "/:applicationId/send-offer",
  requireAuth,
  requireRole("customer"),
  validateParams(ApplicationIdParamSchema),
  validateBody(SendOfferSchema),
  sendOffer
);

// Contractor accepts offer
jobRequest.post(
  "/offer/:offerId/accept",
  requireAuth,
  requireRole("contractor"),
  validateParams(OfferIdParamSchema),
  acceptOfferService
);

// Contractor rejects offer
jobRequest.post(
  "/offer/:offerId/reject",
  requireAuth,
  requireRole("contractor"),
  validateParams(OfferIdParamSchema),
  validateBody(RejectOfferSchema),
  rejectOfferService
);
```

### Step 4.6: Export New Services

**File**: `src/api/job-request/services/index.ts`

```typescript
export * from "./send-offer.service";
export * from "./accept-offer.service";
export * from "./reject-offer.service";
```


## Phase 5: Job Completion & Payment Release (Day 8-9)

### Step 5.1: Create Complete Job Service

**File**: `src/api/job/services/complete-job.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";
import { NotificationService } from "@/common/service/notification.service";

export const completeJob: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const customerId = req.user!.id;

    // 1. Validate job
    const job = await db.job.findOne({
      _id: jobId,
      customerId,
      status: "in_progress",
    });

    if (!job) {
      return sendBadRequest(res, "Job not found or not in progress");
    }

    // 2. Get offer
    const offer = await db.offer.findOne({
      job: jobId,
      status: "accepted",
    });

    if (!offer) {
      return sendBadRequest(res, "Offer not found");
    }

    // 3. Update job status
    job.status = "completed";
    job.completedAt = new Date();
    await job.save();

    // 4. Update offer status
    offer.status = "completed";
    offer.completedAt = new Date();
    await offer.save();

    // 5. Transfer service fee to admin
    await db.wallet.findOneAndUpdate(
      { user: "admin" },
      {
        $inc: {
          balance: offer.serviceFee,
          totalEarnings: offer.serviceFee,
        },
      },
      { upsert: true }
    );

    // 6. Transfer contractor payout
    let contractorWallet = await db.wallet.findOne({ user: job.contractorId });
    if (!contractorWallet) {
      contractorWallet = await db.wallet.create({
        user: job.contractorId,
        balance: 0,
        escrowBalance: 0,
      });
    }

    contractorWallet.balance += offer.contractorPayout;
    contractorWallet.totalEarnings += offer.contractorPayout;
    await contractorWallet.save();

    // 7. Release from escrow
    await db.wallet.findOneAndUpdate(
      { user: customerId },
      {
        $inc: {
          escrowBalance: -(offer.serviceFee + offer.contractorPayout),
        },
      }
    );

    // 8. Create transaction records
    await db.transaction.create({
      type: "service_fee",
      amount: offer.serviceFee,
      from: customerId,
      to: "admin",
      offer: offer._id,
      job: jobId,
      status: "completed",
      description: `Service fee (20%) for completed job`,
      completedAt: new Date(),
    });

    await db.transaction.create({
      type: "contractor_payout",
      amount: offer.contractorPayout,
      from: customerId,
      to: job.contractorId,
      offer: offer._id,
      job: jobId,
      status: "completed",
      description: `Payment for completed job: $${offer.contractorPayout}`,
      completedAt: new Date(),
    });

    // 9. Send notifications
    await NotificationService.sendToUser({
      userId: job.contractorId.toString(),
      title: "Payment Released",
      body: `You received $${offer.contractorPayout} for completing the job`,
      type: "payment_received",
      data: {
        jobId: jobId.toString(),
        amount: offer.contractorPayout.toString(),
      },
    });

    return sendSuccess(res, 200, "Job marked as complete", {
      job,
      payment: {
        serviceFee: offer.serviceFee,
        contractorPayout: offer.contractorPayout,
        adminCommission: offer.platformFee + offer.serviceFee,
      },
    });
  } catch (error) {
    console.error("Error completing job:", error);
    return sendInternalError(res, "Failed to complete job");
  }
};
```

### Step 5.2: Create Update Job Status Service

**File**: `src/api/job/services/update-job-status.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";
import { NotificationService } from "@/common/service/notification.service";

export const updateJobStatus: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 1. Validate job
    const job = await db.job.findById(jobId);

    if (!job) {
      return sendBadRequest(res, "Job not found");
    }

    // 2. Authorization check
    if (userRole === "contractor" && job.contractorId?.toString() !== userId) {
      return sendBadRequest(res, "Not authorized");
    }

    if (userRole === "customer" && job.customerId.toString() !== userId) {
      return sendBadRequest(res, "Not authorized");
    }

    // 3. Validate status transition
    const allowedTransitions: Record<string, string[]> = {
      open: ["assigned", "cancelled"],
      assigned: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[job.status].includes(status)) {
      return sendBadRequest(res, `Cannot transition from ${job.status} to ${status}`);
    }

    // 4. Update job status
    job.status = status;
    await job.save();

    // 5. Send notification
    const notificationTarget = userRole === "contractor" ? job.customerId : job.contractorId;
    
    if (notificationTarget) {
      await NotificationService.sendToUser({
        userId: notificationTarget.toString(),
        title: "Job Status Updated",
        body: `Job status changed to: ${status}`,
        type: "general",
        data: {
          jobId: jobId.toString(),
          status,
        },
      });
    }

    return sendSuccess(res, 200, "Job status updated", job);
  } catch (error) {
    console.error("Error updating job status:", error);
    return sendInternalError(res, "Failed to update job status");
  }
};
```

### Step 5.3: Update Job Routes

**File**: `src/api/job/job.route.ts`

Add these routes:

```typescript
import { completeJob, updateJobStatus } from "./services";

// Mark job complete (Customer only)
job.post(
  "/:jobId/complete",
  requireAuth,
  requireRole("customer"),
  validateParams(JobIdParamSchema),
  completeJob
);

// Update job status
job.patch(
  "/:jobId/status",
  requireAuth,
  requireAnyRole(["customer", "contractor"]),
  validateParams(JobIdParamSchema),
  validateBody(UpdateJobStatusSchema),
  updateJobStatus
);
```

### Step 5.4: Add Status Validation Schema

**File**: `src/api/job/job.validation.ts`

```typescript
export const UpdateJobStatusSchema = z.object({
  status: z.enum(["assigned", "in_progress", "completed", "cancelled"]),
}).openapi("UpdateJobStatus");

export type UpdateJobStatus = z.infer<typeof UpdateJobStatusSchema>;
```

## Phase 6: Testing (Day 10)

### Step 6.1: Create Test Data

Create an admin user in your database:

```javascript
// Run this in MongoDB shell or create a script
db.users.insertOne({
  _id: ObjectId("admin_user_id_here"),
  role: "admin",
  full_name: "Admin",
  email: "admin@jobsphere.com",
  // ... other required fields
});

// Create admin wallet
db.wallets.insertOne({
  user: ObjectId("admin_user_id_here"),
  balance: 0,
  escrowBalance: 0,
  currency: "USD",
  isActive: true,
  isFrozen: false,
  totalEarnings: 0,
  totalSpent: 0,
  totalWithdrawals: 0,
});
```

### Step 6.2: Test Flow Manually

1. **Create Customer Account**
   - Register as customer
   - Deposit $200 to wallet

2. **Create Contractor Account**
   - Register as contractor
   - Complete profile

3. **Post Job**
   - Customer posts job with $100 budget
   - Verify job appears in listings

4. **Apply to Job**
   - Contractor applies to job
   - Verify customer receives notification

5. **Send Offer**
   - Customer sends offer ($100)
   - Verify wallet deducted $105
   - Verify escrow holds $105
   - Verify contractor receives notification

6. **Accept Offer**
   - Contractor accepts offer
   - Verify job status changes to "assigned"
   - Verify admin wallet receives $5
   - Verify escrow now holds $100
   - Verify other applications rejected

7. **Start Work**
   - Contractor updates status to "in_progress"
   - Verify status change

8. **Complete Job**
   - Customer marks job complete
   - Verify admin wallet receives $20 (total $25)
   - Verify contractor wallet receives $80
   - Verify escrow released
   - Verify job status is "completed"

### Step 6.3: Verify Calculations

After completing a $100 job:

```
Customer:
- Paid: $105
- Wallet: $95 (if started with $200)

Admin:
- Platform Fee: $5
- Service Fee: $20
- Total: $25

Contractor:
- Received: $80

Escrow:
- Should be: $0
```

## Phase 7: Edge Cases & Error Handling (Day 11)

### Step 7.1: Handle Offer Expiration

Create a cron job or scheduled task:

**File**: `src/jobs/expire-offers.ts`

```typescript
import { db } from "@/db";

export const expireOffers = async () => {
  try {
    const expiredOffers = await db.offer.find({
      status: "pending",
      expiresAt: { $lt: new Date() },
    });

    for (const offer of expiredOffers) {
      // Update offer status
      offer.status = "expired";
      await offer.save();

      // Refund customer
      await db.wallet.findOneAndUpdate(
        { user: offer.customer },
        {
          $inc: {
            balance: offer.totalCharge,
            escrowBalance: -offer.totalCharge,
          },
        }
      );

      // Create refund transaction
      await db.transaction.create({
        type: "refund",
        amount: offer.totalCharge,
        from: "escrow",
        to: offer.customer,
        offer: offer._id,
        job: offer.job,
        status: "completed",
        description: "Refund for expired offer",
        completedAt: new Date(),
      });

      // Update application
      await db.jobApplicationRequest.findByIdAndUpdate(offer.application, {
        status: "pending",
      });

      console.log(`Expired offer ${offer._id}`);
    }
  } catch (error) {
    console.error("Error expiring offers:", error);
  }
};

// Run every hour
setInterval(expireOffers, 60 * 60 * 1000);
```

### Step 7.2: Handle Job Cancellation

**File**: `src/api/job/services/cancel-job.service.ts`

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess, sendBadRequest } from "@/helpers";
import { db } from "@/db";

export const cancelJob: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    const job = await db.job.findById(jobId);

    if (!job) {
      return sendBadRequest(res, "Job not found");
    }

    // Only customer or admin can cancel
    if (job.customerId.toString() !== userId && req.user!.role !== "admin") {
      return sendBadRequest(res, "Not authorized");
    }

    // Cannot cancel completed jobs
    if (job.status === "completed") {
      return sendBadRequest(res, "Cannot cancel completed job");
    }

    // Get offer if exists
    const offer = await db.offer.findOne({
      job: jobId,
      status: { $in: ["pending", "accepted"] },
    });

    if (offer) {
      // Refund customer
      await db.wallet.findOneAndUpdate(
        { user: offer.customer },
        {
          $inc: {
            balance: offer.totalCharge,
            escrowBalance: -offer.totalCharge,
          },
        }
      );

      // Create refund transaction
      await db.transaction.create({
        type: "refund",
        amount: offer.totalCharge,
        from: "escrow",
        to: offer.customer,
        offer: offer._id,
        job: jobId,
        status: "completed",
        description: "Refund for cancelled job",
        completedAt: new Date(),
      });

      // Update offer
      offer.status = "cancelled";
      offer.cancelledAt = new Date();
      offer.cancellationReason = reason;
      await offer.save();
    }

    // Update job
    job.status = "cancelled";
    job.cancelledAt = new Date();
    job.cancellationReason = reason;
    await job.save();

    return sendSuccess(res, 200, "Job cancelled successfully", {
      job,
      refundAmount: offer?.totalCharge || 0,
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return sendInternalError(res, "Failed to cancel job");
  }
};
```

## Phase 8: Documentation & Deployment (Day 12)

### Step 8.1: Update OpenAPI Documentation

Ensure all new endpoints are documented in their respective `.openapi.ts` files.

### Step 8.2: Create Admin Dashboard Endpoints

**File**: `src/api/admin/admin-payment/admin-payment.route.ts`

```typescript
// Get commission earnings
router.get("/earnings", requireAuth, requireRole("admin"), getEarnings);

// Get all transactions
router.get("/transactions", requireAuth, requireRole("admin"), getAllTransactions);

// Get wallet details
router.get("/wallets", requireAuth, requireRole("admin"), getAllWallets);
```

### Step 8.3: Environment Variables

Add to `.env`:

```env
# Admin User ID (create this user first)
ADMIN_USER_ID=your_admin_user_id_here

# Payment Configuration
PLATFORM_FEE_PERCENT=5
SERVICE_FEE_PERCENT=20
MIN_JOB_BUDGET=10
MAX_JOB_BUDGET=10000
OFFER_EXPIRY_DAYS=7
```

### Step 8.4: Deploy

1. Test thoroughly in development
2. Run database migrations
3. Create admin user
4. Deploy to staging
5. Test complete flow in staging
6. Deploy to production
7. Monitor for issues

## Summary Checklist

- [ ] All database models created
- [ ] Models registered in `db/index.ts`
- [ ] Payment configuration constants created
- [ ] Wallet module implemented
- [ ] Job-request module extended with offer functionality
- [ ] Job module extended with completion functionality
- [ ] All services tested manually
- [ ] Calculations verified
- [ ] Edge cases handled
- [ ] OpenAPI documentation updated
- [ ] Admin endpoints created
- [ ] Environment variables configured
- [ ] Deployed to production

## Next Steps After Implementation

1. Monitor transaction logs
2. Track commission earnings
3. Handle customer support issues
4. Optimize database queries
5. Add analytics dashboard
6. Implement dispute resolution
7. Add payment method options (Stripe, PayPal, etc.)
8. Create automated reports

---

**Congratulations!** You now have a complete payment system integrated with your existing job marketplace.
