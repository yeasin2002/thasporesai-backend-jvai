# Payment & Bidding System Architecture

## System Overview

JobSphere's payment and bidding system is a commission-based marketplace that connects customers with contractors through a secure payment flow using Stripe.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Customer (Buyer)                             │
│                                                                       │
│  Actions:                                                            │
│  • Post Job                                                          │
│  • Review Applications                                               │
│  • Chat with Contractors                                             │
│  • Send Offer (with payment)                                         │
│  • Mark Job Complete                                                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend System                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    API Layer                                  │  │
│  │                                                                │  │
│  │  /api/job              - Job management                       │  │
│  │  /api/job-request      - Application handling                │  │
│  │  /api/chat             - Communication                        │  │
│  │  /api/bidding          - Offer management                     │  │
│  │  /api/payment          - Payment processing                   │  │
│  │  /api/wallet           - Wallet management                    │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                            │                                         │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │              Business Logic Layer                             │  │
│  │                                                                │  │
│  │  • Job Lifecycle Management                                   │  │
│  │  • Offer Processing                                           │  │
│  │  • Payment Calculation (10% + 20% fees)                       │  │
│  │  • Wallet Operations                                          │  │
│  │  • Transaction Recording                                      │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                            │                                         │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │              Database Layer (MongoDB)                         │  │
│  │                                                                │  │
│  │  Collections:                                                 │  │
│  │  • jobs                                                       │  │
│  │  • jobapplicationrequests                                     │  │
│  │  • offers                                                     │  │
│  │  • payments                                                   │  │
│  │  • transactions                                               │  │
│  │  • wallets                                                    │  │
│  │  • users                                                      │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                            │                                         │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │              Stripe Integration                               │  │
│  │                                                                │  │
│  │  • Payment Intent Creation                                    │  │
│  │  • Payment Capture/Hold                                       │  │
│  │  • Stripe Connect (Contractor Payouts)                        │  │
│  │  • Webhook Handling                                           │  │
│  │  • Refund Processing                                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Contractor (Seller)                             │
│                                                                       │
│  Actions:                                                            │
│  • Browse Jobs                                                       │
│  • Send Application                                                  │
│  • Chat with Customer                                                │
│  • Accept/Reject Offer                                               │
│  • Complete Work                                                     │
│  • Receive Payment                                                   │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Admin Panel                                  │
│                                                                       │
│  Actions:                                                            │
│  • Monitor Transactions                                              │
│  • View Commission Earnings                                          │
│  • Release Payments                                                  │
│  • Handle Disputes                                                   │
│  • Manage Wallets                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Job Module (`/api/job`)

**Purpose**: Manage job lifecycle from creation to completion

**Key Features**:

- Job creation by customers
- Job listing and search
- Job status management
- Job assignment to contractor

**Status Flow**:

```
open → assigned → in_progress → completed/cancelled
```

### 2. Job Request Module (`/api/job-request`)

**Purpose**: Handle contractor applications to jobs

**Key Features**:

- Application submission
- Application listing for customers
- Application status tracking

**Status Flow**:

```
pending → accepted/rejected
```

### 3. Chat Module (`/api/chat`)

**Purpose**: Enable communication between customers and contractors

**Key Features**:

- Real-time messaging
- Conversation history
- File sharing
- Read receipts

### 4. Bidding Module (`/api/bidding`) - NEW

**Purpose**: Manage offers between customers and contractors

**Key Features**:

- Offer creation by customer
- Offer acceptance/rejection by contractor
- Offer history and tracking
- Payment integration

**Components**:

- Offer Model
- Offer validation
- Offer services
- Offer API endpoints

### 5. Payment Module (`/api/payment`) - NEW

**Purpose**: Handle all payment processing via Stripe

**Key Features**:

- Payment intent creation
- Payment capture
- Commission calculation
- Payment release
- Refund processing

**Components**:

- Payment Model
- Stripe service
- Payment validation
- Payment API endpoints

### 6. Wallet Module (`/api/wallet`) - NEW

**Purpose**: Manage user and admin wallets

**Key Features**:

- Wallet creation
- Balance tracking
- Transaction history
- Withdrawal requests

**Components**:

- Wallet Model
- Transaction Model
- Wallet services
- Wallet API endpoints

## Data Flow

### Offer Creation Flow

```
1. Customer sends offer
   ↓
2. Create Offer record (status: pending)
   ↓
3. Create Payment Intent in Stripe
   ↓
4. Store payment details
   ↓
5. Notify contractor
   ↓
6. Return offer details to customer
```

### Offer Acceptance Flow

```
1. Contractor accepts offer
   ↓
2. Update Offer status (pending → accepted)
   ↓
3. Capture payment from Stripe
   ↓
4. Calculate fees (10% platform fee)
   ↓
5. Update Job (status: assigned, contractorId)
   ↓
6. Create Transaction records
   ↓
7. Update Admin wallet (+10%)
   ↓
8. Notify customer
   ↓
9. Block other offers for this job
```

### Job Completion Flow

```
1. Customer marks job complete
   ↓
2. Update Job status (in_progress → completed)
   ↓
3. Calculate service fee (20%)
   ↓
4. Calculate contractor payout (70% of offer)
   ↓
5. Update Admin wallet (+20%)
   ↓
6. Update Contractor wallet (+70%)
   ↓
7. Create Transaction records
   ↓
8. Notify contractor
   ↓
9. Release payment via Stripe Connect
```

## Commission Structure

### Platform Fee (10%)

- **When**: Deducted when offer is accepted
- **From**: Total offer amount
- **To**: Admin wallet
- **Purpose**: Platform usage fee

### Service Fee (20%)

- **When**: Deducted when job is completed
- **From**: Total offer amount
- **To**: Admin wallet
- **Purpose**: Service completion fee

### Contractor Payout (70%)

- **When**: Job is completed
- **From**: Total offer amount
- **To**: Contractor wallet
- **Calculation**: 100% - 10% - 20% = 70%

### Example Calculation

```
Offer Amount: $1000

On Acceptance:
- Platform Fee (10%): $100 → Admin Wallet
- Held Amount: $900 → Stripe Hold

On Completion:
- Service Fee (20%): $200 → Admin Wallet
- Contractor Payout (70%): $700 → Contractor Wallet
- Total Admin Commission: $300 (30%)
```

## Security Considerations

### Payment Security

- All payments processed through Stripe
- PCI compliance handled by Stripe
- No credit card data stored in database
- Secure webhook verification

### Data Protection

- Sensitive data encrypted at rest
- JWT authentication for all endpoints
- Role-based access control
- Input validation with Zod schemas

### Transaction Integrity

- Atomic database operations
- Transaction rollback on failure
- Idempotency keys for Stripe
- Audit trail for all transactions

## Scalability Considerations

### Database

- Indexed fields for fast queries
- Pagination for large datasets
- Aggregation pipelines for reports

### Payment Processing

- Async payment processing
- Webhook queue for reliability
- Retry mechanism for failed payments

### Caching

- Cache frequently accessed data
- Redis for session management
- Rate limiting for API endpoints

## Error Handling

### Payment Failures

- Automatic retry with exponential backoff
- Customer notification
- Admin alert for manual intervention

### Webhook Failures

- Webhook event queue
- Retry mechanism
- Dead letter queue for failed events

### Database Failures

- Transaction rollback
- Error logging
- User-friendly error messages

## Monitoring & Logging

### Key Metrics

- Payment success rate
- Average transaction time
- Commission earnings
- Failed payment count
- Wallet balances

### Logging

- All payment transactions
- Stripe webhook events
- Error logs with stack traces
- User actions audit trail

## Future Enhancements

### Phase 2

- Milestone-based payments
- Escrow service
- Dispute resolution system
- Automated refunds

### Phase 3

- Multiple payment methods
- Cryptocurrency support
- Subscription plans
- Loyalty rewards

---

**Note**: This architecture is designed to be simple and minimal while maintaining security and reliability. Additional features can be added incrementally based on business needs.
