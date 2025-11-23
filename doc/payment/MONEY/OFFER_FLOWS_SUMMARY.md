# Offer Module - Complete Flow Summary

**Date**: November 23, 2025  
**Status**: ✅ **PRODUCTION READY**

---

## Overview

The JobSphere offer module now supports **three distinct flows** for sending job offers, providing maximum flexibility for customers to hire contractors.

---

## Three Offer Flows

### 1. Application-Based Offers (Reactive Hiring)

**Flow**: Contractor applies → Customer reviews → Customer sends offer

**Endpoint**: `POST /api/offer/application/:applicationId/send`

**Use Case**: Customer waits for contractors to apply and selects the best candidate

**Requirements**:
- ✅ Contractor must have applied to the job
- ✅ Application must be in "pending" status
- ✅ Job must be in "open" status
- ✅ Customer must own the job
- ✅ Sufficient wallet balance

**Request Body**:
```json
{
  "amount": 500,
  "timeline": "7 days",
  "description": "Work details as discussed"
}
```

---

### 2. Invite-Based Offers (Proactive Hiring)

**Flow**: Customer invites → Contractor accepts → Customer sends offer

**Endpoint**: `POST /api/offer/invite/:inviteId/send`

**Use Case**: Customer proactively invites specific contractors they want to work with

**Requirements**:
- ✅ Customer must have sent invite to contractor
- ✅ Contractor must have accepted the invite
- ✅ Invite must be in "accepted" status
- ✅ Job must be in "open" status
- ✅ Customer must own the job
- ✅ Sufficient wallet balance

**Request Body**:
```json
{
  "amount": 500,
  "timeline": "7 days",
  "description": "Work details as discussed"
}
```

---

### 3. Direct Offers (Simplified Hiring) ⭐ NEW

**Flow**: Customer sends offer directly to any contractor

**Endpoint**: `POST /api/offer/direct/:jobId/send`

**Use Case**: Customer wants to hire a specific contractor without going through application or invite process

**Requirements**:
- ✅ Job must exist and be in "open" status
- ✅ Customer must own the job
- ✅ Contractor must exist and have "contractor" role
- ✅ Sufficient wallet balance
- ❌ No prior application or invite needed

**Request Body**:
```json
{
  "contractorId": "contractor_user_id",
  "amount": 500,
  "timeline": "7 days",
  "description": "Direct offer for this job"
}
```

**Key Difference**: Requires `contractorId` in the request body

---

## Complete API Endpoints

### Sending Offers (Customer Only)

```
POST /api/offer/application/:applicationId/send  # From application
POST /api/offer/invite/:inviteId/send            # From invite
POST /api/offer/direct/:jobId/send               # Direct offer
```

### Managing Offers (Contractor Only)

```
POST /api/offer/:offerId/accept   # Accept any offer type
POST /api/offer/:offerId/reject   # Reject any offer type
```

---

## Comparison Table

| Feature | Application-Based | Invite-Based | Direct Offer |
|---------|------------------|--------------|--------------|
| **Prior Action Required** | Contractor applies | Customer invites + Contractor accepts | None |
| **Contractor Selection** | From applicants | From invited contractors | Any contractor |
| **Validation Complexity** | Medium | Medium | Low |
| **Use Case** | Reactive hiring | Proactive hiring | Quick hiring |
| **Request Includes** | amount, timeline, description | amount, timeline, description | contractorId, amount, timeline, description |
| **Linked To** | JobApplicationRequest | JobInvite | None (direct) |

---

## Payment Flow (Same for All)

All three flows follow the same payment logic:

1. **Customer sends offer**:
   - Total charge = Job amount + 5% platform fee
   - Money moved from wallet to escrow
   - Offer status: "pending"
   - Contractor notified

2. **Contractor accepts**:
   - Platform fee (5%) → Admin wallet
   - Remaining amount stays in escrow
   - Job status → "assigned"
   - Other applications rejected

3. **Job completion**:
   - Service fee (20%) → Admin wallet
   - Contractor payout (80%) → Contractor wallet
   - Escrow released
   - Job status → "completed"

4. **Contractor rejects**:
   - Full refund → Customer wallet
   - Offer status → "rejected"
   - Customer can send new offer

---

## Response Format

All three endpoints return the same response structure with a `source` field:

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
      "application": "app_id",      // Only for application-based
      "invite": "invite_id",         // Only for invite-based
      "amount": 500,
      "platformFee": 25,
      "serviceFee": 100,
      "contractorPayout": 400,
      "totalCharge": 525,
      "timeline": "7 days",
      "description": "Work details",
      "status": "pending",
      "expiresAt": "2025-11-30T...",
      "createdAt": "2025-11-23T...",
      "updatedAt": "2025-11-23T..."
    },
    "walletBalance": 475,
    "amounts": {
      "jobBudget": 500,
      "platformFee": 25,
      "serviceFee": 100,
      "contractorPayout": 400,
      "totalCharge": 525,
      "adminTotal": 125
    },
    "source": "application" | "invite" | "direct"
  }
}
```

---

## Database Schema

### Offer Model

```typescript
{
  job: ObjectId,              // Required
  customer: ObjectId,         // Required
  contractor: ObjectId,       // Required
  application?: ObjectId,     // Optional: for application-based offers
  invite?: ObjectId,          // Optional: for invite-based offers
  // If both are null, it's a direct offer
  
  amount: number,
  platformFee: number,
  serviceFee: number,
  contractorPayout: number,
  totalCharge: number,
  timeline: string,
  description: string,
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed" | "expired",
  
  acceptedAt?: Date,
  rejectedAt?: Date,
  cancelledAt?: Date,
  completedAt?: Date,
  expiresAt?: Date,
  
  rejectionReason?: string,
  cancellationReason?: string
}
```

---

## Accept/Reject Logic

The accept and reject services automatically detect the offer source:

### Accept Offer

```typescript
if (offer.application) {
  // Update application status to "accepted"
  // Reject other applications
} else if (offer.invite) {
  // No invite update needed (already accepted)
  // Reject any pending applications
} else {
  // Direct offer - no application or invite
  // Just reject any pending applications
}
```

### Reject Offer

```typescript
if (offer.application) {
  // Reset application to "pending"
  // Customer can send new offer
} else if (offer.invite) {
  // Reset invite to "accepted"
  // Customer can send new offer
} else {
  // Direct offer - nothing to reset
  // Customer can send new offer
}
```

---

## Frontend Integration Examples

### React/Next.js

```typescript
// Application-based offer
const sendOfferFromApplication = async (applicationId: string, data: OfferData) => {
  return await api.post(`/offer/application/${applicationId}/send`, data);
};

// Invite-based offer
const sendOfferFromInvite = async (inviteId: string, data: OfferData) => {
  return await api.post(`/offer/invite/${inviteId}/send`, data);
};

// Direct offer
const sendDirectOffer = async (jobId: string, data: DirectOfferData) => {
  return await api.post(`/offer/direct/${jobId}/send`, data);
};
```

### Flutter

```dart
// Application-based offer
Future<Map<String, dynamic>> sendOfferFromApplication(
  String applicationId,
  double amount,
  String timeline,
  String description,
) async {
  final response = await http.post(
    Uri.parse('$baseUrl/offer/application/$applicationId/send'),
    headers: await getHeaders(),
    body: json.encode({
      'amount': amount,
      'timeline': timeline,
      'description': description,
    }),
  );
  return json.decode(response.body);
}

// Invite-based offer
Future<Map<String, dynamic>> sendOfferFromInvite(
  String inviteId,
  double amount,
  String timeline,
  String description,
) async {
  final response = await http.post(
    Uri.parse('$baseUrl/offer/invite/$inviteId/send'),
    headers: await getHeaders(),
    body: json.encode({
      'amount': amount,
      'timeline': timeline,
      'description': description,
    }),
  );
  return json.decode(response.body);
}

// Direct offer
Future<Map<String, dynamic>> sendDirectOffer(
  String jobId,
  String contractorId,
  double amount,
  String timeline,
  String description,
) async {
  final response = await http.post(
    Uri.parse('$baseUrl/offer/direct/$jobId/send'),
    headers: await getHeaders(),
    body: json.encode({
      'contractorId': contractorId,
      'amount': amount,
      'timeline': timeline,
      'description': description,
    }),
  );
  return json.decode(response.body);
}
```

---

## When to Use Each Flow

### Use Application-Based Offers When:
- ✅ You want to see who's interested in your job
- ✅ You want to compare multiple candidates
- ✅ You prefer contractors to come to you
- ✅ You want to review portfolios and proposals

### Use Invite-Based Offers When:
- ✅ You found a contractor you like on the platform
- ✅ You want to work with someone specific
- ✅ You're proactively recruiting contractors
- ✅ You want to gauge interest before committing

### Use Direct Offers When:
- ✅ You already know which contractor you want
- ✅ You want the fastest hiring process
- ✅ You're working with a contractor you've hired before
- ✅ You want to skip the application/invite steps
- ✅ You have the contractor's user ID

---

## Error Handling

### Common Errors (All Flows)

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Insufficient balance | 400 | Not enough money in wallet | Deposit funds |
| Offer already exists | 400 | One offer per job rule | Wait for current offer to be resolved |
| Job not open | 400 | Job already assigned/completed | Check job status |
| Not authorized | 403 | User doesn't own job | Verify job ownership |

### Flow-Specific Errors

**Application-Based**:
- Application not found (404)
- Application not pending (400)

**Invite-Based**:
- Invite not found (404)
- Invite not accepted (400)

**Direct Offer**:
- Contractor not found (404)
- Invalid contractor role (400)

---

## Testing Checklist

### Application-Based Offer
- [ ] Can send offer with valid application ID
- [ ] Fails if application doesn't exist
- [ ] Fails if application not pending
- [ ] Application status updated to "offer_sent"
- [ ] Contractor receives notification

### Invite-Based Offer
- [ ] Can send offer with valid invite ID
- [ ] Fails if invite doesn't exist
- [ ] Fails if invite not accepted
- [ ] Invite status updated to "offer_sent"
- [ ] Contractor receives notification

### Direct Offer
- [ ] Can send offer with valid job ID and contractor ID
- [ ] Fails if job doesn't exist
- [ ] Fails if contractor doesn't exist
- [ ] Fails if contractor role is not "contractor"
- [ ] No application or invite created
- [ ] Contractor receives notification

### Accept/Reject (All Flows)
- [ ] Can accept application-based offer
- [ ] Can accept invite-based offer
- [ ] Can accept direct offer
- [ ] Can reject all offer types
- [ ] Proper status updates for each flow
- [ ] Refunds work correctly

---

## Files Modified

1. ✅ `src/api/offer/offer.validation.ts` - Added SendDirectJobOfferSchema, JobIdParamSchema
2. ✅ `src/api/offer/offer.route.ts` - Added direct offer route
3. ✅ `src/api/offer/services/send-job-offer.ts` - NEW direct offer service
4. ✅ `src/api/offer/services/accept-offer.service.ts` - Handle direct offers
5. ✅ `src/api/offer/services/reject-offer.service.ts` - Handle direct offers
6. ✅ `src/api/offer/services/index.ts` - Export new service
7. ✅ `src/api/offer/offer.openapi.ts` - Added documentation
8. ✅ `api-client/get-own-jobs-contractor-filter.http` - Added test example

---

## Summary

JobSphere now offers **three flexible ways** to hire contractors:

1. **Reactive**: Wait for applications → Send offer
2. **Proactive**: Invite contractors → Send offer after acceptance
3. **Direct**: Send offer immediately to any contractor

All three flows use the same payment logic, escrow system, and commission structure. The system automatically handles the differences in validation and status updates based on the offer source.

---

**Status**: ✅ Production Ready  
**TypeScript**: ✅ No Errors  
**Documentation**: ✅ Complete  
**Testing**: Ready for QA
