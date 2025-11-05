# API Design - Payment & Bidding System

## Overview

This document describes all API endpoints for the payment and bidding system.

## Base URL

```
Development: http://localhost:4000/api
Production: https://your-domain.com/api
```

## Authentication

All endpoints require JWT Bearer token unless marked as public.

```
Authorization: Bearer <access_token>
```

---

## Bidding Module (`/api/bidding`)

### 1. Send Offer

Create and send an offer to a contractor.

**Endpoint**: `POST /api/bidding/offer`

**Auth**: Required (Customer only)

**Request Body**:

```json
{
  "jobId": "job_123",
  "contractorId": "contractor_123",
  "amount": 1000,
  "timeline": "7 days",
  "description": "Complete plumbing repair as discussed",
  "paymentMethodId": "pm_stripe_123"
}
```

**Response (201)**:

```json
{
  "status": 201,
  "message": "Offer sent successfully",
  "data": {
    "_id": "offer_123",
    "job": "job_123",
    "customer": "customer_123",
    "contractor": "contractor_123",
    "amount": 1000,
    "timeline": "7 days",
    "description": "Complete plumbing repair",
    "status": "pending",
    "paymentIntentId": "pi_stripe_123",
    "paymentStatus": "pending",
    "createdAt": "2025-11-05T10:00:00Z"
  }
}
```

**Errors**:

- 400: Job not open or already assigned
- 404: Job or contractor not found
- 402: Payment method declined

---

### 2. Get Sent Offers (Customer)

Get all offers sent by customer.

**Endpoint**: `GET /api/bidding/offers/sent`

**Auth**: Required (Customer only)

**Query Parameters**:

- `status` (optional): Filter by status (pending, accepted, rejected)
- `jobId` (optional): Filter by job
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200)**:

```json
{
  "status": 200,
  "message": "Offers retrieved successfully",
  "data": {
    "offers": [
      {
        "_id": "offer_123",
        "job": {
          "title": "Fix Plumbing",
          ...
        },
        "contractor": {
          "full_name": "John Contractor",
          ...
        },
        "amount": 1000,
        "status": "pending",
        "createdAt": "2025-11-05T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalOffers": 25,
      "limit": 10
    }
  }
}
```

---

### 3. Get Received Offers (Contractor)

Get all offers received by contractor.

**Endpoint**: `GET /api/bidding/offers/received`

**Auth**: Required (Contractor only)

**Query Parameters**: Same as sent offers

**Response**: Same structure as sent offers

---

### 4. Accept Offer

Contractor accepts an offer.

**Endpoint**: `POST /api/bidding/offer/:offerId/accept`

**Auth**: Required (Contractor only)

**Response (200)**:

```json
{
  "status": 200,
  "message": "Offer accepted successfully",
  "data": {
    "offer": {
      "_id": "offer_123",
      "status": "accepted",
      "acceptedAt": "2025-11-05T11:00:00Z"
    },
    "job": {
      "_id": "job_123",
      "status": "assigned",
      "contractorId": "contractor_123"
    },
    "payment": {
      "totalAmount": 1000,
      "platformFee": 100,
      "serviceFee": 200,
      "contractorPayout": 700
    }
  }
}
```

**Errors**:

- 400: Offer already processed
- 403: Not authorized (not the contractor)
- 402: Payment capture failed

---

### 5. Reject Offer

Contractor rejects an offer.

**Endpoint**: `POST /api/bidding/offer/:offerId/reject`

**Auth**: Required (Contractor only)

**Request Body**:

```json
{
  "reason": "Timeline too short"
}
```

**Response (200)**:

```json
{
  "status": 200,
  "message": "Offer rejected successfully",
  "data": {
    "offer": {
      "_id": "offer_123",
      "status": "rejected",
      "rejectedAt": "2025-11-05T11:00:00Z",
      "rejectionReason": "Timeline too short"
    },
    "refund": {
      "amount": 1000,
      "status": "processing"
    }
  }
}
```

---

### 6. Cancel Offer

Customer cancels a pending offer.

**Endpoint**: `DELETE /api/bidding/offer/:offerId`

**Auth**: Required (Customer only)

**Response (200)**:

```json
{
  "status": 200,
  "message": "Offer cancelled successfully",
  "data": {
    "refundAmount": 1000
  }
}
```

**Errors**:

- 400: Cannot cancel accepted offer
- 403: Not authorized

---

### 7. Get Offer Details

Get details of a specific offer.

**Endpoint**: `GET /api/bidding/offer/:offerId`

**Auth**: Required (Customer or Contractor involved)

**Response (200)**:

```json
{
  "status": 200,
  "message": "Offer retrieved successfully",
  "data": {
    "_id": "offer_123",
    "job": {...},
    "customer": {...},
    "contractor": {...},
    "amount": 1000,
    "timeline": "7 days",
    "description": "...",
    "status": "pending",
    "paymentStatus": "pending",
    "createdAt": "2025-11-05T10:00:00Z"
  }
}
```

---

## Payment Module (`/api/payment`)

### 1. Get Payment History

Get user's payment history.

**Endpoint**: `GET /api/payment/history`

**Auth**: Required

**Query Parameters**:

- `type` (optional): Filter by type (sent, received)
- `status` (optional): Filter by status
- `page`, `limit`: Pagination

**Response (200)**:

```json
{
  "status": 200,
  "message": "Payment history retrieved",
  "data": {
    "payments": [
      {
        "_id": "payment_123",
        "offer": {...},
        "job": {...},
        "totalAmount": 1000,
        "platformFee": 100,
        "serviceFee": 200,
        "contractorPayout": 700,
        "status": "released",
        "createdAt": "2025-11-05T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### 2. Get Payment Details

Get details of a specific payment.

**Endpoint**: `GET /api/payment/:paymentId`

**Auth**: Required

**Response (200)**:

```json
{
  "status": 200,
  "message": "Payment details retrieved",
  "data": {
    "_id": "payment_123",
    "offer": {...},
    "job": {...},
    "customer": {...},
    "contractor": {...},
    "totalAmount": 1000,
    "platformFee": 100,
    "serviceFee": 200,
    "contractorPayout": 700,
    "status": "released",
    "paymentIntentId": "pi_stripe_123",
    "transferId": "tr_stripe_123",
    "capturedAt": "2025-11-05T11:00:00Z",
    "releasedAt": "2025-11-12T10:00:00Z"
  }
}
```

---

### 3. Request Refund

Customer requests a refund.

**Endpoint**: `POST /api/payment/:paymentId/refund`

**Auth**: Required (Customer only)

**Request Body**:

```json
{
  "reason": "Work not completed as agreed"
}
```

**Response (200)**:

```json
{
  "status": 200,
  "message": "Refund request submitted",
  "data": {
    "refundRequestId": "refund_req_123",
    "status": "pending_review"
  }
}
```

---

## Wallet Module (`/api/wallet`)

### 1. Get Wallet Balance

Get user's wallet balance.

**Endpoint**: `GET /api/wallet`

**Auth**: Required

**Response (200)**:

```json
{
  "status": 200,
  "message": "Wallet retrieved successfully",
  "data": {
    "_id": "wallet_123",
    "user": "user_123",
    "balance": 5000,
    "currency": "USD",
    "pendingBalance": 1000,
    "totalEarnings": 10000,
    "totalWithdrawals": 5000,
    "stripeAccountStatus": "active",
    "isActive": true,
    "isFrozen": false
  }
}
```

---

### 2. Get Transaction History

Get wallet transaction history.

**Endpoint**: `GET /api/wallet/transactions`

**Auth**: Required

**Query Parameters**:

- `type` (optional): Filter by type
- `status` (optional): Filter by status
- `page`, `limit`: Pagination

**Response (200)**:

```json
{
  "status": 200,
  "message": "Transactions retrieved",
  "data": {
    "transactions": [
      {
        "_id": "txn_123",
        "type": "contractor_payout",
        "amount": 700,
        "from": "admin",
        "to": "contractor_123",
        "status": "completed",
        "description": "Payment for completed job",
        "createdAt": "2025-11-05T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### 3. Connect Stripe Account (Contractor)

Connect contractor's Stripe account for payouts.

**Endpoint**: `POST /api/wallet/connect-stripe`

**Auth**: Required (Contractor only)

**Response (200)**:

```json
{
  "status": 200,
  "message": "Stripe account link created",
  "data": {
    "url": "https://connect.stripe.com/setup/...",
    "expiresAt": "2025-11-05T11:00:00Z"
  }
}
```

---

### 4. Request Withdrawal (Contractor)

Request withdrawal of available balance.

**Endpoint**: `POST /api/wallet/withdraw`

**Auth**: Required (Contractor only)

**Request Body**:

```json
{
  "amount": 500
}
```

**Response (200)**:

```json
{
  "status": 200,
  "message": "Withdrawal initiated",
  "data": {
    "withdrawalId": "withdrawal_123",
    "amount": 500,
    "estimatedArrival": "2-3 business days",
    "status": "processing"
  }
}
```

**Errors**:

- 400: Insufficient balance
- 403: Stripe account not connected

---

## Job Module Updates

### 1. Mark Job Complete

Customer marks job as complete.

**Endpoint**: `POST /api/job/:jobId/complete`

**Auth**: Required (Customer only)

**Response (200)**:

```json
{
  "status": 200,
  "message": "Job marked as complete",
  "data": {
    "job": {
      "_id": "job_123",
      "status": "completed",
      "completedAt": "2025-11-12T10:00:00Z"
    },
    "payment": {
      "serviceFee": 200,
      "contractorPayout": 700,
      "adminCommission": 300
    }
  }
}
```

---

### 2. Cancel Job

Cancel a job.

**Endpoint**: `POST /api/job/:jobId/cancel`

**Auth**: Required (Customer or Admin)

**Request Body**:

```json
{
  "reason": "No longer needed"
}
```

**Response (200)**:

```json
{
  "status": 200,
  "message": "Job cancelled successfully",
  "data": {
    "job": {
      "status": "cancelled",
      "cancelledAt": "2025-11-05T12:00:00Z"
    },
    "refund": {
      "amount": 900,
      "status": "processing"
    }
  }
}
```

---

## Admin Endpoints

### 1. Get Commission Earnings

Get admin commission earnings.

**Endpoint**: `GET /api/admin/earnings`

**Auth**: Required (Admin only)

**Query Parameters**:

- `startDate`, `endDate`: Date range
- `type`: Filter by fee type

**Response (200)**:

```json
{
  "status": 200,
  "message": "Earnings retrieved",
  "data": {
    "totalEarnings": 30000,
    "platformFees": 10000,
    "serviceFees": 20000,
    "breakdown": [
      {
        "date": "2025-11-05",
        "platformFees": 500,
        "serviceFees": 1000,
        "total": 1500
      }
    ]
  }
}
```

---

### 2. Review Refund Request

Admin reviews refund request.

**Endpoint**: `POST /api/admin/refund/:refundId/review`

**Auth**: Required (Admin only)

**Request Body**:

```json
{
  "decision": "approve",
  "refundAmount": 1000,
  "notes": "Customer provided valid evidence"
}
```

---

## Webhook Endpoint

### Stripe Webhook

Handle Stripe webhook events.

**Endpoint**: `POST /api/webhooks/stripe`

**Auth**: Stripe signature verification

**Events Handled**:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.failed`
- `account.updated`
- `charge.refunded`

---

## Error Responses

### Standard Error Format

```json
{
  "status": 400,
  "message": "Error description",
  "data": null,
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be positive"
    }
  ]
}
```

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `402` - Payment Required (payment failed)
- `409` - Conflict (duplicate action)
- `500` - Internal Server Error

---

## Rate Limiting

- **General**: 100 requests per minute
- **Payment**: 10 requests per minute
- **Webhook**: No limit (Stripe controlled)

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format**:

```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Summary

This API design provides:

- ✅ Complete offer management
- ✅ Secure payment processing
- ✅ Wallet and transaction tracking
- ✅ Admin commission monitoring
- ✅ Refund handling
- ✅ Webhook integration
- ✅ Proper error handling
- ✅ Pagination support
