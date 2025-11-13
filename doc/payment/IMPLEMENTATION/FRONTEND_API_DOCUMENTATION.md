# 📱 JobSphere Payment System - Frontend/Mobile API Documentation

**Version**: 1.0.0  
**Last Updated**: 2025-11-13  
**Base URL**: `http://your-domain.com/api`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Payment Flow](#payment-flow)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Integration Examples](#integration-examples)
8. [Testing Guide](#testing-guide)

---

## 🎯 Overview

The JobSphere payment system enables secure transactions between customers and contractors through an escrow-based payment model.

### Key Features

- ✅ Escrow-based payments
- ✅ Automated commission handling (5% + 20%)
- ✅ Wallet management
- ✅ Offer system (one offer per job)
- ✅ Automatic refunds
- ✅ Real-time notifications
- ✅ Transaction history

### Commission Structure

```
$100 Job Example:
├── Customer Pays: $105 (100 + 5% platform fee)
├── Platform Fee: $5 (5%) → Admin (when offer accepted)
├── Service Fee: $20 (20%) → Admin (when job completed)
└── Contractor Gets: $80 (80%) → Contractor (when job completed)
```

---

## 🔐 Authentication

All API requests require JWT authentication unless specified as public.

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Management

- Access tokens expire after 15 days (development)
- Refresh tokens expire after 30 days
- Store tokens securely (never in localStorage for web)

---

## 🔄 Payment Flow

### Complete User Journey

```
1. CUSTOMER POSTS JOB
   └─> POST /api/job

2. CONTRACTOR APPLIES
   └─> POST /api/job-request/apply/:jobId

3. CUSTOMER SENDS OFFER
   └─> POST /api/job-request/:applicationId/send-offer
   └─> Money moved to escrow ($105)

4. CONTRACTOR ACCEPTS/REJECTS
   ├─> Accept: POST /api/job-request/offer/:offerId/accept
   │   └─> Platform fee ($5) → Admin
   │   └─> Job status → "assigned"
   └─> Reject: POST /api/job-request/offer/:offerId/reject
       └─> Full refund ($105) → Customer

5. CONTRACTOR WORKS
   └─> PATCH /api/job/:id/status { "status": "in_progress" }

6. CUSTOMER MARKS COMPLETE
   └─> POST /api/job/:id/complete
   └─> Service fee ($20) → Admin
   └─> Contractor payout ($80) → Contractor
```

---

## 📡 API Endpoints

### Wallet Management

#### Get Wallet Balance

```http
GET /api/wallet
Authorization: Bearer <token>
```

**Response**:

```json
{
  "status": 200,
  "message": "Wallet retrieved successfully",
  "data": {
    "_id": "wallet_id",
    "user": "user_id",
    "balance": 1000,
    "escrowBalance": 100,
    "currency": "USD",
    "totalEarnings": 5000,
    "totalSpent": 2000,
    "totalWithdrawals": 2000,
    "isActive": true,
    "isFrozen": false
  }
}
```

---

#### Deposit Money

```http
POST /api/wallet/deposit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "amount": 100,
  "paymentMethodId": "pm_stripe_123"
}
```

**Response**:

```json
{
  "status": 200,
  "message": "Deposit successful",
  "data": {
    "wallet": {
      "balance": 1100,
      "escrowBalance": 100
    },
    "transaction": {
      "amount": 100,
      "type": "deposit"
    }
  }
}
```

**Validation**:

- Minimum deposit: $10
- Amount must be positive number

---

#### Withdraw Money (Contractors Only)

```http
POST /api/wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "amount": 100
}
```

**Response**:

```json
{
  "status": 200,
  "message": "Withdrawal successful",
  "data": {
    "amount": 100,
    "newBalance": 900,
    "estimatedArrival": "2-3 business days"
  }
}
```

**Validation**:

- Only contractors can withdraw
- Minimum: $10
- Maximum: $10,000
- Must have sufficient balance
- Wallet must not be frozen

---

#### Get Transaction History

```http
GET /api/wallet/transactions?page=1&limit=10&type=deposit
Authorization: Bearer <token>
```

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by type

**Transaction Types**:

- `deposit` - Money added to wallet
- `withdrawal` - Money withdrawn
- `escrow_hold` - Money held in escrow
- `platform_fee` - Platform fee payment
- `service_fee` - Service fee payment
- `contractor_payout` - Payment to contractor
- `refund` - Refund received

**Response**:

```json
{
  "status": 200,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "_id": "txn_123",
        "type": "deposit",
        "amount": 100,
        "from": { "_id": "user_id", "full_name": "John Doe" },
        "to": { "_id": "user_id", "full_name": "John Doe" },
        "status": "completed",
        "description": "Wallet deposit of 100",
        "createdAt": "2025-11-13T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### Offer Management

#### Send Offer (Customer Only)

```http
POST /api/job-request/:applicationId/send-offer
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "amount": 100,
  "timeline": "7 days",
  "description": "Complete plumbing repair as discussed in chat"
}
```

**Validation**:

- Amount: Min $10, Max $10,000
- Timeline: Min 1 char, Max 100 chars
- Description: Min 10 chars, Max 1000 chars

**Response**:

```json
{
  "status": 201,
  "message": "Offer sent successfully",
  "data": {
    "offer": {
      "_id": "offer_123",
      "job": "job_123",
      "customer": "customer_123",
      "contractor": "contractor_123",
      "amount": 100,
      "platformFee": 5,
      "serviceFee": 20,
      "contractorPayout": 80,
      "totalCharge": 105,
      "timeline": "7 days",
      "description": "Complete plumbing repair",
      "status": "pending",
      "expiresAt": "2025-11-20T10:00:00Z",
      "createdAt": "2025-11-13T10:00:00Z"
    },
    "walletBalance": 895,
    "amounts": {
      "jobBudget": 100,
      "platformFee": 5,
      "serviceFee": 20,
      "contractorPayout": 80,
      "totalCharge": 105,
      "adminTotal": 25
    }
  }
}
```

**Error Cases**:

- `400` - Insufficient wallet balance
- `400` - Job not open
- `400` - Offer already exists for this job
- `403` - Not authorized (not job owner)

---

#### Accept Offer (Contractor Only)

```http
POST /api/job-request/offer/:offerId/accept
Authorization: Bearer <token>
```

**Response**:

```json
{
  "status": 200,
  "message": "Offer accepted successfully",
  "data": {
    "offer": {
      "_id": "offer_123",
      "status": "accepted",
      "acceptedAt": "2025-11-13T11:00:00Z"
    },
    "job": {
      "_id": "job_123",
      "status": "assigned",
      "contractorId": "contractor_123",
      "assignedAt": "2025-11-13T11:00:00Z"
    },
    "payment": {
      "platformFee": 5,
      "serviceFee": 20,
      "contractorPayout": 80
    }
  }
}
```

**What Happens**:

1. Offer status → "accepted"
2. Job status → "assigned"
3. Platform fee ($5) transferred to admin
4. Remaining $100 stays in escrow
5. All other applications rejected
6. Notifications sent to customer and other applicants

**Error Cases**:

- `400` - Offer not found or already processed
- `403` - Not authorized (not offer recipient)

---

#### Reject Offer (Contractor Only)

```http
POST /api/job-request/offer/:offerId/reject
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "reason": "Timeline too short for quality work"
}
```

**Response**:

```json
{
  "status": 200,
  "message": "Offer rejected successfully",
  "data": {
    "offer": {
      "_id": "offer_123",
      "status": "rejected",
      "rejectedAt": "2025-11-13T11:00:00Z",
      "rejectionReason": "Timeline too short"
    },
    "refundAmount": 105
  }
}
```

**What Happens**:

1. Offer status → "rejected"
2. Full refund ($105) to customer wallet
3. Application status reset to "pending"
4. Customer can send new offer
5. Notification sent to customer

---

### Job Management

#### Update Job Status

```http
PATCH /api/job/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "status": "in_progress"
}
```

**Valid Status Transitions**:

```
open → assigned, cancelled
assigned → in_progress, cancelled
in_progress → completed, cancelled
completed → (terminal state)
cancelled → (terminal state)
```

**Response**:

```json
{
  "status": 200,
  "message": "Job status updated",
  "data": {
    "_id": "job_123",
    "status": "in_progress",
    "updatedAt": "2025-11-13T12:00:00Z"
  }
}
```

**Authorization**:

- Customer or Contractor can update
- Must be involved in the job

---

#### Complete Job (Customer Only)

```http
POST /api/job/:id/complete
Authorization: Bearer <token>
```

**Response**:

```json
{
  "status": 200,
  "message": "Job marked as complete",
  "data": {
    "job": {
      "_id": "job_123",
      "status": "completed",
      "completedAt": "2025-11-13T15:00:00Z"
    },
    "payment": {
      "serviceFee": 20,
      "contractorPayout": 80,
      "adminCommission": 25
    }
  }
}
```

**What Happens**:

1. Job status → "completed"
2. Offer status → "completed"
3. Service fee ($20) → Admin wallet
4. Contractor payout ($80) → Contractor wallet
5. Escrow released
6. Transaction records created
7. Notification sent to contractor

**Prerequisites**:

- Job must be "in_progress"
- Customer must own the job
- Offer must be "accepted"

---

#### Cancel Job

```http
POST /api/job/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "reason": "No longer needed"
}
```

**Response**:

```json
{
  "status": 200,
  "message": "Job cancelled successfully",
  "data": {
    "job": {
      "_id": "job_123",
      "status": "cancelled",
      "cancelledAt": "2025-11-13T13:00:00Z",
      "cancellationReason": "No longer needed"
    },
    "refundAmount": 105
  }
}
```

**What Happens**:

1. Job status → "cancelled"
2. Offer status → "cancelled"
3. Full refund to customer (if offer exists)
4. Escrow released
5. Notification sent to contractor

**Authorization**:

- Customer or Admin only
- Cannot cancel completed jobs

---

## 📊 Data Models

### Wallet Object

```typescript
interface Wallet {
  _id: string;
  user: string; // User ID
  balance: number; // Available balance
  escrowBalance: number; // Money held in escrow
  currency: string; // "USD"
  isActive: boolean;
  isFrozen: boolean;
  totalEarnings: number; // Lifetime earnings
  totalSpent: number; // Lifetime spending
  totalWithdrawals: number; // Lifetime withdrawals
  createdAt: string;
  updatedAt: string;
}
```

### Offer Object

```typescript
interface Offer {
  _id: string;
  job: string; // Job ID
  customer: string; // Customer ID
  contractor: string; // Contractor ID
  application: string; // Application ID

  // Amounts
  amount: number; // Job budget (e.g., 100)
  platformFee: number; // 5% (e.g., 5)
  serviceFee: number; // 20% (e.g., 20)
  contractorPayout: number; // 80% (e.g., 80)
  totalCharge: number; // Total charged (e.g., 105)

  // Details
  timeline: string;
  description: string;

  // Status
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "cancelled"
    | "completed"
    | "expired";

  // Timestamps
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  expiresAt?: string; // Auto-expires after 7 days

  // Reasons
  rejectionReason?: string;
  cancellationReason?: string;

  createdAt: string;
  updatedAt: string;
}
```

### Transaction Object

```typescript
interface Transaction {
  _id: string;
  type:
    | "platform_fee"
    | "service_fee"
    | "contractor_payout"
    | "refund"
    | "deposit"
    | "withdrawal"
    | "escrow_hold"
    | "escrow_release";
  amount: number;
  from: User; // Populated user object
  to: User; // Populated user object
  offer?: string; // Offer ID
  job?: string; // Job ID
  status: "pending" | "completed" | "failed";
  description: string;
  failureReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Job Object (Updated)

```typescript
interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  category: string[];
  location: string;
  address: string;
  coverImg: string;
  customerId: string;

  // Payment system fields
  contractorId?: string; // Assigned contractor
  offerId?: string; // Accepted offer
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  assignedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

## ⚠️ Error Handling

### Standard Error Response

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

| Code | Meaning      | Common Causes                    |
| ---- | ------------ | -------------------------------- |
| 400  | Bad Request  | Invalid input, validation failed |
| 401  | Unauthorized | Missing or invalid token         |
| 403  | Forbidden    | Insufficient permissions         |
| 404  | Not Found    | Resource doesn't exist           |
| 500  | Server Error | Internal server error            |

### Error Messages by Endpoint

#### Wallet Errors

- `"Wallet not found"` - User has no wallet (auto-creates on first use)
- `"Insufficient balance. Available: $X"` - Not enough money
- `"Minimum deposit amount is $10"` - Deposit too small
- `"Only contractors can withdraw funds"` - Wrong user role
- `"Wallet is frozen. Please contact support."` - Wallet frozen by admin

#### Offer Errors

- `"Insufficient balance. Required: $X, Available: $Y"` - Not enough money
- `"Job is not open for offers"` - Job already assigned or completed
- `"An offer already exists for this job"` - One offer per job rule
- `"Offer not found or already processed"` - Invalid offer or status
- `"Not authorized"` - User doesn't own resource

#### Job Errors

- `"Job not found or not in progress"` - Invalid job or status
- `"Cannot transition from X to Y"` - Invalid status change
- `"Cannot cancel completed job"` - Job already done
- `"No contractor assigned to this job"` - Missing contractor

---

## 💡 Integration Examples

### React/Next.js Example

```typescript
// services/wallet.service.ts
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class WalletService {
  private static getHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  static async getWallet() {
    const response = await axios.get(`${API_BASE_URL}/wallet`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  static async deposit(amount: number, paymentMethodId: string) {
    const response = await axios.post(
      `${API_BASE_URL}/wallet/deposit`,
      { amount, paymentMethodId },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  static async withdraw(amount: number) {
    const response = await axios.post(
      `${API_BASE_URL}/wallet/withdraw`,
      { amount },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  static async getTransactions(page = 1, limit = 10, type?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
    });

    const response = await axios.get(
      `${API_BASE_URL}/wallet/transactions?${params}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}
```

```typescript
// services/offer.service.ts
export class OfferService {
  private static getHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  static async sendOffer(
    applicationId: string,
    amount: number,
    timeline: string,
    description: string
  ) {
    const response = await axios.post(
      `${API_BASE_URL}/job-request/${applicationId}/send-offer`,
      { amount, timeline, description },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  static async acceptOffer(offerId: string) {
    const response = await axios.post(
      `${API_BASE_URL}/job-request/offer/${offerId}/accept`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  static async rejectOffer(offerId: string, reason: string) {
    const response = await axios.post(
      `${API_BASE_URL}/job-request/offer/${offerId}/reject`,
      { reason },
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}
```

---

### Flutter/Dart Example

```dart
// services/wallet_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class WalletService {
  static const String baseUrl = 'http://your-domain.com/api';

  static Future<Map<String, dynamic>> getHeaders() async {
    final token = await storage.read(key: 'accessToken');
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  static Future<Map<String, dynamic>> getWallet() async {
    final headers = await getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/wallet'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load wallet');
    }
  }

  static Future<Map<String, dynamic>> deposit(
    double amount,
    String paymentMethodId,
  ) async {
    final headers = await getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/wallet/deposit'),
      headers: headers,
      body: json.encode({
        'amount': amount,
        'paymentMethodId': paymentMethodId,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to deposit');
    }
  }

  static Future<Map<String, dynamic>> withdraw(double amount) async {
    final headers = await getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/wallet/withdraw'),
      headers: headers,
      body: json.encode({'amount': amount}),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message']);
    }
  }

  static Future<Map<String, dynamic>> getTransactions({
    int page = 1,
    int limit = 10,
    String? type,
  }) async {
    final headers = await getHeaders();
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      if (type != null) 'type': type,
    };

    final uri = Uri.parse('$baseUrl/wallet/transactions')
        .replace(queryParameters: queryParams);

    final response = await http.get(uri, headers: headers);

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load transactions');
    }
  }
}
```

```dart
// services/offer_service.dart
class OfferService {
  static const String baseUrl = 'http://your-domain.com/api';

  static Future<Map<String, dynamic>> sendOffer({
    required String applicationId,
    required double amount,
    required String timeline,
    required String description,
  }) async {
    final headers = await WalletService.getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/job-request/$applicationId/send-offer'),
      headers: headers,
      body: json.encode({
        'amount': amount,
        'timeline': timeline,
        'description': description,
      }),
    );

    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message']);
    }
  }

  static Future<Map<String, dynamic>> acceptOffer(String offerId) async {
    final headers = await WalletService.getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/job-request/offer/$offerId/accept'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message']);
    }
  }

  static Future<Map<String, dynamic>> rejectOffer(
    String offerId,
    String reason,
  ) async {
    final headers = await WalletService.getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/job-request/offer/$offerId/reject'),
      headers: headers,
      body: json.encode({'reason': reason}),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message']);
    }
  }
}
```

---

## 🧪 Testing Guide

### Test Accounts

Create test accounts for different roles:

```javascript
// Customer Account
{
  email: "customer@test.com",
  password: "Test123!",
  role: "customer"
}

// Contractor Account
{
  email: "contractor@test.com",
  password: "Test123!",
  role: "contractor"
}
```

### Test Flow

#### 1. Setup Wallet (Customer)

```bash
# Login as customer
POST /api/auth/login
{
  "email": "customer@test.com",
  "password": "Test123!"
}

# Deposit money
POST /api/wallet/deposit
{
  "amount": 200,
  "paymentMethodId": "pm_test_123"
}

# Verify balance
GET /api/wallet
# Expected: balance = 200
```

#### 2. Post Job (Customer)

```bash
POST /api/job
{
  "title": "Fix Kitchen Sink",
  "description": "Leaking kitchen sink needs repair",
  "budget": 100,
  "category": ["plumbing"],
  "location": "location_id",
  "address": "123 Main St",
  "coverImg": "image_url"
}
```

#### 3. Apply to Job (Contractor)

```bash
# Login as contractor
POST /api/auth/login
{
  "email": "contractor@test.com",
  "password": "Test123!"
}

# Apply to job
POST /api/job-request/apply/:jobId
{
  "message": "I have 5 years experience in plumbing"
}
```

#### 4. Send Offer (Customer)

```bash
POST /api/job-request/:applicationId/send-offer
{
  "amount": 100,
  "timeline": "2 days",
  "description": "Fix the leak and replace gasket"
}

# Verify wallet
GET /api/wallet
# Expected: balance = 95, escrowBalance = 105
```

#### 5. Accept Offer (Contractor)

```bash
POST /api/job-request/offer/:offerId/accept

# Verify job status
GET /api/job/:jobId
# Expected: status = "assigned", contractorId = contractor_id
```

#### 6. Complete Work (Contractor)

```bash
PATCH /api/job/:jobId/status
{
  "status": "in_progress"
}
```

#### 7. Mark Complete (Customer)

```bash
POST /api/job/:jobId/complete

# Verify contractor wallet
GET /api/wallet (as contractor)
# Expected: balance = 80
```

#### 8. Withdraw (Contractor)

```bash
POST /api/wallet/withdraw
{
  "amount": 50
}

# Verify balance
GET /api/wallet
# Expected: balance = 30, totalWithdrawals = 50
```

---

### Test Scenarios

#### Scenario 1: Insufficient Balance

```bash
# Customer with $50 balance tries to send $100 offer
POST /api/job-request/:applicationId/send-offer
{
  "amount": 100,
  "timeline": "2 days",
  "description": "Test"
}

# Expected Error:
{
  "status": 400,
  "message": "Insufficient balance. Required: 105, Available: 50"
}
```

#### Scenario 2: Duplicate Offer

```bash
# Customer sends offer
POST /api/job-request/:applicationId/send-offer
{ "amount": 100, ... }

# Customer tries to send another offer for same job
POST /api/job-request/:applicationId2/send-offer
{ "amount": 100, ... }

# Expected Error:
{
  "status": 400,
  "message": "An offer already exists for this job"
}
```

#### Scenario 3: Offer Rejection

```bash
# Contractor rejects offer
POST /api/job-request/offer/:offerId/reject
{
  "reason": "Timeline too short"
}

# Verify customer wallet refunded
GET /api/wallet (as customer)
# Expected: balance = 200 (full refund)
```

#### Scenario 4: Job Cancellation

```bash
# Customer cancels job after sending offer
POST /api/job/:jobId/cancel
{
  "reason": "No longer needed"
}

# Verify refund
GET /api/wallet (as customer)
# Expected: balance = 200 (full refund)
```

---

## 🎨 UI/UX Recommendations

### Wallet Display

```typescript
// Display wallet balance prominently
interface WalletDisplay {
  availableBalance: number;      // Show in green
  escrowBalance: number;         // Show in yellow/orange
  totalEarnings: number;         // Show in info section
}

// Example UI:
┌─────────────────────────────┐
│ 💰 Wallet                   │
├─────────────────────────────┤
│ Available: $1,000.00        │
│ In Escrow: $105.00          │
│ Total Earned: $5,000.00     │
└─────────────────────────────┘
```

### Offer Flow UI

#### Customer View (Sending Offer)

```
1. Show application details
2. Display commission breakdown:
   ┌─────────────────────────────┐
   │ Offer Amount: $100.00       │
   │ Platform Fee (5%): $5.00    │
   │ ─────────────────────────   │
   │ Total Charge: $105.00       │
   │                             │
   │ Contractor Gets: $80.00     │
   │ (after 20% service fee)     │
   └─────────────────────────────┘
3. Show wallet balance
4. Confirm button (disabled if insufficient balance)
```

#### Contractor View (Receiving Offer)

```
1. Show offer details
2. Display earnings breakdown:
   ┌─────────────────────────────┐
   │ Offer Amount: $100.00       │
   │ Service Fee (20%): $20.00   │
   │ ─────────────────────────   │
   │ You'll Receive: $80.00      │
   │                             │
   │ Timeline: 7 days            │
   │ Expires: Nov 20, 2025       │
   └─────────────────────────────┘
3. Accept/Reject buttons
4. Rejection reason modal
```

### Job Status Indicators

```typescript
const statusColors = {
  open: "blue", // 🔵 Open for applications
  assigned: "purple", // 🟣 Contractor assigned
  in_progress: "orange", // 🟠 Work in progress
  completed: "green", // 🟢 Completed
  cancelled: "red", // 🔴 Cancelled
};

const statusLabels = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
```

### Transaction History UI

```typescript
// Group transactions by type
const transactionIcons = {
  deposit: "💵",
  withdrawal: "💸",
  escrow_hold: "🔒",
  platform_fee: "🏢",
  service_fee: "🏢",
  contractor_payout: "💰",
  refund: "↩️",
};

// Show transaction direction
const transactionDirection = (tx: Transaction, userId: string) => {
  if (tx.from._id === userId && tx.to._id === userId) {
    return "internal"; // Same user (deposit/withdrawal)
  }
  return tx.from._id === userId ? "outgoing" : "incoming";
};
```

### Notifications

```typescript
// Show real-time notifications for:
const notificationTypes = {
  offer_received: {
    title: "New Offer Received",
    body: 'You received an offer of $100 for "Fix Kitchen Sink"',
    action: "View Offer",
  },
  offer_accepted: {
    title: "Offer Accepted",
    body: "Your offer has been accepted",
    action: "View Job",
  },
  offer_rejected: {
    title: "Offer Rejected",
    body: "Your offer was rejected. $105 refunded to your wallet",
    action: "View Wallet",
  },
  payment_released: {
    title: "Payment Received",
    body: "You received $80 for completing the job",
    action: "View Wallet",
  },
  offer_expired: {
    title: "Offer Expired",
    body: "Your offer expired. $105 refunded to your wallet",
    action: "View Wallet",
  },
};
```

---

## 🔔 Real-Time Updates

### WebSocket/Socket.IO Integration

The backend uses Socket.IO for real-time updates. Connect to receive instant notifications:

```typescript
import io from "socket.io-client";

const socket = io("http://your-domain.com", {
  auth: {
    token: accessToken,
  },
});

// Listen for payment events
socket.on("offer_received", (data) => {
  // Show notification
  // Update UI
});

socket.on("payment_released", (data) => {
  // Update wallet balance
  // Show success message
});

socket.on("offer_expired", (data) => {
  // Update wallet balance
  // Show notification
});
```

---

## 📱 Mobile-Specific Considerations

### Push Notifications

The backend sends FCM push notifications for all payment events:

```dart
// Register FCM token
POST /api/notification/register-token
{
  "token": "fcm_token_here",
  "deviceId": "device_id",
  "deviceType": "android" // or "ios"
}

// Handle notification payload
{
  "title": "Payment Received",
  "body": "You received $80",
  "type": "payment_received",
  "data": {
    "jobId": "job_123",
    "amount": "80"
  }
}
```

### Offline Support

```typescript
// Cache wallet balance locally
interface CachedWallet {
  balance: number;
  lastUpdated: string;
  syncStatus: "synced" | "pending" | "error";
}

// Sync when online
const syncWallet = async () => {
  if (navigator.onLine) {
    const wallet = await WalletService.getWallet();
    localStorage.setItem(
      "wallet",
      JSON.stringify({
        ...wallet.data,
        lastUpdated: new Date().toISOString(),
        syncStatus: "synced",
      })
    );
  }
};
```

---

## 🔒 Security Best Practices

### Token Management

```typescript
// ❌ DON'T: Store tokens in localStorage (web)
localStorage.setItem("accessToken", token);

// ✅ DO: Use httpOnly cookies or secure storage
// For mobile: Use secure storage (Keychain/Keystore)
import * as SecureStore from "expo-secure-store";

await SecureStore.setItemAsync("accessToken", token);
const token = await SecureStore.getItemAsync("accessToken");
```

### Input Validation

```typescript
// Validate amounts before sending
const validateAmount = (amount: number): string | null => {
  if (amount < 10) return "Minimum amount is $10";
  if (amount > 10000) return "Maximum amount is $10,000";
  if (!Number.isFinite(amount)) return "Invalid amount";
  return null;
};

// Validate timeline
const validateTimeline = (timeline: string): string | null => {
  if (timeline.length < 1) return "Timeline is required";
  if (timeline.length > 100) return "Timeline too long";
  return null;
};

// Validate description
const validateDescription = (desc: string): string | null => {
  if (desc.length < 10) return "Description must be at least 10 characters";
  if (desc.length > 1000) return "Description too long";
  return null;
};
```

### Error Handling

```typescript
// Centralized error handler
const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data.message || "Invalid request";
      case 401:
        // Token expired, redirect to login
        logout();
        return "Session expired. Please login again";
      case 403:
        return "You do not have permission to perform this action";
      case 404:
        return "Resource not found";
      case 500:
        return "Server error. Please try again later";
      default:
        return data.message || "An error occurred";
    }
  } else if (error.request) {
    // No response received
    return "Network error. Please check your connection";
  } else {
    // Request setup error
    return "An unexpected error occurred";
  }
};
```

### Rate Limiting

```typescript
// Implement client-side rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(
    endpoint: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];

    // Remove old requests outside window
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(endpoint, validRequests);
    return true;
  }
}

// Usage
const limiter = new RateLimiter();

if (!limiter.canMakeRequest("/wallet/withdraw", 5, 60000)) {
  throw new Error("Too many requests. Please wait a moment.");
}
```

---

## 📊 Analytics & Tracking

### Track Key Events

```typescript
// Track payment events for analytics
const trackEvent = (eventName: string, properties: any) => {
  // Your analytics service (e.g., Mixpanel, Amplitude)
  analytics.track(eventName, properties);
};

// Wallet events
trackEvent("wallet_deposit", { amount, method: "stripe" });
trackEvent("wallet_withdraw", { amount });

// Offer events
trackEvent("offer_sent", { amount, jobId });
trackEvent("offer_accepted", { amount, jobId });
trackEvent("offer_rejected", { amount, jobId, reason });

// Job events
trackEvent("job_completed", { amount, jobId, duration });
trackEvent("payment_released", { amount, jobId });
```

### Monitor Performance

```typescript
// Track API response times
const measureApiCall = async (
  endpoint: string,
  apiCall: () => Promise<any>
) => {
  const startTime = performance.now();

  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;

    // Log slow requests
    if (duration > 3000) {
      console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`API call failed: ${endpoint} after ${duration}ms`, error);
    throw error;
  }
};
```

---

## 🐛 Debugging Tips

### Enable Debug Mode

```typescript
// Add debug logging
const DEBUG = process.env.NODE_ENV === "development";

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[Payment Debug] ${message}`, data);
  }
};

// Usage
debugLog("Sending offer", { amount, timeline });
debugLog("Wallet balance", wallet);
```

### Common Issues

#### Issue 1: "Insufficient balance" but wallet shows enough

```typescript
// Solution: Check escrow balance
const totalAvailable = wallet.balance; // Don't include escrowBalance
const required = amount * 1.05; // Include 5% platform fee

if (totalAvailable < required) {
  console.log("Need:", required, "Have:", totalAvailable);
}
```

#### Issue 2: Offer not appearing after sending

```typescript
// Solution: Check offer status and expiration
GET / api / job - request / offers / sent;

// Verify:
// 1. Offer was created (status 201)
// 2. Wallet was debited
// 3. Offer status is "pending"
// 4. Offer hasn't expired
```

#### Issue 3: Payment not released after completion

```typescript
// Solution: Verify job status progression
// 1. Job must be "in_progress" before completion
// 2. Customer must call complete endpoint
// 3. Check transaction history for service_fee and contractor_payout
```

---

## 📞 Support & Resources

### API Documentation

- Swagger UI: `http://your-domain.com/swagger`
- Scalar UI: `http://your-domain.com/scaler`
- JSON Spec: `http://your-domain.com/api-docs.json`

### Backend Documentation

- Implementation Guide: `doc/payment/IMPLEMENTATION_GUIDE.md`
- API Design: `doc/payment/API_DESIGN.md`
- Database Schema: `doc/payment/DATABASE_SCHEMA.md`
- Flow Diagram: `doc/payment/REVISED_FLOW.md`

### Contact

- Backend Team: backend@jobsphere.com
- Technical Support: support@jobsphere.com
- Emergency: emergency@jobsphere.com

---

## 🚀 Quick Start Checklist

### For Frontend Developers

- [ ] Set up API base URL in environment variables
- [ ] Implement authentication token management
- [ ] Create wallet service with all endpoints
- [ ] Create offer service with all endpoints
- [ ] Create job service with payment endpoints
- [ ] Implement error handling
- [ ] Add loading states for all API calls
- [ ] Implement real-time notifications
- [ ] Add wallet balance display
- [ ] Create offer flow UI
- [ ] Add transaction history view
- [ ] Implement commission breakdown display
- [ ] Add input validation
- [ ] Test complete payment flow
- [ ] Handle edge cases (insufficient balance, expired offers, etc.)

### For Mobile Developers

- [ ] Set up API base URL in configuration
- [ ] Implement secure token storage (Keychain/Keystore)
- [ ] Create wallet service
- [ ] Create offer service
- [ ] Create job service
- [ ] Implement FCM push notifications
- [ ] Register device token with backend
- [ ] Handle notification payloads
- [ ] Add offline support
- [ ] Implement wallet UI
- [ ] Create offer flow screens
- [ ] Add transaction history
- [ ] Test on both iOS and Android
- [ ] Handle background notifications
- [ ] Test complete payment flow

---

## 📝 Changelog

### Version 1.0.0 (2025-11-13)

- ✅ Initial release
- ✅ Wallet management endpoints
- ✅ Offer system (send, accept, reject)
- ✅ Job completion and payment release
- ✅ Withdrawal functionality
- ✅ Automatic offer expiration
- ✅ Transaction history
- ✅ Real-time notifications

---

**Last Updated**: 2025-11-13  
**API Version**: 1.0.0  
**Status**: Production Ready

---

_For questions or clarifications, please contact the backend team or refer to the comprehensive documentation in the `doc/payment/` directory._
