# Payment System API Quick Reference

## Wallet Endpoints

### Get Wallet Balance
```http
GET /api/wallet
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": 200,
  "message": "Wallet retrieved successfully",
  "data": {
    "_id": "wallet_id",
    "user": "user_id",
    "balance": 1000.00,
    "escrowBalance": 500.00,
    "currency": "USD",
    "isActive": true,
    "isFrozen": false,
    "totalEarnings": 5000.00,
    "totalSpent": 2000.00,
    "totalWithdrawals": 1500.00
  }
}
```

---

### Deposit Money
```http
POST /api/wallet/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.00,
  "paymentMethodId": "pm_xxx"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Deposit successful",
  "data": {
    "wallet": { /* wallet object */ },
    "transaction": {
      "amount": 100.00,
      "type": "deposit"
    }
  }
}
```

**Validation:**
- Minimum: $10
- Payment method required

---

### Withdraw Money (Contractors Only)
```http
POST /api/wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500.00
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Withdrawal successful",
  "data": {
    "amount": 500.00,
    "newBalance": 500.00,
    "estimatedArrival": "2025-11-15"
  }
}
```

**Validation:**
- Minimum: $10
- Maximum: $10,000
- Must have sufficient balance
- Contractors only

---

### Get Transaction History
```http
GET /api/wallet/transactions?type=deposit&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): platform_fee, service_fee, contractor_payout, refund, deposit, withdrawal, escrow_hold, escrow_release
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "status": 200,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "_id": "txn_id",
        "type": "deposit",
        "amount": 100.00,
        "from": { "_id": "user_id", "full_name": "John Doe", "email": "john@example.com" },
        "to": { "_id": "user_id", "full_name": "John Doe", "email": "john@example.com" },
        "status": "completed",
        "description": "Wallet deposit",
        "createdAt": "2025-11-13T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

## Offer Endpoints (Job-Request Module)

### Send Offer to Contractor
```http
POST /api/job-request/:applicationId/send-offer
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000.00,
  "timeline": "7 days",
  "description": "Complete plumbing work as discussed"
}
```

**Response:**
```json
{
  "status": 201,
  "message": "Offer sent successfully",
  "data": {
    "offer": {
      "_id": "offer_id",
      "job": "job_id",
      "customer": "customer_id",
      "contractor": "contractor_id",
      "amount": 1000.00,
      "platformFee": 50.00,
      "serviceFee": 200.00,
      "contractorPayout": 750.00,
      "totalCharge": 1050.00,
      "timeline": "7 days",
      "description": "Complete plumbing work as discussed",
      "status": "pending",
      "expiresAt": "2025-11-20T10:00:00Z"
    },
    "walletBalance": 500.00,
    "amounts": {
      "jobBudget": 1000.00,
      "platformFee": 50.00,
      "serviceFee": 200.00,
      "contractorPayout": 750.00,
      "totalCharge": 1050.00,
      "adminTotal": 250.00
    }
  }
}
```

**Validation:**
- Amount: $10 - $10,000
- Timeline: 1-100 characters
- Description: 10-1000 characters
- Customer must have sufficient balance (amount + 5% platform fee)
- Only one offer per job allowed

**Commission Breakdown:**
- Platform Fee: 5% (charged when offer sent)
- Service Fee: 20% (charged when job completed)
- Contractor Payout: 75% (paid when job completed)
- Total Admin Commission: 25%

---

### Accept Offer (Contractor)
```http
POST /api/job-request/offer/:offerId/accept
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": 200,
  "message": "Offer accepted successfully",
  "data": {
    "offer": { /* offer object with status: "accepted" */ },
    "job": {
      "_id": "job_id",
      "status": "assigned",
      "contractorId": "contractor_id",
      "assignedAt": "2025-11-13T10:00:00Z"
    },
    "payment": {
      "platformFee": 50.00,
      "serviceFee": 200.00,
      "contractorPayout": 750.00
    }
  }
}
```

**What Happens:**
1. Platform fee (5%) transferred from escrow to admin wallet
2. Remaining amount stays in escrow
3. Job status changes to "assigned"
4. All other pending applications rejected
5. Contractor notified

---

### Reject Offer (Contractor)
```http
POST /api/job-request/offer/:offerId/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Timeline doesn't work for me"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Offer rejected successfully",
  "data": {
    "offer": { /* offer object with status: "rejected" */ },
    "refundAmount": 1050.00
  }
}
```

**What Happens:**
1. Full refund (job amount + platform fee) returned to customer wallet
2. Offer status changes to "rejected"
3. Application status reset to "pending"
4. Customer notified

---

## Job Payment Endpoints

### Complete Job (Customer)
```http
POST /api/job/:id/complete
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": 200,
  "message": "Job completed successfully",
  "data": {
    "job": {
      "_id": "job_id",
      "status": "completed",
      "completedAt": "2025-11-13T10:00:00Z"
    },
    "payment": {
      "serviceFee": 200.00,
      "contractorPayout": 800.00,
      "adminCommission": 250.00
    }
  }
}
```

**What Happens:**
1. Service fee (20% of job amount) transferred from escrow to admin
2. Contractor payout (80% of job amount) transferred from escrow to contractor
3. Job status changes to "completed"
4. Offer status changes to "completed"
5. Contractor notified

**Requirements:**
- Job must be in "in_progress" status
- Customer must be job owner
- Offer must exist

---

### Update Job Status
```http
PATCH /api/job/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress"
}
```

**Valid Status Transitions:**
- `open` → `assigned` (when offer accepted)
- `open` → `cancelled`
- `assigned` → `in_progress` (contractor starts work)
- `assigned` → `cancelled`
- `in_progress` → `completed` (use complete endpoint instead)
- `in_progress` → `cancelled`

**Response:**
```json
{
  "status": 200,
  "message": "Job status updated successfully",
  "data": { /* job object */ }
}
```

---

### Cancel Job
```http
POST /api/job/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Requirements changed"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Job cancelled successfully",
  "data": {
    "job": {
      "_id": "job_id",
      "status": "cancelled",
      "cancelledAt": "2025-11-13T10:00:00Z",
      "cancellationReason": "Requirements changed"
    },
    "refundAmount": 1050.00
  }
}
```

**What Happens:**
1. If offer exists: full refund to customer (job amount + platform fee)
2. Job status changes to "cancelled"
3. Offer status changes to "cancelled"
4. Contractor notified (if assigned)

**Requirements:**
- Cannot cancel completed jobs
- Customer or Admin only

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "status": 400,
  "message": "Insufficient wallet balance",
  "data": null
}
```

### Common Error Codes

**400 Bad Request:**
- Insufficient balance
- Invalid amount (< $10 or > $10,000)
- Job not in correct status
- Offer already exists
- Invalid status transition
- Wallet frozen

**401 Unauthorized:**
- Missing or invalid token
- Token expired

**403 Forbidden:**
- Not job owner
- Not offer recipient
- Wrong role (e.g., customer trying to withdraw)

**404 Not Found:**
- Job not found
- Application not found
- Offer not found
- Wallet not found

**500 Internal Server Error:**
- Database error
- Unexpected error

---

## Payment Flow Summary

### 1. Customer Sends Offer
```
Customer Wallet: -$1,050 (job amount + 5% platform fee)
Escrow: +$1,050
Status: Offer pending
```

### 2. Contractor Accepts Offer
```
Escrow: -$50 (platform fee)
Admin Wallet: +$50
Escrow: $1,000 remaining
Status: Job assigned, offer accepted
```

### 3. Customer Completes Job
```
Escrow: -$200 (service fee)
Admin Wallet: +$200
Escrow: -$800 (contractor payout)
Contractor Wallet: +$800
Status: Job completed, offer completed
```

### Total Commission
```
Admin Total: $250 (5% + 20%)
Contractor Gets: $800 (80% of job amount)
Customer Paid: $1,050 (job amount + 5%)
```

---

## Testing with cURL

### Get Wallet Balance
```bash
curl -X GET http://localhost:4000/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Offer
```bash
curl -X POST http://localhost:4000/api/job-request/APPLICATION_ID/send-offer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "timeline": "7 days",
    "description": "Complete plumbing work"
  }'
```

### Accept Offer
```bash
curl -X POST http://localhost:4000/api/job-request/offer/OFFER_ID/accept \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Complete Job
```bash
curl -X POST http://localhost:4000/api/job/JOB_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API Documentation URLs

- **Swagger UI:** http://localhost:4000/api-docs
- **Scalar UI:** http://localhost:4000/scaler
- **JSON Spec:** http://localhost:4000/api-docs.json

---

## Notes

1. All amounts are in USD
2. All timestamps are in ISO 8601 format
3. All endpoints require authentication except public job listings
4. Pagination defaults: page=1, limit=20
5. Commission rates are configurable in constants
6. One offer per job rule is enforced at database level
7. Escrow balance is separate from available balance
8. Contractors can only withdraw from available balance, not escrow
