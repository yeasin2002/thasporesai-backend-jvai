# Phase 6: Manual Testing Checklist

**Date**: January 25, 2026  
**Tester**: _________________  
**Environment**: Test / Staging / Production

---

## Pre-Testing Setup

- [ ] Stripe CLI installed and configured
- [ ] Test Stripe account in test mode
- [ ] MongoDB running and accessible
- [ ] Server running on localhost:4000
- [ ] Postman/Insomnia collection imported
- [ ] Test user accounts created (customer + contractor)

---

## 1. Deposit Tests

### 1.1 Successful Deposit
- [ ] **Test**: Deposit $100 with valid card (4242 4242 4242 4242)
- [ ] **Expected**: 200 OK, Payment Intent created
- [ ] **Verify**: Transaction record created with status "pending"
- [ ] **Verify**: Wallet pendingDeposits increased
- [ ] **Verify**: Stripe Dashboard shows Payment Intent
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 1.2 Declined Card
- [ ] **Test**: Deposit $100 with declined card (4000 0000 0000 0002)
- [ ] **Expected**: 400 Bad Request, error message "Card declined"
- [ ] **Verify**: No transaction created
- [ ] **Verify**: Wallet balance unchanged
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 1.3 Insufficient Funds Card
- [ ] **Test**: Deposit $100 with insufficient funds card (4000 0000 0000 9995)
- [ ] **Expected**: 400 Bad Request, error message about insufficient funds
- [ ] **Verify**: Transaction marked as failed
- [ ] **Verify**: Wallet balance unchanged
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 1.4 3D Secure Card
- [ ] **Test**: Deposit $100 with 3D Secure card (4000 0025 0000 3155)
- [ ] **Expected**: 200 OK, requires_action status
- [ ] **Verify**: Client receives next_action URL
- [ ] **Verify**: After authentication, payment succeeds
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 1.5 Minimum Amount Validation
- [ ] **Test**: Deposit $5 (below minimum)
- [ ] **Expected**: 400 Bad Request, "Minimum deposit amount is $10"
- [ ] **Verify**: No Stripe API call made
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 1.6 Duplicate Request (Idempotency)
- [ ] **Test**: Send same deposit request twice immediately
- [ ] **Expected**: Second request returns existing transaction
- [ ] **Verify**: Only one Payment Intent created in Stripe
- [ ] **Verify**: No duplicate charge
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 2. Webhook Tests

### 2.1 Payment Success Webhook
- [ ] **Test**: Trigger payment_intent.succeeded via Stripe CLI
- [ ] **Command**: `stripe trigger payment_intent.succeeded`
- [ ] **Expected**: Webhook processed, 200 OK response
- [ ] **Verify**: Transaction status updated to "completed"
- [ ] **Verify**: Wallet balance increased
- [ ] **Verify**: pendingDeposits decreased
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 2.2 Payment Failed Webhook
- [ ] **Test**: Trigger payment_intent.payment_failed
- [ ] **Expected**: Webhook processed successfully
- [ ] **Verify**: Transaction status updated to "failed"
- [ ] **Verify**: failureReason populated
- [ ] **Verify**: pendingDeposits decreased
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 2.3 Invalid Webhook Signature
- [ ] **Test**: Send webhook with invalid signature
- [ ] **Expected**: 400 Bad Request, "Webhook Error"
- [ ] **Verify**: Webhook not processed
- [ ] **Verify**: Error logged
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 2.4 Account Updated Webhook
- [ ] **Test**: Trigger account.updated webhook
- [ ] **Expected**: Webhook processed successfully
- [ ] **Verify**: User stripeAccountStatus updated
- [ ] **Verify**: Console shows status change log
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 3. Contractor Onboarding Tests

### 3.1 Create Connect Account
- [ ] **Test**: POST /api/wallet/connect-account (contractor)
- [ ] **Expected**: 200 OK, accountId and onboardingUrl returned
- [ ] **Verify**: Stripe Express account created
- [ ] **Verify**: User stripeAccountId saved
- [ ] **Verify**: stripeAccountStatus = "pending"
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 3.2 Complete Onboarding
- [ ] **Test**: Open onboardingUrl in browser
- [ ] **Expected**: Stripe onboarding form loads
- [ ] **Action**: Fill out form with test data
- [ ] **Verify**: Redirected to return URL
- [ ] **Verify**: Account status updated to "verified"
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 3.3 Get Account Status
- [ ] **Test**: GET /api/wallet/connect-account/status
- [ ] **Expected**: 200 OK, account details returned
- [ ] **Verify**: chargesEnabled and payoutsEnabled shown
- [ ] **Verify**: requirementsCurrentlyDue array present
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 3.4 Non-Contractor Access
- [ ] **Test**: Customer tries to create Connect account
- [ ] **Expected**: 403 Forbidden or role validation error
- [ ] **Verify**: No account created
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 4. Withdrawal Tests

### 4.1 Successful Withdrawal
- [ ] **Test**: POST /api/wallet/withdraw with $50
- [ ] **Expected**: 200 OK, transfer created
- [ ] **Verify**: Wallet balance decreased
- [ ] **Verify**: Transaction created with stripeTransferId
- [ ] **Verify**: Stripe Dashboard shows transfer
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 4.2 Insufficient Balance
- [ ] **Test**: Withdraw more than wallet balance
- [ ] **Expected**: 400 Bad Request, "Insufficient balance"
- [ ] **Verify**: No transfer created
- [ ] **Verify**: Wallet balance unchanged
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 4.3 Unverified Account
- [ ] **Test**: Withdraw with pending Stripe account
- [ ] **Expected**: 400 Bad Request, account not verified message
- [ ] **Verify**: No transfer created
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 4.4 No Stripe Account
- [ ] **Test**: Withdraw without creating Connect account
- [ ] **Expected**: 400 Bad Request, "complete Stripe Connect onboarding"
- [ ] **Verify**: No transfer attempted
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 4.5 Frozen Wallet
- [ ] **Test**: Set wallet.isFrozen = true, attempt withdrawal
- [ ] **Expected**: 400 Bad Request, "Wallet is frozen"
- [ ] **Verify**: No transfer created
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 4.6 Minimum/Maximum Validation
- [ ] **Test**: Withdraw $5 (below minimum)
- [ ] **Expected**: 400 Bad Request, minimum amount error
- [ ] **Test**: Withdraw $15,000 (above maximum)
- [ ] **Expected**: 400 Bad Request, maximum amount error
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 5. Rate Limiting Tests

### 5.1 Deposit Rate Limit
- [ ] **Test**: Send 6 deposit requests in 1 hour
- [ ] **Expected**: First 5 succeed, 6th returns 429
- [ ] **Verify**: Error message mentions limit
- [ ] **Verify**: RateLimit headers present
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 5.2 Withdrawal Rate Limit
- [ ] **Test**: Send 4 withdrawal requests in 1 hour
- [ ] **Expected**: First 3 succeed, 4th returns 429
- [ ] **Verify**: Clear error message
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 5.3 Connect Account Rate Limit
- [ ] **Test**: Send 3 connect account requests in 1 hour
- [ ] **Expected**: First 2 succeed, 3rd returns 429
- [ ] **Verify**: Rate limit enforced
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 6. Concurrent Request Tests

### 6.1 Concurrent Deposits
- [ ] **Test**: Send 5 identical deposit requests simultaneously
- [ ] **Expected**: Only 1 Payment Intent created
- [ ] **Verify**: Idempotency working under load
- [ ] **Verify**: Other requests return existing transaction
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 6.2 Concurrent Withdrawals
- [ ] **Test**: Send 3 identical withdrawal requests simultaneously
- [ ] **Expected**: Only 1 transfer created
- [ ] **Verify**: Balance only deducted once
- [ ] **Verify**: Atomic wallet update working
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 7. Error Recovery Tests

### 7.1 Network Timeout
- [ ] **Test**: Simulate network timeout during deposit
- [ ] **Expected**: Error handled gracefully
- [ ] **Verify**: Transaction marked as failed
- [ ] **Verify**: Can retry request
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 7.2 Database Connection Loss
- [ ] **Test**: Stop MongoDB during operation
- [ ] **Expected**: 500 error with appropriate message
- [ ] **Verify**: No data corruption
- [ ] **Verify**: System recovers when DB reconnects
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 7.3 Stripe API Error
- [ ] **Test**: Use invalid API key
- [ ] **Expected**: Authentication error
- [ ] **Verify**: Error logged
- [ ] **Verify**: User-friendly message returned
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 8. Transaction Retry Tests

### 8.1 Manual Retry Job
- [ ] **Test**: Create failed transaction, run retry job
- [ ] **Command**: `bun run src/jobs/retry-failed-transactions.ts`
- [ ] **Expected**: Job runs successfully
- [ ] **Verify**: Failed transaction retried
- [ ] **Verify**: retryCount incremented
- [ ] **Verify**: lastRetryAt updated
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 8.2 Non-Retryable Errors
- [ ] **Test**: Create failed transaction with card error
- [ ] **Expected**: Retry job skips transaction
- [ ] **Verify**: Console shows "Skipping non-retryable"
- [ ] **Verify**: retryCount not incremented
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 8.3 Max Retries
- [ ] **Test**: Transaction with retryCount = 3
- [ ] **Expected**: Retry job skips transaction
- [ ] **Verify**: No more retry attempts
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 9. Security Tests

### 9.1 Unauthorized Access
- [ ] **Test**: Call endpoints without auth token
- [ ] **Expected**: 401 Unauthorized
- [ ] **Verify**: No operation performed
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 9.2 Role-Based Access
- [ ] **Test**: Customer tries to withdraw
- [ ] **Expected**: 400 Bad Request, role error
- [ ] **Test**: Contractor tries to deposit
- [ ] **Expected**: Should work (contractors can deposit too)
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 9.3 SQL Injection (N/A for MongoDB)
- [ ] **Test**: Send malicious input in amount field
- [ ] **Expected**: Validation error or sanitized
- [ ] **Verify**: No database compromise
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 9.4 XSS Prevention
- [ ] **Test**: Send script tags in description fields
- [ ] **Expected**: Input sanitized or rejected
- [ ] **Verify**: No script execution
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## 10. Data Integrity Tests

### 10.1 Wallet Balance Accuracy
- [ ] **Test**: Perform multiple deposits and withdrawals
- [ ] **Expected**: Balance always accurate
- [ ] **Verify**: Sum of transactions matches balance
- [ ] **Verify**: No negative balances
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 10.2 Transaction Audit Trail
- [ ] **Test**: Review all transactions for a user
- [ ] **Expected**: Complete history available
- [ ] **Verify**: All fields populated correctly
- [ ] **Verify**: Timestamps accurate
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

### 10.3 Stripe Reconciliation
- [ ] **Test**: Compare database with Stripe Dashboard
- [ ] **Expected**: All transactions match
- [ ] **Verify**: Amounts match
- [ ] **Verify**: Statuses match
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**: _________________

---

## Test Summary

**Total Tests**: 50+  
**Passed**: _____  
**Failed**: _____  
**Skipped**: _____  
**Pass Rate**: _____%

**Critical Issues Found**: _____  
**Minor Issues Found**: _____  

**Overall Assessment**: ✅ Ready for Production / ⚠️ Needs Fixes / ❌ Not Ready

---

## Issues Log

| # | Severity | Description | Steps to Reproduce | Status |
|---|----------|-------------|-------------------|--------|
| 1 |          |             |                   |        |
| 2 |          |             |                   |        |
| 3 |          |             |                   |        |

---

## Sign-Off

**Tester**: _________________ **Date**: _________  
**Reviewer**: _________________ **Date**: _________  
**Approved By**: _________________ **Date**: _________

---

## Notes

_Additional observations, recommendations, or comments:_

