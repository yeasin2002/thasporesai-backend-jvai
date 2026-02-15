# Design Document: Stripe Payment Integration

## Overview

The Stripe Payment Integration implements a secure, scalable payment system for the JobSphere marketplace. The architecture minimizes real money transfers by using Stripe as a "bank" that holds actual funds, while the database tracks user wallet balances through simple balance adjustments. Real money transfers only occur during customer deposits (via Stripe Checkout) and admin-approved payouts (via Stripe Connect). All offer-related transactions (acceptance, rejection, cancellation, expiration) are handled through database-only wallet adjustments, ensuring fast operations and reduced Stripe API costs.

### Key Design Principles

1. **Minimize Real Money Transfers**: Only deposits and admin-approved payouts involve Stripe API calls
2. **Database as Source of Truth**: Wallet balances tracked in MongoDB, Stripe holds actual money
3. **Atomic Operations**: All wallet adjustments use MongoDB transactions for consistency
4. **Admin Approval for Outflows**: All money leaving the system requires admin approval
5. **Complete Audit Trail**: Every balance change creates a Transaction record
6. **Security First**: Webhook signature verification, role-based access control, balance validation

## Architecture

### High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Customer  │         │  Contractor  │         │    Admin    │
│   (Mobile)  │         │   (Mobile)   │         │ (Dashboard) │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │ REST API              │ REST API               │ REST API
       │                       │                        │
       ▼                       ▼                        ▼
┌────────────────────────────────────────────────────────────────┐
│                    Express.js Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Wallet     │  │  Job/Offer   │  │    Admin     │        │
│  │   Service    │  │   Service    │  │   Service    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                │
│                            │                                    │
│                    ┌───────▼────────┐                          │
│                    │  MongoDB with  │                          │
│                    │  Transactions  │                          │
│                    └───────┬────────┘                          │
└────────────────────────────┼───────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Stripe API     │
                    │  ┌───────────┐  │
                    │  │ Checkout  │  │ ← Customer deposits
                    │  └───────────┘  │
                    │  ┌───────────┐  │
                    │  │  Connect  │  │ ← Contractor payouts
                    │  └───────────┘  │
                    │  ┌───────────┐  │
                    │  │ Webhooks  │  │ ← Payment confirmations
                    │  └───────────┘  │
                    └─────────────────┘
```

### Payment Flow Architecture

```
DEPOSIT FLOW (Real Money Transfer):
Customer → Backend → Stripe Checkout → Customer Browser → Stripe Payment
                                                              ↓
Backend ← Webhook ← Stripe (payment confirmed)
   ↓
Update DB Wallet Balance

OFFER ACCEPTANCE FLOW (DB-Only):
Contractor → Backend → MongoDB Transaction
                         ↓
                    Customer Wallet: -$105
                    Admin Wallet: +$105
                    Offer Status: accepted
                    Job Status: assigned
                    Transaction Record: wallet_transfer

JOB COMPLETION FLOW (DB + Real Money Transfer):
Customer → Backend → Completion Request (pending)
                         ↓
Admin → Backend → MongoDB Transaction + Stripe Connect Transfer
                    ↓                      ↓
            Admin Wallet: -$80      Stripe → Contractor Bank
            Contractor Wallet: +$80
            Transaction Record: contractor_payout
            Job Status: completed

CANCELLATION FLOW (DB-Only):
User → Backend → MongoDB Transaction
                    ↓
                Admin Wallet: -$105
                Customer Wallet: +$105
                Transaction Record: refund
                Job Status: cancelled
```

## Components and Interfaces

### 1. Wallet Service

**Responsibilities**:

- Manage wallet balances and transactions
- Create Stripe Checkout Sessions for deposits
- Process Stripe webhooks for deposit confirmations
- Handle withdrawal requests (create pending requests)
- Provide transaction history with pagination

**Key Methods**:

```typescript
interface WalletService {
  // Get wallet balance and details
  getWallet(userId: string): Promise<Wallet>;

  // Create Stripe Checkout Session for deposit
  createDepositSession(
    userId: string,
    amount: number
  ): Promise<{ url: string }>;

  // Process Stripe webhook events
  handleWebhook(signature: string, payload: string): Promise<void>;

  // Create withdrawal request (pending admin approval)
  requestWithdrawal(userId: string, amount: number): Promise<WithdrawalRequest>;

  // Get transaction history with pagination
  getTransactions(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedTransactions>;

  // Internal: Update wallet balance (used by other services)
  updateBalance(
    userId: string,
    amount: number,
    session: ClientSession
  ): Promise<void>;
}
```

### 2. Offer Service

**Responsibilities**:

- Create offers with commission calculations
- Handle offer acceptance with DB-only wallet transfers
- Handle offer rejection with DB-only refunds
- Validate customer wallet balance before offer creation
- Manage offer lifecycle and status transitions

**Key Methods**:

```typescript
interface OfferService {
  // Create offer (balance validation only, no deduction)
  createOffer(applicationId: string, offerData: OfferData): Promise<Offer>;

  // Accept offer (DB-only wallet transfer)
  acceptOffer(offerId: string, contractorId: string): Promise<Offer>;

  // Reject offer (DB-only refund if accepted)
  rejectOffer(
    offerId: string,
    contractorId: string,
    reason: string
  ): Promise<Offer>;

  // Calculate commission breakdown
  calculateCommissions(budget: number): CommissionBreakdown;

  // Validate customer has sufficient balance
  validateCustomerBalance(
    customerId: string,
    totalCharge: number
  ): Promise<boolean>;
}
```

### 3. Job Completion Service

**Responsibilities**:

- Handle job completion requests from customers
- Create pending completion requests for admin approval
- Process admin approval with DB wallet updates and Stripe Connect transfer
- Update job and offer statuses
- Handle job cancellations with DB-only refunds

**Key Methods**:

```typescript
interface JobCompletionService {
  // Customer marks job complete (creates pending request)
  requestCompletion(
    jobId: string,
    customerId: string
  ): Promise<CompletionRequest>;

  // Admin approves completion (DB update + Stripe transfer)
  approveCompletion(
    requestId: string,
    adminId: string
  ): Promise<CompletionRequest>;

  // Admin rejects completion request
  rejectCompletion(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<CompletionRequest>;

  // Cancel job (DB-only refund)
  cancelJob(jobId: string, userId: string, reason: string): Promise<Job>;
}
```

### 4. Stripe Connect Service

**Responsibilities**:

- Manage contractor Stripe Connect accounts
- Generate onboarding links for contractors
- Check account status and verification
- Initiate transfers to contractor bank accounts
- Handle Stripe Connect webhooks

**Key Methods**:

```typescript
interface StripeConnectService {
  // Create or retrieve Stripe Connect account
  getOrCreateConnectAccount(contractorId: string): Promise<string>;

  // Generate onboarding link
  createOnboardingLink(
    contractorId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<{ url: string }>;

  // Check account status
  getAccountStatus(contractorId: string): Promise<ConnectAccountStatus>;

  // Initiate transfer to contractor
  createTransfer(
    contractorId: string,
    amount: number,
    description: string
  ): Promise<string>;

  // Verify account can receive payouts
  canReceivePayouts(contractorId: string): Promise<boolean>;
}
```

### 5. Admin Approval Service

**Responsibilities**:

- Manage completion request approvals
- Manage withdrawal request approvals
- Coordinate DB updates with Stripe transfers
- Handle approval workflow state transitions

**Key Methods**:

```typescript
interface AdminApprovalService {
  // Get pending completion requests
  getPendingCompletionRequests(
    page: number,
    limit: number
  ): Promise<PaginatedRequests>;

  // Get pending withdrawal requests
  getPendingWithdrawalRequests(
    page: number,
    limit: number
  ): Promise<PaginatedRequests>;

  // Approve completion (calls JobCompletionService)
  approveCompletion(requestId: string, adminId: string): Promise<void>;

  // Approve withdrawal (DB update + Stripe transfer)
  approveWithdrawal(requestId: string, adminId: string): Promise<void>;

  // Reject requests with reason
  rejectRequest(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<void>;
}
```

### 6. Cron Job Service

**Responsibilities**:

- Run hourly to check for expired offers
- Process expired offers with DB-only refunds
- Send notifications for expirations
- Update application and offer statuses

**Key Methods**:

```typescript
interface CronJobService {
  // Check and process expired offers
  processExpiredOffers(): Promise<void>;

  // Find offers that have expired
  findExpiredOffers(): Promise<Offer[]>;

  // Refund expired offer (DB-only)
  refundExpiredOffer(offer: Offer): Promise<void>;
}
```

## Data Models

### Wallet Model (Updated)

```typescript
interface Wallet {
  _id: ObjectId;
  user: ObjectId; // Reference to User
  balance: number; // Single balance (no escrow)
  currency: string; // "USD"
  isActive: boolean; // Wallet active status
  isFrozen: boolean; // Admin can freeze for security
  totalEarnings: number; // Lifetime earnings (contractors)
  totalSpent: number; // Lifetime spending (customers)
  totalWithdrawals: number; // Lifetime withdrawals (contractors)
  stripeCustomerId: string | null; // For deposits (all users)
  stripeConnectAccountId: string | null; // For payouts (contractors only)
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// - user: unique
// - stripeCustomerId: sparse
// - stripeConnectAccountId: sparse
```

**Changes from v1.0**:

- ❌ Removed `escrowBalance` field
- ✅ Added `stripeCustomerId` for all users
- ✅ Added `stripeConnectAccountId` for contractors

### Transaction Model (Updated)

```typescript
interface Transaction {
  _id: ObjectId;
  type: TransactionType; // deposit, withdrawal, wallet_transfer, contractor_payout, refund
  amount: number; // Transaction amount
  from: ObjectId | null; // Sender user (null for deposits)
  to: ObjectId | null; // Receiver user (null for withdrawals)
  offer: ObjectId | null; // Related offer
  job: ObjectId | null; // Related job
  status: TransactionStatus; // pending, completed, failed
  description: string; // Human-readable description
  failureReason: string | null; // Error message if failed
  stripePaymentIntentId: string | null; // For deposits
  stripeTransferId: string | null; // For payouts/withdrawals
  stripeCheckoutSessionId: string | null; // For deposits
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

enum TransactionType {
  DEPOSIT = "deposit", // Real money via Stripe Checkout
  WITHDRAWAL = "withdrawal", // Real money via Stripe Connect
  WALLET_TRANSFER = "wallet_transfer", // DB-only (offer acceptance)
  CONTRACTOR_PAYOUT = "contractor_payout", // DB + Stripe transfer
  REFUND = "refund", // DB-only (cancellations/rejections)
}

enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Indexes:
// - from, to, createdAt (compound for history queries)
// - offer, job (for audit trail)
// - stripeCheckoutSessionId: sparse, unique
```

**Changes from v1.0**:

- ✅ Added `stripePaymentIntentId`
- ✅ Added `stripeTransferId`
- ✅ Added `stripeCheckoutSessionId`
- ✅ Updated transaction types to reflect new flow

### Offer Model (No Changes)

```typescript
interface Offer {
  _id: ObjectId;
  job: ObjectId; // Reference to Job (unique index)
  customer: ObjectId; // Reference to Customer
  contractor: ObjectId; // Reference to Contractor
  application: ObjectId; // Reference to Application
  amount: number; // Job budget (e.g., 100)
  platformFee: number; // 5% (e.g., 5)
  serviceFee: number; // 20% (e.g., 20)
  contractorPayout: number; // 80% (e.g., 80)
  totalCharge: number; // Budget + platform fee (e.g., 105)
  timeline: string; // Expected completion timeline
  description: string; // Offer details
  status: OfferStatus; // pending, accepted, rejected, cancelled, completed, expired
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  cancelledAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date; // Auto-expires after 7 days
  rejectionReason: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

enum OfferStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  EXPIRED = "expired",
}

// Indexes:
// - job: unique (one offer per job)
// - contractor, status
// - expiresAt (for cron job)
```

### Completion Request Model (New)

```typescript
interface CompletionRequest {
  _id: ObjectId;
  job: ObjectId; // Reference to Job
  offer: ObjectId; // Reference to Offer
  customer: ObjectId; // Customer who requested
  contractor: ObjectId; // Contractor who completed work
  status: RequestStatus; // pending, approved, rejected
  approvedBy: ObjectId | null; // Admin who approved
  rejectedBy: ObjectId | null; // Admin who rejected
  rejectionReason: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

enum RequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Indexes:
// - job: unique
// - status, createdAt (for admin dashboard)
```

### Withdrawal Request Model (New)

```typescript
interface WithdrawalRequest {
  _id: ObjectId;
  contractor: ObjectId; // Contractor requesting withdrawal
  amount: number; // Withdrawal amount
  status: RequestStatus; // pending, approved, rejected
  approvedBy: ObjectId | null; // Admin who approved
  rejectedBy: ObjectId | null; // Admin who rejected
  rejectionReason: string | null;
  stripeTransferId: string | null; // Stripe transfer ID when approved
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// - contractor, status, createdAt
// - status, createdAt (for admin dashboard)
```

### Job Model (Extended)

```typescript
// Existing Job model extended with payment-related fields
interface Job {
  // ... existing fields ...
  contractorId: ObjectId | null; // Assigned contractor
  offerId: ObjectId | null; // Related offer
  assignedAt: Date | null; // When offer was accepted
  completedAt: Date | null; // When job was completed
  // ... existing fields ...
}
```

## API Specifications

### Wallet Endpoints

#### POST /api/wallet/deposit

Create Stripe Checkout Session for deposit.

**Request**:

```typescript
{
  amount: number; // Amount to deposit in dollars (min: 1, max: 10000)
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Checkout session created successfully",
  data: {
    url: string,              // Stripe Checkout URL
    sessionId: string         // Checkout session ID
  }
}
```

**Authentication**: Required (any role)

#### POST /api/webhooks/stripe

Handle Stripe webhook events (no authentication, signature verified).

**Headers**:

```
stripe-signature: <webhook_signature>
```

**Events Handled**:

- `checkout.session.completed`: Process successful deposit
- `checkout.session.async_payment_succeeded`: Process async payment success
- `checkout.session.async_payment_failed`: Log payment failure

**Response**: 200 OK (always, to acknowledge receipt)

#### POST /api/wallet/withdraw

Request withdrawal (contractors only).

**Request**:

```typescript
{
  amount: number; // Amount to withdraw (min: 10, max: wallet balance)
}
```

**Response**:

```typescript
{
  status: 201,
  success: true,
  message: "Withdrawal request created successfully",
  data: {
    requestId: string,
    amount: number,
    status: "pending"
  }
}
```

**Authentication**: Required (contractor role)

#### GET /api/wallet

Get wallet balance and details.

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Wallet retrieved successfully",
  data: {
    balance: number,
    currency: string,
    totalEarnings: number,
    totalSpent: number,
    totalWithdrawals: number,
    isActive: boolean,
    isFrozen: boolean,
    stripeConnectStatus: "not_connected" | "pending" | "verified" | "restricted"
  }
}
```

**Authentication**: Required (any role)

#### GET /api/wallet/transactions

Get transaction history with pagination.

**Query Parameters**:

```typescript
{
  page?: number,    // Default: 1
  limit?: number    // Default: 20, max: 100
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Transactions retrieved successfully",
  data: {
    transactions: Transaction[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
}
```

**Authentication**: Required (any role)

### Offer Endpoints

#### POST /api/job-request/:applicationId/send-offer

Customer sends offer to contractor.

**Request**:

```typescript
{
  amount: number,       // Job budget
  timeline: string,     // Expected completion timeline
  description: string   // Offer details
}
```

**Response**:

```typescript
{
  status: 201,
  success: true,
  message: "Offer sent successfully",
  data: {
    offerId: string,
    amount: number,
    platformFee: number,
    serviceFee: number,
    contractorPayout: number,
    totalCharge: number,
    status: "pending",
    expiresAt: Date
  }
}
```

**Authentication**: Required (customer role, job owner)

**Validation**:

- Customer must have sufficient balance (totalCharge)
- Job must be in "open" status
- No existing offer for this job

#### POST /api/job-request/offer/:offerId/accept

Contractor accepts offer.

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Offer accepted successfully",
  data: {
    offerId: string,
    status: "accepted",
    jobStatus: "assigned",
    acceptedAt: Date
  }
}
```

**Authentication**: Required (contractor role, offer recipient)

**Side Effects**:

- Customer wallet: -totalCharge
- Admin wallet: +totalCharge
- Job status: "assigned"
- Offer status: "accepted"
- Transaction record created (wallet_transfer)

#### POST /api/job-request/offer/:offerId/reject

Contractor rejects offer.

**Request**:

```typescript
{
  reason: string; // Rejection reason
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Offer rejected successfully",
  data: {
    offerId: string,
    status: "rejected",
    rejectedAt: Date
  }
}
```

**Authentication**: Required (contractor role, offer recipient)

**Side Effects** (if offer was accepted):

- Admin wallet: -totalCharge
- Customer wallet: +totalCharge (refund)
- Transaction record created (refund)

### Job Completion Endpoints

#### POST /api/job/:id/complete

Customer marks job as complete.

**Response**:

```typescript
{
  status: 201,
  success: true,
  message: "Completion request created successfully",
  data: {
    requestId: string,
    jobId: string,
    status: "pending"
  }
}
```

**Authentication**: Required (customer role, job owner)

**Validation**:

- Job must be in "in_progress" status
- Job must have an accepted offer

#### POST /api/admin/completion-requests/:id/approve

Admin approves job completion.

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Completion approved successfully",
  data: {
    requestId: string,
    jobId: string,
    stripeTransferId: string,
    contractorPayout: number,
    status: "approved"
  }
}
```

**Authentication**: Required (admin role)

**Side Effects**:

- Admin wallet: -contractorPayout
- Contractor wallet: +contractorPayout
- Stripe Connect transfer initiated
- Job status: "completed"
- Offer status: "completed"
- Transaction record created (contractor_payout)

#### POST /api/admin/completion-requests/:id/reject

Admin rejects completion request.

**Request**:

```typescript
{
  reason: string; // Rejection reason
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Completion request rejected",
  data: {
    requestId: string,
    status: "rejected",
    reason: string
  }
}
```

**Authentication**: Required (admin role)

#### POST /api/job/:id/cancel

Cancel job (triggers refund if offer was accepted).

**Request**:

```typescript
{
  reason: string; // Cancellation reason
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Job cancelled successfully",
  data: {
    jobId: string,
    status: "cancelled",
    refundAmount: number | null
  }
}
```

**Authentication**: Required (customer or contractor, job participant)

**Side Effects** (if offer was accepted):

- Admin wallet: -totalCharge
- Customer wallet: +totalCharge (refund)
- Transaction record created (refund)

### Stripe Connect Endpoints

#### POST /api/wallet/stripe/onboard

Get Stripe Connect onboarding link.

**Request**:

```typescript
{
  refreshUrl: string,  // URL to return if onboarding needs refresh
  returnUrl: string    // URL to return after successful onboarding
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Onboarding link created successfully",
  data: {
    url: string,              // Stripe Connect onboarding URL
    accountId: string         // Stripe Connect account ID
  }
}
```

**Authentication**: Required (contractor role)

#### GET /api/wallet/stripe/status

Check Stripe Connect account status.

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Account status retrieved successfully",
  data: {
    accountId: string | null,
    status: "not_connected" | "pending" | "verified" | "restricted",
    payoutsEnabled: boolean,
    requirementsNeeded: string[]
  }
}
```

**Authentication**: Required (contractor role)

### Admin Approval Endpoints

#### GET /api/admin/completion-requests

Get pending completion requests.

**Query Parameters**:

```typescript
{
  page?: number,    // Default: 1
  limit?: number,   // Default: 20
  status?: "pending" | "approved" | "rejected"  // Default: "pending"
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Completion requests retrieved successfully",
  data: {
    requests: CompletionRequest[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
}
```

**Authentication**: Required (admin role)

#### GET /api/admin/withdrawal-requests

Get pending withdrawal requests.

**Query Parameters**:

```typescript
{
  page?: number,    // Default: 1
  limit?: number,   // Default: 20
  status?: "pending" | "approved" | "rejected"  // Default: "pending"
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Withdrawal requests retrieved successfully",
  data: {
    requests: WithdrawalRequest[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
}
```

**Authentication**: Required (admin role)

#### POST /api/admin/withdrawal-requests/:id/approve

Admin approves withdrawal request.

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Withdrawal approved successfully",
  data: {
    requestId: string,
    stripeTransferId: string,
    amount: number,
    status: "approved"
  }
}
```

**Authentication**: Required (admin role)

**Side Effects**:

- Contractor wallet: -amount
- Stripe Connect transfer initiated
- Transaction record created (withdrawal)

#### POST /api/admin/withdrawal-requests/:id/reject

Admin rejects withdrawal request.

**Request**:

```typescript
{
  reason: string; // Rejection reason
}
```

**Response**:

```typescript
{
  status: 200,
  success: true,
  message: "Withdrawal request rejected",
  data: {
    requestId: string,
    status: "rejected",
    reason: string
  }
}
```

**Authentication**: Required (admin role)
