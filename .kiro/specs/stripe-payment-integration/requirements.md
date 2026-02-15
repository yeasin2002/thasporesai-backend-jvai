# Requirements Document: Stripe Payment Integration

## Introduction

This document specifies the requirements for implementing a Stripe-integrated payment system for the JobSphere marketplace backend. The system enables customers to deposit funds via Stripe Checkout, manages wallet balances through database-only transactions for offers, and processes contractor payouts through Stripe Connect with admin approval. The architecture minimizes real money transfers by using Stripe as a "bank" while tracking all transactions via database wallet balances.

## Glossary

- **Customer**: A user who posts jobs and sends payment offers to contractors
- **Contractor**: A user who applies to jobs, accepts offers, and receives payments
- **Admin**: A system administrator who approves completion requests and withdrawal requests
- **Wallet**: A database record tracking a user's balance and transaction history
- **Offer**: A payment proposal from customer to contractor for a specific job
- **Platform_Fee**: 5% commission charged to customer when offer is accepted
- **Service_Fee**: 20% commission deducted from contractor when job is completed
- **Stripe_Checkout**: Stripe's hosted payment page for collecting customer deposits
- **Stripe_Connect**: Stripe's platform for transferring funds to contractor bank accounts
- **Wallet_Transfer**: A database-only balance adjustment between user wallets
- **Real_Money_Transfer**: An actual money movement involving Stripe API calls
- **Completion_Request**: A pending request created when customer marks job complete
- **Withdrawal_Request**: A pending request created when contractor requests withdrawal
- **Transaction**: An audit record of any money movement in the system

## Requirements

### Requirement 1: Customer Deposit via Stripe Checkout

**User Story:** As a customer, I want to deposit money into my wallet using Stripe Checkout, so that I can fund job offers securely.

#### Acceptance Criteria

1. WHEN a customer requests a deposit, THE System SHALL create a Stripe Checkout Session and return the session URL
2. WHEN the Stripe Checkout Session is created, THE System SHALL store the customer's Stripe Customer ID in the Wallet record
3. WHEN a customer completes payment on Stripe, THE Stripe SHALL send a webhook event to the backend
4. WHEN the webhook event is received, THE System SHALL verify the webhook signature for security
5. WHEN the webhook signature is valid and payment succeeds, THE System SHALL update the customer's wallet balance
6. WHEN the wallet balance is updated, THE System SHALL create a Transaction record with type "deposit"
7. IF the webhook signature is invalid, THEN THE System SHALL reject the webhook and log the security violation
8. IF the payment fails on Stripe, THEN THE System SHALL not update the wallet balance

### Requirement 2: Offer Acceptance with Database-Only Wallet Transfer

**User Story:** As a contractor, I want to accept job offers, so that I can start working and receive payment upon completion.

#### Acceptance Criteria

1. WHEN a contractor accepts an offer, THE System SHALL validate that the customer has sufficient wallet balance
2. WHEN the balance is sufficient, THE System SHALL perform database-only wallet adjustments within a MongoDB transaction
3. WHEN performing wallet adjustments, THE System SHALL deduct the total charge (budget + 5%) from the customer's wallet
4. WHEN performing wallet adjustments, THE System SHALL add the total charge to the admin wallet
5. WHEN wallet adjustments complete, THE System SHALL update the offer status to "accepted"
6. WHEN wallet adjustments complete, THE System SHALL update the job status to "assigned"
7. WHEN wallet adjustments complete, THE System SHALL create a Transaction record with type "wallet_transfer"
8. IF the MongoDB transaction fails, THEN THE System SHALL rollback all changes and return an error
9. THE System SHALL NOT initiate any Stripe API calls during offer acceptance

### Requirement 3: Offer Rejection with Database-Only Refund

**User Story:** As a contractor, I want to reject job offers, so that I can decline work that doesn't fit my schedule or expertise.

#### Acceptance Criteria

1. WHEN a contractor rejects an accepted offer, THE System SHALL perform database-only wallet adjustments within a MongoDB transaction
2. WHEN performing refund adjustments, THE System SHALL deduct the total charge from the admin wallet
3. WHEN performing refund adjustments, THE System SHALL add the total charge back to the customer's wallet
4. WHEN refund adjustments complete, THE System SHALL update the offer status to "rejected"
5. WHEN refund adjustments complete, THE System SHALL create a Transaction record with type "refund"
6. IF the MongoDB transaction fails, THEN THE System SHALL rollback all changes and return an error
7. THE System SHALL NOT initiate any Stripe API calls during offer rejection

### Requirement 4: Job Completion with Admin-Approved Payout

**User Story:** As a customer, I want to mark jobs as complete, so that the contractor receives payment after work is finished.

#### Acceptance Criteria

1. WHEN a customer marks a job complete, THE System SHALL create a Completion_Request with status "pending"
2. WHEN an admin approves a completion request, THE System SHALL perform database-only wallet adjustments within a MongoDB transaction
3. WHEN performing payout adjustments, THE System SHALL deduct the contractor payout (80% of budget) from the admin wallet
4. WHEN performing payout adjustments, THE System SHALL add the contractor payout to the contractor's wallet
5. WHEN wallet adjustments complete, THE System SHALL initiate a Stripe Connect transfer to the contractor's bank account
6. WHEN the Stripe transfer is initiated, THE System SHALL create a Transaction record with type "contractor_payout"
7. WHEN the Stripe transfer is initiated, THE System SHALL update the job status to "completed"
8. WHEN the Stripe transfer is initiated, THE System SHALL update the offer status to "completed"
9. IF the MongoDB transaction fails, THEN THE System SHALL rollback all changes and not initiate the Stripe transfer
10. IF the Stripe transfer fails, THEN THE System SHALL log the error and mark the transaction as failed

### Requirement 5: Job Cancellation with Database-Only Refund

**User Story:** As a customer or contractor, I want to cancel jobs, so that I can receive a refund if circumstances change.

#### Acceptance Criteria

1. WHEN a job with an accepted offer is cancelled, THE System SHALL perform database-only wallet adjustments within a MongoDB transaction
2. WHEN performing cancellation refund, THE System SHALL deduct the total charge from the admin wallet
3. WHEN performing cancellation refund, THE System SHALL add the total charge back to the customer's wallet
4. WHEN refund adjustments complete, THE System SHALL update the job status to "cancelled"
5. WHEN refund adjustments complete, THE System SHALL update the offer status to "cancelled"
6. WHEN refund adjustments complete, THE System SHALL create a Transaction record with type "refund"
7. IF the MongoDB transaction fails, THEN THE System SHALL rollback all changes and return an error
8. THE System SHALL NOT initiate any Stripe API calls during job cancellation

### Requirement 6: Contractor Withdrawal with Admin Approval

**User Story:** As a contractor, I want to withdraw money from my wallet to my bank account, so that I can access my earnings.

#### Acceptance Criteria

1. WHEN a contractor requests a withdrawal, THE System SHALL validate that the contractor has sufficient wallet balance
2. WHEN a contractor requests a withdrawal, THE System SHALL validate that the contractor has a verified Stripe Connect account
3. WHEN validation passes, THE System SHALL create a Withdrawal_Request with status "pending"
4. WHEN an admin approves a withdrawal request, THE System SHALL initiate a Stripe Connect transfer to the contractor's bank account
5. WHEN the Stripe transfer is initiated, THE System SHALL deduct the withdrawal amount from the contractor's wallet
6. WHEN the Stripe transfer is initiated, THE System SHALL create a Transaction record with type "withdrawal"
7. IF the contractor is not a contractor role, THEN THE System SHALL reject the withdrawal request
8. IF the Stripe Connect account is not verified, THEN THE System SHALL reject the withdrawal request
9. IF the Stripe transfer fails, THEN THE System SHALL not deduct from the wallet and mark the transaction as failed

### Requirement 7: Stripe Connect Onboarding for Contractors

**User Story:** As a contractor, I want to connect my bank account via Stripe Connect, so that I can receive payouts.

#### Acceptance Criteria

1. WHEN a contractor requests Stripe Connect onboarding, THE System SHALL create a Stripe Connect account if one doesn't exist
2. WHEN creating a Stripe Connect account, THE System SHALL store the account ID in the contractor's Wallet record
3. WHEN the account is created, THE System SHALL generate a Stripe Connect onboarding link
4. WHEN the onboarding link is generated, THE System SHALL return the URL to the contractor
5. WHEN a contractor completes onboarding, THE Stripe SHALL update the account status
6. THE System SHALL provide an endpoint to check the contractor's Stripe Connect account status

### Requirement 8: Automatic Offer Expiration

**User Story:** As a system administrator, I want offers to automatically expire after 7 days, so that funds are not held indefinitely.

#### Acceptance Criteria

1. WHEN an hourly cron job runs, THE System SHALL query all accepted offers with expiration dates in the past
2. WHEN an expired accepted offer is found, THE System SHALL perform database-only wallet adjustments within a MongoDB transaction
3. WHEN performing expiration refund, THE System SHALL deduct the total charge from the admin wallet
4. WHEN performing expiration refund, THE System SHALL add the total charge back to the customer's wallet
5. WHEN refund adjustments complete, THE System SHALL update the offer status to "expired"
6. WHEN refund adjustments complete, THE System SHALL reset the application status
7. WHEN refund adjustments complete, THE System SHALL create a Transaction record with type "refund"
8. WHEN refund adjustments complete, THE System SHALL send notifications to customer and contractor
9. THE System SHALL NOT initiate any Stripe API calls during offer expiration

### Requirement 9: Webhook Security and Validation

**User Story:** As a system administrator, I want webhook requests to be validated, so that only legitimate Stripe events are processed.

#### Acceptance Criteria

1. WHEN a webhook request is received, THE System SHALL extract the Stripe signature from the request headers
2. WHEN the signature is extracted, THE System SHALL verify it using the Stripe webhook secret
3. IF the signature is invalid, THEN THE System SHALL reject the request with a 400 error
4. IF the signature is valid, THEN THE System SHALL parse the webhook event payload
5. WHEN the event type is "checkout.session.completed", THE System SHALL process the successful deposit
6. WHEN the event type is "checkout.session.async_payment_succeeded", THE System SHALL process the successful deposit
7. WHEN the event type is "checkout.session.async_payment_failed", THE System SHALL log the failure
8. THE System SHALL respond with a 200 status code to acknowledge receipt of valid webhooks

### Requirement 10: Transaction Audit Trail

**User Story:** As a system administrator, I want complete transaction history, so that I can audit all money movements.

#### Acceptance Criteria

1. WHEN any wallet balance changes, THE System SHALL create a Transaction record
2. WHEN creating a Transaction record, THE System SHALL include the transaction type
3. WHEN creating a Transaction record, THE System SHALL include the amount
4. WHEN creating a Transaction record, THE System SHALL include the sender and receiver user IDs
5. WHEN creating a Transaction record, THE System SHALL include related offer and job IDs if applicable
6. WHEN creating a Transaction record for Stripe operations, THE System SHALL include Stripe IDs (payment intent, transfer, checkout session)
7. WHEN a transaction completes successfully, THE System SHALL update the transaction status to "completed"
8. WHEN a transaction fails, THE System SHALL update the transaction status to "failed" and record the failure reason
9. THE System SHALL provide an endpoint to retrieve transaction history with pagination

### Requirement 11: Commission Calculation and Distribution

**User Story:** As a system administrator, I want commissions to be calculated correctly, so that the platform generates revenue.

#### Acceptance Criteria

1. WHEN an offer is created, THE System SHALL calculate the platform fee as 5% of the job budget
2. WHEN an offer is created, THE System SHALL calculate the service fee as 20% of the job budget
3. WHEN an offer is created, THE System SHALL calculate the contractor payout as 80% of the job budget
4. WHEN an offer is created, THE System SHALL calculate the total charge as job budget plus platform fee
5. WHEN an offer is accepted, THE Admin_Wallet SHALL receive the total charge (budget + 5%)
6. WHEN a job is completed, THE Admin_Wallet SHALL retain the total commission (25% of budget)
7. WHEN a job is completed, THE Contractor SHALL receive 80% of the job budget
8. THE System SHALL store all calculated amounts in the Offer record for audit purposes

### Requirement 12: Wallet Balance Validation

**User Story:** As a customer, I want to be prevented from sending offers I cannot afford, so that I don't create invalid transactions.

#### Acceptance Criteria

1. WHEN a customer sends an offer, THE System SHALL validate that the customer's wallet balance is sufficient
2. WHEN validating balance, THE System SHALL check that balance is greater than or equal to the total charge
3. IF the balance is insufficient, THEN THE System SHALL reject the offer with a descriptive error message
4. IF the balance is sufficient, THEN THE System SHALL create the offer with status "pending"
5. THE System SHALL NOT deduct from the wallet until the offer is accepted

### Requirement 13: Atomic Transaction Operations

**User Story:** As a system administrator, I want all wallet operations to be atomic, so that data consistency is maintained.

#### Acceptance Criteria

1. WHEN performing wallet adjustments, THE System SHALL use MongoDB transactions
2. WHEN a MongoDB transaction starts, THE System SHALL perform all wallet updates within the transaction
3. WHEN a MongoDB transaction starts, THE System SHALL create the Transaction record within the transaction
4. WHEN a MongoDB transaction starts, THE System SHALL update related offer and job statuses within the transaction
5. IF any operation within the transaction fails, THEN THE System SHALL rollback all changes
6. IF the transaction commits successfully, THEN THE System SHALL ensure all changes are persisted
7. THE System SHALL handle race conditions by using appropriate locking mechanisms

### Requirement 14: Error Handling and Recovery

**User Story:** As a system administrator, I want errors to be handled gracefully, so that the system remains stable.

#### Acceptance Criteria

1. WHEN a Stripe API call fails, THE System SHALL log the error with full context
2. WHEN a Stripe API call fails, THE System SHALL return a user-friendly error message
3. WHEN a database operation fails, THE System SHALL rollback any partial changes
4. WHEN a webhook processing fails, THE System SHALL log the error but still return 200 to Stripe
5. WHEN a critical error occurs, THE System SHALL send notifications to administrators
6. THE System SHALL implement retry logic for transient Stripe API failures
7. THE System SHALL implement idempotency for webhook processing to handle duplicate events

### Requirement 15: Stripe Connect Account Status Tracking

**User Story:** As a contractor, I want to know my Stripe Connect account status, so that I understand if I can receive payouts.

#### Acceptance Criteria

1. WHEN a contractor checks their Stripe Connect status, THE System SHALL query the Stripe API for account details
2. WHEN the account details are retrieved, THE System SHALL return the account status (pending, verified, restricted)
3. WHEN the account details are retrieved, THE System SHALL return whether payouts are enabled
4. WHEN the account details are retrieved, THE System SHALL return any requirements that need to be completed
5. IF the contractor doesn't have a Stripe Connect account, THEN THE System SHALL return a status indicating onboarding is needed
