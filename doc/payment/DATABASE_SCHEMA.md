# Database Schema

## Overview

This document describes all database models required for the payment and bidding system.

## Existing Models (To Be Updated)

### Job Model

**File**: `src/db/models/job.model.ts`

**Current Schema**:
```typescript
interface Job {
  title: string;
  category: Types.ObjectId[];
  jobApplicationRequest: Types.ObjectId[];
  description: string;
  location: Types.ObjectId;
  address: string;
  budget: number;
  date: Date;
  coverImg: string;
  customerId: Types.ObjectId;
  status: "open" | "in_progress" | "completed" | "cancelled";
}
```

**Required Updates**:
```typescript
interface Job {
  title: string;
  category: Types.ObjectId[];
  jobApplicationRequest: Types.ObjectId[];
  description: string;
  location: Types.ObjectId;
  address: string;
  budget: number;
  date: Date;
  coverImg: string;
  customerId: Types.ObjectId;
  
  // NEW FIELDS
  contractorId?: Types.ObjectId;        // Assigned contractor
  offerId?: Types.ObjectId;              // Accepted offer
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  assignedAt?: Date;                     // When contractor was assigned
  completedAt?: Date;                    // When job was completed
  cancelledAt?: Date;                    // When job was cancelled
  cancellationReason?: string;           // Why job was cancelled
}
```

**Indexes**:
```typescript
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ customerId: 1, status: 1 });
JobSchema.index({ contractorId: 1, status: 1 });
JobSchema.index({ category: 1, status: 1 });
```

---

### JobApplicationRequest Model

**File**: `src/db/models/job-application-request.model.ts`

**Current Schema** (No changes needed):
```typescript
interface JobApplicationRequest {
  job: Types.ObjectId;
  contractor: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  message?: string;
}
```

---

## New Models (To Be Created)

### 1. Offer Model

**File**: `src/db/models/offer.model.ts`

**Purpose**: Store offers sent by customers to contractors

**Schema**:
```typescript
import { Schema, Types, model, type Document } from "mongoose";

export interface Offer {
  job: Types.ObjectId;                   // Reference to Job
  customer: Types.ObjectId;              // Reference to Customer
  contractor: Types.ObjectId;            // Reference to Contractor
  amount: number;                        // Offer amount in dollars
  timeline: string;                      // Expected completion time
  description: string;                   // Work description
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
  
  // Payment details
  paymentIntentId: string;               // Stripe Payment Intent ID
  paymentStatus: "pending" | "captured" | "refunded";
  
  // Timestamps
  acceptedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  expiresAt?: Date;                      // Offer expiration (optional)
  
  // Rejection/Cancellation
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
    amount: {
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
      enum: ["pending", "accepted", "rejected", "cancelled", "expired"],
      default: "pending",
      index: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "captured", "refunded"],
      default: "pending",
    },
    acceptedAt: Date,
    rejectedAt: Date,
    cancelledAt: Date,
    expiresAt: Date,
    rejectionReason: String,
    cancellationReason: String,
  },
  { timestamps: true }
);

// Indexes
offerSchema.index({ job: 1, status: 1 });
offerSchema.index({ contractor: 1, status: 1 });
offerSchema.index({ customer: 1, status: 1 });
offerSchema.index({ createdAt: -1 });

// Prevent duplicate pending offers for same job-contractor pair
offerSchema.index(
  { job: 1, contractor: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: "pending" }
  }
);

export const Offer = model<OfferDocument>("Offer", offerSchema);
```

---

### 2. Payment Model

**File**: `src/db/models/payment.model.ts`

**Purpose**: Track all payment transactions

**Schema**:
```typescript
import { Schema, Types, model, type Document } from "mongoose";

export interface Payment {
  offer: Types.ObjectId;                 // Reference to Offer
  job: Types.ObjectId;                   // Reference to Job
  customer: Types.ObjectId;              // Reference to Customer
  contractor: Types.ObjectId;            // Reference to Contractor
  
  // Amounts
  totalAmount: number;                   // Total offer amount
  platformFee: number;                   // 10% platform fee
  serviceFee: number;                    // 20% service fee
  contractorPayout: number;              // 70% contractor payout
  
  // Stripe details
  paymentIntentId: string;               // Stripe Payment Intent ID
  transferId?: string;                   // Stripe Transfer ID (to contractor)
  refundId?: string;                     // Stripe Refund ID (if refunded)
  
  // Status
  status: "pending" | "captured" | "released" | "refunded" | "failed";
  
  // Timestamps
  capturedAt?: Date;                     // When payment was captured
  releasedAt?: Date;                     // When payment was released
  refundedAt?: Date;                     // When payment was refunded
  
  // Metadata
  failureReason?: string;
  refundReason?: string;
}

export interface PaymentDocument extends Payment, Document {}

const paymentSchema = new Schema<PaymentDocument>(
  {
    offer: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
      unique: true,
      index: true,
    },
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
    totalAmount: {
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
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    transferId: String,
    refundId: String,
    status: {
      type: String,
      enum: ["pending", "captured", "released", "refunded", "failed"],
      default: "pending",
      index: true,
    },
    capturedAt: Date,
    releasedAt: Date,
    refundedAt: Date,
    failureReason: String,
    refundReason: String,
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ customer: 1, status: 1 });
paymentSchema.index({ contractor: 1, status: 1 });

export const Payment = model<PaymentDocument>("Payment", paymentSchema);
```

---

### 3. Transaction Model

**File**: `src/db/models/transaction.model.ts`

**Purpose**: Audit trail for all financial transactions

**Schema**:
```typescript
import { Schema, Types, model, type Document } from "mongoose";

export interface Transaction {
  type: "platform_fee" | "service_fee" | "contractor_payout" | "refund" | "withdrawal";
  amount: number;
  
  // References
  from: Types.ObjectId;                  // User ID (payer)
  to: Types.ObjectId;                    // User ID (receiver)
  offer?: Types.ObjectId;                // Reference to Offer
  job?: Types.ObjectId;                  // Reference to Job
  payment?: Types.ObjectId;              // Reference to Payment
  
  // Status
  status: "pending" | "completed" | "failed";
  
  // Metadata
  description: string;
  stripeTransactionId?: string;
  failureReason?: string;
  
  // Timestamps
  completedAt?: Date;
}

export interface TransactionDocument extends Transaction, Document {}

const transactionSchema = new Schema<TransactionDocument>(
  {
    type: {
      type: String,
      enum: ["platform_fee", "service_fee", "contractor_payout", "refund", "withdrawal"],
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
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
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
    stripeTransactionId: String,
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

---

### 4. Wallet Model

**File**: `src/db/models/wallet.model.ts`

**Purpose**: Track user and admin wallet balances

**Schema**:
```typescript
import { Schema, Types, model, type Document } from "mongoose";

export interface Wallet {
  user: Types.ObjectId;                  // Reference to User (or admin)
  balance: number;                       // Current balance
  currency: string;                      // Currency code (USD)
  
  // Stripe Connect (for contractors)
  stripeAccountId?: string;              // Stripe Connect account ID
  stripeAccountStatus?: "pending" | "active" | "restricted";
  
  // Status
  isActive: boolean;
  isFrozen: boolean;                     // Admin can freeze wallet
  
  // Metadata
  totalEarnings: number;                 // Lifetime earnings
  totalWithdrawals: number;              // Lifetime withdrawals
  pendingBalance: number;                // Balance pending release
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
    currency: {
      type: String,
      default: "USD",
    },
    stripeAccountId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripeAccountStatus: {
      type: String,
      enum: ["pending", "active", "restricted"],
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
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Indexes
walletSchema.index({ user: 1 });
walletSchema.index({ isActive: 1, isFrozen: 1 });

export const Wallet = model<WalletDocument>("Wallet", walletSchema);
```

---

## Database Relationships

```
User (Customer)
  ├── has many Jobs
  ├── has many Offers (sent)
  ├── has many Payments (made)
  ├── has many Transactions
  └── has one Wallet

User (Contractor)
  ├── has many JobApplicationRequests
  ├── has many Offers (received)
  ├── has many Jobs (assigned)
  ├── has many Payments (received)
  ├── has many Transactions
  └── has one Wallet

Job
  ├── belongs to Customer (User)
  ├── belongs to Contractor (User) [optional]
  ├── has many JobApplicationRequests
  ├── has many Offers
  ├── has one Payment [optional]
  └── has many Transactions

Offer
  ├── belongs to Job
  ├── belongs to Customer (User)
  ├── belongs to Contractor (User)
  ├── has one Payment
  └── has many Transactions

Payment
  ├── belongs to Offer
  ├── belongs to Job
  ├── belongs to Customer (User)
  ├── belongs to Contractor (User)
  └── has many Transactions

Transaction
  ├── belongs to User (from)
  ├── belongs to User (to)
  ├── belongs to Offer [optional]
  ├── belongs to Job [optional]
  └── belongs to Payment [optional]

Wallet
  └── belongs to User
```

---

## Database Indexes Summary

### Performance Indexes
- Job: `status`, `customerId`, `contractorId`, `category`
- Offer: `job`, `contractor`, `customer`, `status`
- Payment: `offer`, `job`, `customer`, `contractor`, `status`
- Transaction: `type`, `from`, `to`, `status`
- Wallet: `user`, `isActive`

### Unique Indexes
- Offer: `paymentIntentId`
- Payment: `offer`, `paymentIntentId`
- Wallet: `user`, `stripeAccountId`

### Compound Indexes
- Offer: `(job, contractor, status)` - Prevent duplicate pending offers
- Transaction: `(type, status, createdAt)` - Fast transaction queries

---

## Data Validation Rules

### Amount Validation
- All amounts must be positive numbers
- Amounts stored in dollars (not cents)
- Use Decimal.js for precise calculations

### Status Transitions
- Job: `open` → `assigned` → `in_progress` → `completed`/`cancelled`
- Offer: `pending` → `accepted`/`rejected`/`cancelled`/`expired`
- Payment: `pending` → `captured` → `released`/`refunded`
- Transaction: `pending` → `completed`/`failed`

### Referential Integrity
- All ObjectId references must exist
- Cascade delete not implemented (soft delete preferred)
- Orphaned records handled by cleanup jobs

---

## Migration Strategy

### Phase 1: Create New Models
1. Create Offer model
2. Create Payment model
3. Create Transaction model
4. Create Wallet model

### Phase 2: Update Existing Models
1. Add new fields to Job model
2. Update Job status enum
3. Add indexes

### Phase 3: Data Migration
1. Create wallets for existing users
2. Migrate existing job data (if any)
3. Verify data integrity

### Phase 4: Testing
1. Test all CRUD operations
2. Test relationships
3. Test indexes performance
4. Load testing

---

## Backup & Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery enabled
- Backup retention: 30 days

### Critical Collections
- Payments (financial data)
- Transactions (audit trail)
- Wallets (balance tracking)

### Recovery Procedures
- Document recovery steps
- Test recovery process monthly
- Maintain backup verification logs

---

## Summary

This schema design ensures:
- ✅ Data integrity
- ✅ Audit trail for all transactions
- ✅ Efficient queries with proper indexes
- ✅ Scalability for future growth
- ✅ Clear relationships between entities
- ✅ Support for Stripe integration
- ✅ Wallet management for users and admin
