# Phase 3: Contractor Onboarding - Testing Guide

## 🎯 Overview

This guide walks you through testing the Stripe Connect integration for contractor onboarding.

---

## Prerequisites

### 1. Phase 2 Complete

- Stripe CLI installed and configured
- Webhook forwarding running
- Environment variables set

### 2. Test Contractor Account

You'll need a contractor account for testing.

**Create via API:**

```http
POST http://localhost:4000/api/auth/register
Content-Type: application/json

{
  "email": "contractor@test.com",
  "password": "password123",
  "full_name": "Test Contractor",
  "role": "contractor"
}
```

**Login:**

```http
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "contractor@test.com",
  "password": "password123"
}
```

Save the `accessToken` from the response.

---

## Test Scenario 1: Create Stripe Connect Account

### Step 1: Create Connect Account

```http
POST http://localhost:4000/api/wallet/connect-account
Authorization: Bearer YOUR_CONTRACTOR_ACCESS_TOKEN
```

**Expected Response:**

```json
{
  "status": 201,
  "message": "Stripe Connect account created successfully",
  "data": {
    "accountId": "acct_xxxxxxxxxxxxx",
    "onboardingUrl": "https://connect.stripe.com/setup/...",
    "expiresAt": 1706140800,
    "message": "Please complete the onboarding process to start receiving payments"
  },
  "success": true
}
```

### Step 2: Verify Database

Check that the account ID was saved:

```javascript
db.user.findOne({ email: "contractor@test.com" });
```

**Expected:**

```javascript
{
  email: "contractor@test.com",
  role: "contractor",
  stripeAccountId: "acct_xxxxxxxxxxxxx",
  stripeAccountStatus: "pending"
}
```

### Step 3: Open Onboarding URL

Copy the `onboardingUrl` from the response and open it in your browser.

**You should see:**

- Stripe Connect onboarding form
- Business information section
- Bank account section
- Terms of service

---

## Test Scenario 2: Complete Onboarding

### Step 1: Fill Out Onboarding Form

Use these test values:

**Business Information:**

- Business type: Individual
- First name: Test
- Last name: Contractor
- Date of birth: 01/01/1990
- SSN: `000-00-0000` (Stripe test SSN)
- Phone: Any valid format

**Address:**

- Address line 1: 123 Test St
- City: San Francisco
- State: CA
- ZIP: 94102
- Country: United States

**Bank Account:**

- Routing number: `110000000` (Stripe test routing)
- Account number: `000123456789` (Stripe test account)
- Account holder name: Test Contractor

### Step 2: Submit Form

Click "Submit" or "Complete" button.

**Expected:**

- Redirect to return URL
- Success page displayed
- Message: "Onboarding Complete!"

### Step 3: Check Webhook Terminal

You should see in the webhook terminal:

```
✅ Received Stripe webhook: account.updated
🔄 Processing account update: acct_xxxxxxxxxxxxx
✅ Account status updated for user ...: pending → verified
🎉 Contractor contractor@test.com can now receive payments!
```

### Step 4: Verify Database

```javascript
db.user.findOne({ email: "contractor@test.com" });
```

**Expected:**

```javascript
{
  email: "contractor@test.com",
  role: "contractor",
  stripeAccountId: "acct_xxxxxxxxxxxxx",
  stripeAccountStatus: "verified" // Changed from "pending"
}
```

---

## Test Scenario 3: Check Account Status

### Step 1: Get Account Status

```http
GET http://localhost:4000/api/wallet/connect-account/status
Authorization: Bearer YOUR_CONTRACTOR_ACCESS_TOKEN
```

**Expected Response (Verified Account):**

```json
{
  "status": 200,
  "message": "Stripe Connect account status retrieved successfully",
  "data": {
    "hasAccount": true,
    "accountId": "acct_xxxxxxxxxxxxx",
    "status": "verified",
    "onboardingComplete": true,
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "detailsSubmitted": true,
    "requirements": {
      "currentlyDue": [],
      "eventuallyDue": [],
      "pastDue": [],
      "pendingVerification": [],
      "disabledReason": null
    },
    "capabilities": {
      "transfers": "active"
    }
  },
  "success": true
}
```

---

## Test Scenario 4: Incomplete Onboarding

### Step 1: Create New Contractor

Create another contractor account (different email).

### Step 2: Create Connect Account

```http
POST http://localhost:4000/api/wallet/connect-account
Authorization: Bearer NEW_CONTRACTOR_ACCESS_TOKEN
```

### Step 3: Open Onboarding URL

Open the URL but **DO NOT complete** the form. Close the browser instead.

### Step 4: Check Status

```http
GET http://localhost:4000/api/wallet/connect-account/status
Authorization: Bearer NEW_CONTRACTOR_ACCESS_TOKEN
```

**Expected Response (Incomplete):**

```json
{
  "status": 200,
  "message": "Stripe Connect account status retrieved successfully",
  "data": {
    "hasAccount": true,
    "accountId": "acct_xxxxxxxxxxxxx",
    "status": "pending",
    "onboardingComplete": false,
    "chargesEnabled": false,
    "payoutsEnabled": false,
    "detailsSubmitted": false,
    "requirements": {
      "currentlyDue": ["individual.first_name", "individual.last_name", ...],
      "eventuallyDue": [],
      "pastDue": [],
      "pendingVerification": [],
      "disabledReason": null
    },
    "capabilities": {
      "transfers": "inactive"
    }
  },
  "success": true
}
```

### Step 5: Try to Create Account Again

```http
POST http://localhost:4000/api/wallet/connect-account
Authorization: Bearer NEW_CONTRACTOR_ACCESS_TOKEN
```

**Expected Response:**

```json
{
  "status": 200,
  "message": "Please complete your Stripe Connect onboarding",
  "data": {
    "accountId": "acct_xxxxxxxxxxxxx",
    "onboardingUrl": "https://connect.stripe.com/setup/...",
    "onboardingComplete": false
  },
  "success": true
}
```

**Note:** Returns a new onboarding link instead of creating duplicate account.

---

## Test Scenario 5: Refresh Expired Link

### Step 1: Wait for Link to Expire

Onboarding links expire after a short time (usually 5 minutes).

### Step 2: Try to Access Expired Link

Open the old onboarding URL in browser.

**Expected:**

- Stripe shows "Link expired" message

### Step 3: Refresh Link

```http
GET http://localhost:4000/api/wallet/connect-account/refresh
Authorization: Bearer YOUR_CONTRACTOR_ACCESS_TOKEN
```

**Expected:**

- Redirects to new Stripe onboarding URL
- New link is valid

---

## Test Scenario 6: Customer Cannot Create Account

### Step 1: Login as Customer

```http
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "customer@test.com",
  "password": "password123"
}
```

### Step 2: Try to Create Connect Account

```http
POST http://localhost:4000/api/wallet/connect-account
Authorization: Bearer CUSTOMER_ACCESS_TOKEN
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Only contractors can create Stripe Connect accounts",
  "success": false
}
```

---

## Test Scenario 7: Manual Webhook Testing

### Trigger account.updated Event

```bash
stripe trigger account.updated
```

**Expected in webhook terminal:**

```
✅ Received Stripe webhook: account.updated
🔄 Processing account update: acct_xxxxxxxxxxxxx
```

**Note:** This may not update your test account status since it's a generic test event.

---

## Verification Checklist

After testing, verify:

- [x] Contractor can create Stripe Connect account
- [x] Account ID saved to user document
- [x] Onboarding URL generated and accessible
- [x] Onboarding form displays correctly
- [x] Test data accepted by Stripe
- [x] Webhook received on completion
- [x] User status updated to "verified"
- [x] Status endpoint returns correct information
- [x] Incomplete onboarding handled correctly
- [x] Existing account returns new onboarding link
- [x] Expired links can be refreshed
- [x] Customers cannot create accounts
- [x] Return URL shows appropriate message

---

## Stripe Dashboard Verification

### View Connected Accounts

1. Go to https://dashboard.stripe.com/test/connect/accounts
2. Find your test account
3. Click to view details

**Verify:**

- Account type: Express
- Status: Complete (if onboarding finished)
- Capabilities: Transfers enabled
- Metadata: userId, userEmail, userName

---

## Common Issues & Solutions

### Issue 1: "Account already exists"

**Solution:** Use the existing account or create a new contractor with different email

### Issue 2: "Onboarding link expired"

**Solution:** Call the refresh endpoint to get a new link

### Issue 3: "Webhook not received"

**Solution:**

- Check Stripe CLI is running
- Verify webhook secret in .env
- Check webhook terminal for errors

### Issue 4: "Status still pending after completion"

**Solution:**

- Check webhook was received
- Manually trigger account.updated webhook
- Check Stripe Dashboard for account status

### Issue 5: "Cannot access onboarding URL"

**Solution:**

- Verify URL is complete and not truncated
- Check link hasn't expired
- Try refresh endpoint

---

## Test Data Reference

### Stripe Test Values

**SSN (US):**

- Success: `000-00-0000`
- Verification required: `000-00-0001`

**Bank Accounts:**

- Success: `000123456789`
- Insufficient funds: `000111111116`
- Account closed: `000111111113`

**Routing Numbers:**

- Valid: `110000000`
- Invalid: `110000001`

**Dates:**

- DOB: Any date 18+ years ago
- Future dates will be rejected

---

## Debugging Tips

### Check Stripe Dashboard

**Connected Accounts:**
https://dashboard.stripe.com/test/connect/accounts

**Events:**
https://dashboard.stripe.com/test/events

**Webhooks:**
https://dashboard.stripe.com/test/webhooks

### Check Database

```javascript
// Find contractor
db.user.findOne({ email: "contractor@test.com" });

// Find all contractors with accounts
db.user.find({
  role: "contractor",
  stripeAccountId: { $exists: true },
});

// Check account statuses
db.user.aggregate([
  { $match: { role: "contractor" } },
  {
    $group: {
      _id: "$stripeAccountStatus",
      count: { $sum: 1 },
    },
  },
]);
```

### Check Logs

Look for these log messages:

- `✅ Stripe Connect account created for user ...`
- `🔄 Processing account update: acct_...`
- `✅ Account status updated for user ...: pending → verified`
- `🎉 Contractor ... can now receive payments!`

---

## Next Steps

Once Phase 3 testing is complete:

1. **Phase 4**: Implement contractor withdrawals with Stripe Transfers
2. Test complete payment flow: deposit → offer → job → withdrawal
3. Production deployment with real Stripe accounts

---

## Support Resources

- **Stripe Connect Docs:** https://stripe.com/docs/connect
- **Express Accounts:** https://stripe.com/docs/connect/express-accounts
- **Account Links:** https://stripe.com/docs/connect/account-links
- **Testing Connect:** https://stripe.com/docs/connect/testing

---

**Phase 3 Testing Complete!** Ready to move to Phase 4: Contractor Withdrawals.
