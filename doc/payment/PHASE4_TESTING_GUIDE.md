# Phase 4: Contractor Withdrawals - Testing Guide

## 🎯 Overview

This guide walks you through testing the Stripe Transfer integration for contractor withdrawals.

---

## Prerequisites

### 1. Phases 2 & 3 Complete

- Stripe CLI installed and configured
- Webhook forwarding running
- Customer deposits working
- Contractor onboarding working

### 2. Test Contractor with Completed Onboarding

You'll need a contractor with:

- Stripe Connect account created
- Onboarding completed (status = "verified")
- Wallet balance (from completed jobs or manual deposit)

---

## Setup: Create Test Contractor with Balance

### Step 1: Create and Onboard Contractor

Follow Phase 3 testing guide to:

1. Create contractor account
2. Create Stripe Connect account
3. Complete onboarding
4. Verify status = "verified"

### Step 2: Add Balance to Wallet

**Option A: Manual Database Update (for testing)**

```javascript
db.wallet.updateOne(
  { user: ObjectId("contractor_id") },
  { $set: { balance: 500 } }
);
```

**Option B: Complete a Job (realistic flow)**

1. Customer creates job
2. Contractor applies
3. Customer sends offer
4. Contractor accepts
5. Job completed
6. Contractor receives 80% of job budget

---

## Test Scenario 1: Successful Withdrawal

### Step 1: Check Current Balance

```http
GET http://localhost:4000/api/wallet
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
```

**Expected Response:**

```json
{
  "status": 200,
  "message": "Wallet retrieved successfully",
  "data": {
    "balance": 500,
    "escrowBalance": 0,
    "totalWithdrawals": 0
  },
  "success": true
}
```

### Step 2: Initiate Withdrawal

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 100
}
```

**Expected Response:**

```json
{
  "status": 200,
  "message": "Withdrawal initiated successfully",
  "data": {
    "transaction": {
      "id": "transaction_id",
      "amount": 100,
      "status": "pending",
      "stripeTransferId": "tr_xxxxxxxxxxxxx"
    },
    "wallet": {
      "balance": 400,
      "totalWithdrawals": 100
    },
    "estimatedArrival": "2-3 business days",
    "message": "Your withdrawal is being processed..."
  },
  "success": true
}
```

### Step 3: Verify Database

```javascript
// Check transaction
db.transaction.findOne({ stripeTransferId: "tr_xxxxxxxxxxxxx" })

// Expected
{
  type: "withdrawal",
  amount: 100,
  status: "pending",
  stripeTransferId: "tr_xxxxxxxxxxxxx",
  stripeStatus: "pending"
}

// Check wallet
db.wallet.findOne({ user: ObjectId("contractor_id") })

// Expected
{
  balance: 400, // Decreased by 100
  totalWithdrawals: 100 // Increased by 100
}
```

### Step 4: Check Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/connect/transfers
2. Find your transfer
3. Verify:
   - Amount: $100
   - Destination: Your test account
   - Status: Paid (instant)

### Step 5: Check Withdrawal Status

```http
GET http://localhost:4000/api/wallet/withdraw/{transaction_id}
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
```

**Expected Response:**

```json
{
  "status": 200,
  "message": "Withdrawal status retrieved successfully",
  "data": {
    "transaction": {
      "id": "transaction_id",
      "amount": 100,
      "status": "pending",
      "stripeTransferId": "tr_xxxxxxxxxxxxx"
    },
    "stripe": {
      "id": "tr_xxxxxxxxxxxxx",
      "amount": 100,
      "currency": "usd",
      "destination": "acct_xxxxxxxxxxxxx",
      "reversed": false,
      "reversals": 0
    },
    "estimatedArrival": "2-3 business days"
  },
  "success": true
}
```

---

## Test Scenario 2: Insufficient Balance

### Step 1: Attempt Large Withdrawal

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 1000
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Insufficient balance. Available: $400",
  "success": false
}
```

### Step 2: Verify No Changes

```javascript
// Check wallet - balance should be unchanged
db.wallet.findOne({ user: ObjectId("contractor_id") })

// Expected
{
  balance: 400, // Unchanged
  totalWithdrawals: 100 // Unchanged
}

// Check no new transaction created
db.transaction.find({
  from: ObjectId("contractor_id"),
  type: "withdrawal",
  amount: 1000
}).count()

// Expected: 0
```

---

## Test Scenario 3: Withdrawal Without Stripe Account

### Step 1: Create New Contractor (No Onboarding)

```http
POST http://localhost:4000/api/auth/register
Content-Type: application/json

{
  "email": "contractor2@test.com",
  "password": "password123",
  "full_name": "Test Contractor 2",
  "role": "contractor"
}
```

### Step 2: Add Balance Manually

```javascript
// Create wallet with balance
db.wallet.create({
  user: ObjectId("new_contractor_id"),
  balance: 200,
  escrowBalance: 0,
});
```

### Step 3: Attempt Withdrawal

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer NEW_CONTRACTOR_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 50
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Please complete Stripe Connect onboarding before withdrawing funds",
  "success": false
}
```

---

## Test Scenario 4: Withdrawal with Incomplete Onboarding

### Step 1: Create Contractor with Pending Account

1. Create contractor
2. Create Stripe Connect account
3. **DO NOT** complete onboarding

### Step 2: Add Balance

```javascript
db.wallet.create({
  user: ObjectId("contractor_id"),
  balance: 200,
  escrowBalance: 0,
});
```

### Step 3: Attempt Withdrawal

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 50
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Stripe Connect account is pending. Please complete onboarding to withdraw funds.",
  "success": false
}
```

---

## Test Scenario 5: Minimum/Maximum Validation

### Test 1: Below Minimum

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 5
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Minimum withdrawal amount is $10",
  "success": false
}
```

### Test 2: Above Maximum

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 15000
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Maximum withdrawal amount is $10,000",
  "success": false
}
```

---

## Test Scenario 6: Frozen Wallet

### Step 1: Freeze Wallet

```javascript
db.wallet.updateOne(
  { user: ObjectId("contractor_id") },
  { $set: { isFrozen: true } }
);
```

### Step 2: Attempt Withdrawal

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 50
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Wallet is frozen. Please contact support.",
  "success": false
}
```

### Step 3: Unfreeze for Further Testing

```javascript
db.wallet.updateOne(
  { user: ObjectId("contractor_id") },
  { $set: { isFrozen: false } }
);
```

---

## Test Scenario 7: Transfer Reversal

### Step 1: Create Withdrawal

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer CONTRACTOR_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 100
}
```

Save the `stripeTransferId` from the response.

### Step 2: Manually Reverse Transfer in Stripe

**Using Stripe CLI:**

```bash
stripe transfers reverse tr_xxxxxxxxxxxxx
```

**Or in Stripe Dashboard:**

1. Go to https://dashboard.stripe.com/test/connect/transfers
2. Find the transfer
3. Click "Reverse transfer"

### Step 3: Check Webhook Terminal

You should see:

```
✅ Received Stripe webhook: transfer.reversed
🔄 Processing reversed transfer: tr_xxxxxxxxxxxxx
✅ Refunded $100 to wallet ... due to reversed transfer
```

### Step 4: Verify Database

```javascript
// Check transaction
db.transaction.findOne({ stripeTransferId: "tr_xxxxxxxxxxxxx" })

// Expected
{
  status: "failed", // Changed from "pending"
  stripeStatus: "reversed",
  failureReason: "Transfer reversed"
}

// Check wallet
db.wallet.findOne({ user: ObjectId("contractor_id") })

// Expected
{
  balance: 500, // Refunded (400 + 100)
  totalWithdrawals: 0 // Decreased back to 0
}
```

---

## Test Scenario 8: Customer Cannot Withdraw

### Step 1: Login as Customer

```http
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "customer@test.com",
  "password": "password123"
}
```

### Step 2: Attempt Withdrawal

```http
POST http://localhost:4000/api/wallet/withdraw
Authorization: Bearer CUSTOMER_ACCESS_TOKEN
Content-Type: application/json

{
  "amount": 50
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Only contractors can withdraw funds",
  "success": false
}
```

---

## Verification Checklist

After testing, verify:

- [x] Contractor can withdraw funds
- [x] Balance deducted correctly
- [x] Transaction created with "pending" status
- [x] Stripe Transfer created
- [x] Transfer ID saved to transaction
- [x] Insufficient balance handled
- [x] No Stripe account handled
- [x] Incomplete onboarding handled
- [x] Minimum amount validated
- [x] Maximum amount validated
- [x] Frozen wallet handled
- [x] Transfer reversal refunds wallet
- [x] Customers cannot withdraw
- [x] Withdrawal status endpoint works
- [x] Ownership verification works

---

## Stripe Dashboard Verification

### View Transfers

1. Go to https://dashboard.stripe.com/test/connect/transfers
2. Find your test transfers
3. Verify:
   - Amount correct
   - Destination correct
   - Status: Paid
   - Metadata: userId, walletId, type

### View Connected Account Balance

1. Go to https://dashboard.stripe.com/test/connect/accounts
2. Click on your test account
3. Go to "Balance" tab
4. Verify transfer appears in balance

---

## Common Issues & Solutions

### Issue 1: "Unable to verify Stripe account"

**Solution:**

- Check Stripe account exists
- Verify onboarding complete
- Check Stripe API keys are correct

### Issue 2: "Transfer failed"

**Solution:**

- Check account has transfers capability
- Verify account is not restricted
- Check Stripe Dashboard for error details

### Issue 3: "Wallet update failed"

**Solution:**

- Check balance is sufficient
- Verify wallet is not frozen
- Check for race conditions (multiple simultaneous withdrawals)

### Issue 4: "Transfer not found in Stripe"

**Solution:**

- Verify transfer ID is correct
- Check Stripe Dashboard
- Ensure using correct API keys (test vs live)

---

## Debugging Tips

### Check Stripe Dashboard

**Transfers:**
https://dashboard.stripe.com/test/connect/transfers

**Events:**
https://dashboard.stripe.com/test/events

**Connected Accounts:**
https://dashboard.stripe.com/test/connect/accounts

### Check Database

```javascript
// Find all withdrawals
db.transaction.find({ type: "withdrawal" }).sort({ createdAt: -1 });

// Find pending withdrawals
db.transaction.find({
  type: "withdrawal",
  status: "pending",
});

// Check contractor wallet
db.wallet.findOne({ user: ObjectId("contractor_id") });

// Check total withdrawals
db.wallet.aggregate([
  {
    $group: {
      _id: null,
      totalWithdrawals: { $sum: "$totalWithdrawals" },
    },
  },
]);
```

### Check Logs

Look for these log messages:

- `✅ Withdrawal initiated: $... for user ...`
- `✅ Transfer ... reversed due to wallet update failure`
- `🔄 Processing reversed transfer: tr_...`
- `✅ Refunded $... to wallet ... due to reversed transfer`

---

## Next Steps

Once Phase 4 testing is complete:

1. **Phase 5**: Implement security features (idempotency, rate limiting)
2. **Phase 6**: Comprehensive testing (unit, integration, load)
3. **Phase 7**: Production deployment

---

## Support Resources

- **Stripe Transfers Docs:** https://stripe.com/docs/connect/charges-transfers
- **Testing Transfers:** https://stripe.com/docs/connect/testing
- **Transfer Reversals:** https://stripe.com/docs/connect/transfer-reversals

---

**Phase 4 Testing Complete!** Ready to move to Phase 5: Security & Error Handling.
