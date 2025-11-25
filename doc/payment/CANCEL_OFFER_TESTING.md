# Cancel Offer Feature - Testing Guide

**Feature**: Customer-Initiated Offer Cancellation  
**Endpoint**: `POST /api/offer/:offerId/cancel`

---

## Quick Test Scenarios

### ✅ Test 1: Happy Path - Cancel Pending Offer

**Prerequisites**:

- Customer has wallet with balance
- Contractor has applied to job
- Customer has sent offer (status: pending)

**Steps**:

1. Login as customer
2. Send offer to contractor
3. Verify wallet: balance decreased, escrow increased
4. Cancel the offer
5. Verify wallet: balance restored, escrow decreased
6. Verify offer status: "cancelled"
7. Verify application status: "pending" (reset)

**Expected Result**: ✅ Success, full refund issued

---

### ❌ Test 2: Cannot Cancel Accepted Offer

**Steps**:

1. Login as customer
2. Send offer to contractor
3. Login as contractor
4. Accept the offer
5. Login as customer again
6. Try to cancel the offer

**Expected Result**: ❌ Error 400 - "Cannot cancel offer with status: accepted"

---

### ❌ Test 3: Only Customer Can Cancel

**Steps**:

1. Login as customer
2. Send offer to contractor
3. Login as contractor
4. Try to cancel the offer

**Expected Result**: ❌ Error 403 - "Only the customer who sent the offer can cancel it"

---

### ❌ Test 4: Cannot Cancel Non-Existent Offer

**Steps**:

1. Login as customer
2. Try to cancel with invalid offer ID

**Expected Result**: ❌ Error 404 - "Offer not found"

---

## Postman/Insomnia Test Collection

### 1. Setup Variables

```
{{baseUrl}} = http://localhost:4000
{{customerToken}} = <customer_access_token>
{{contractorToken}} = <contractor_access_token>
{{offerId}} = <offer_id_from_send_offer_response>
```

### 2. Test Request

```http
POST {{baseUrl}}/api/offer/{{offerId}}/cancel
Authorization: Bearer {{customerToken}}
Content-Type: application/json

{
  "reason": "Contractor not responding, trying another contractor"
}
```

### 3. Expected Response (200)

```json
{
  "status": 200,
  "message": "Offer cancelled successfully",
  "data": {
    "offer": {
      "_id": "673d5f8e9a1b2c3d4e5f6789",
      "status": "cancelled",
      "cancelledAt": "2025-11-25T10:30:00.000Z",
      "cancellationReason": "Contractor not responding, trying another contractor"
    },
    "refund": {
      "amount": 105,
      "description": "Full refund issued to your wallet"
    },
    "wallet": {
      "balance": 200,
      "escrowBalance": 0
    },
    "message": "Your offer has been cancelled and the full amount has been refunded to your wallet. You can send a new offer if needed."
  }
}
```

---

## Manual Testing Checklist

### Before Testing

- [ ] Backend server running
- [ ] Database connected
- [ ] Test customer account created
- [ ] Test contractor account created
- [ ] Customer has wallet with balance ($200+)
- [ ] Job posted by customer
- [ ] Contractor applied to job

### Test Execution

- [ ] Customer can send offer successfully
- [ ] Wallet balance decreases correctly
- [ ] Escrow balance increases correctly
- [ ] Customer can cancel pending offer
- [ ] Full refund issued to customer wallet
- [ ] Offer status changes to "cancelled"
- [ ] Application status resets to "pending"
- [ ] Contractor receives notification
- [ ] Transaction record created (type: "refund")
- [ ] Cannot cancel accepted offer
- [ ] Cannot cancel rejected offer
- [ ] Cannot cancel expired offer
- [ ] Contractor cannot cancel offer
- [ ] Cannot cancel someone else's offer

### After Testing

- [ ] Check database consistency
- [ ] Verify wallet balances match
- [ ] Verify transaction records
- [ ] Check notification logs
- [ ] Review error logs

---

## Database Verification Queries

### Check Offer Status

```javascript
db.offers.findOne({ _id: ObjectId("offerId") });
```

### Check Wallet Balances

```javascript
db.wallets.findOne({ user: ObjectId("customerId") });
```

### Check Transaction Records

```javascript
db.transactions
  .find({
    offer: ObjectId("offerId"),
    type: "refund",
  })
  .sort({ createdAt: -1 });
```

### Check Application Status

```javascript
db.jobapplicationrequests.findOne({ _id: ObjectId("applicationId") });
```

---

## Automated Test Script (Optional)

```bash
#!/bin/bash

# Variables
BASE_URL="http://localhost:4000"
CUSTOMER_TOKEN="your_customer_token"
CONTRACTOR_TOKEN="your_contractor_token"

# Test 1: Send Offer
echo "Test 1: Sending offer..."
OFFER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/offer/application/$APPLICATION_ID/send" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "timeline": "2 weeks", "description": "Test offer"}')

OFFER_ID=$(echo $OFFER_RESPONSE | jq -r '.data.offer._id')
echo "Offer ID: $OFFER_ID"

# Test 2: Cancel Offer
echo "Test 2: Cancelling offer..."
CANCEL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/offer/$OFFER_ID/cancel" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing cancellation"}')

echo "Cancel Response:"
echo $CANCEL_RESPONSE | jq '.'

# Verify refund
REFUND_AMOUNT=$(echo $CANCEL_RESPONSE | jq -r '.data.refund.amount')
echo "Refund Amount: $REFUND_AMOUNT"

if [ "$REFUND_AMOUNT" == "105" ]; then
  echo "✅ Test Passed: Correct refund amount"
else
  echo "❌ Test Failed: Incorrect refund amount"
fi
```

---

## Performance Testing

### Load Test Scenario

**Goal**: Test concurrent cancellation attempts

**Setup**:

- 100 customers
- Each sends 1 offer
- All try to cancel simultaneously

**Expected**:

- All cancellations succeed
- No race conditions
- Wallet balances correct
- Transaction records accurate

**Tools**: Apache JMeter, k6, or Artillery

---

## Regression Testing

After implementing cancel offer, verify these still work:

- [ ] Send offer (application-based)
- [ ] Send offer (invite-based)
- [ ] Send offer (direct)
- [ ] Accept offer
- [ ] Reject offer
- [ ] Complete job
- [ ] Cancel job
- [ ] Withdraw funds
- [ ] Deposit funds
- [ ] Offer expiration (automated job)

---

## Bug Report Template

If you find issues, report using this template:

```markdown
**Bug Title**: [Brief description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:

1.
2.
3.

**Expected Result**:

**Actual Result**:

**Environment**:

- OS:
- Node Version:
- Database:

**Screenshots/Logs**:

**Additional Context**:
```

---

## Test Results Log

| Test Case                   | Status | Date | Tester | Notes |
| --------------------------- | ------ | ---- | ------ | ----- |
| Happy Path                  | ⏳     |      |        |       |
| Cannot Cancel Accepted      | ⏳     |      |        |       |
| Only Customer Can Cancel    | ⏳     |      |        |       |
| Invalid Offer ID            | ⏳     |      |        |       |
| Wallet Balance Verification | ⏳     |      |        |       |
| Transaction Record Created  | ⏳     |      |        |       |
| Notification Sent           | ⏳     |      |        |       |
| Application Status Reset    | ⏳     |      |        |       |

---

**Testing Status**: ⏳ Pending  
**Last Updated**: November 25, 2025
