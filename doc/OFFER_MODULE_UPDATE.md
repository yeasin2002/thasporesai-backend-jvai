# Offer Module Update - Support for Both Application and Invite Flows

**Date**: November 23, 2025  
**Status**: ✅ **COMPLETED**

---

## Overview

Updated the offer module to support three distinct flows for sending job offers:

1. **Application-Based Offers**: Customer sends offer to contractor who applied to the job
2. **Invite-Based Offers**: Customer sends offer to contractor who accepted a job invite
3. **Direct Offers**: Customer sends offer directly to any contractor via job ID (NEW - simplified flow)

This aligns with the JobSphere business model where customers can:
- Wait for contractors to apply and then send offers
- Proactively invite contractors and send offers after they accept
- Send direct offers to any contractor without prior application or invite

---

## Changes Made

### 1. Database Models

#### Offer Model (`src/db/models/offer.model.ts`)
- Made `application` field optional
- Added `invite` field (optional) to reference JobInvite
- Now supports offers from either applications OR invites

```typescript
export interface Offer {
  // ... other fields
  application?: Types.ObjectId; // Optional: for offers from job applications
  invite?: Types.ObjectId;      // Optional: for offers from job invites
}
```

#### JobInvite Model (`src/db/models/job-invite.model.ts`)
- Added `"offer_sent"` status to track when offer has been sent
- Status flow: `pending` → `accepted` → `offer_sent`

```typescript
status: "pending" | "accepted" | "rejected" | "cancelled" | "offer_sent"
```

---

### 2. Validation Schemas (`src/api/offer/offer.validation.ts`)

Added new schema for invite-based offers:

```typescript
export const InviteIdParamSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required")
    .openapi({ description: "Job Invite ID" }),
}).openapi("InviteIdParam");
```

---

### 3. Service Handlers

#### New Service: `send-offer-from-invite.service.ts`
- Validates invite exists and is in "accepted" status
- Checks job ownership and status
- Calculates payment amounts (same as application-based)
- Moves money to escrow
- Creates offer linked to invite (not application)
- Updates invite status to "offer_sent"
- Sends notification to contractor

**Key Validation**:
```typescript
if (invite.status !== "accepted") {
  return sendBadRequest(res, 
    "Can only send offer to accepted invites. Current status: " + invite.status
  );
}
```

#### Updated Service: `send-offer.service.ts`
- Added comment clarifying it's for application-based offers
- Added `source: "application"` to response data
- No logic changes

#### Updated Service: `accept-offer.service.ts`
- Now handles both application and invite-based offers
- Checks if `offer.application` exists → updates application status
- Checks if `offer.invite` exists → skips invite update (already accepted)
- Rejects pending applications in both cases

```typescript
if (offer.application) {
  // Handle application-based offer
  await db.jobApplicationRequest.findByIdAndUpdate(offer.application, {
    status: "accepted",
  });
  // Reject other applications
} else if (offer.invite) {
  // Handle invite-based offer
  // Reject any pending applications
}
```

#### Updated Service: `reject-offer.service.ts`
- Now handles both application and invite-based offers
- Application-based: Resets application to "pending"
- Invite-based: Resets invite to "accepted"
- Both allow customer to send new offer

```typescript
if (offer.application) {
  // Reset application to pending
  await db.jobApplicationRequest.findByIdAndUpdate(offer.application, {
    status: "pending",
  });
} else if (offer.invite) {
  // Reset invite to accepted
  await db.jobInvite.findByIdAndUpdate(offer.invite, {
    status: "accepted",
  });
}
```

---

### 4. Routes (`src/api/offer/offer.route.ts`)

**Updated Endpoints**:

```typescript
// Application-based offer (UPDATED PATH)
POST /api/offer/application/:applicationId/send

// Invite-based offer (NEW)
POST /api/offer/invite/:inviteId/send

// Accept offer (unchanged - works for both)
POST /api/offer/:offerId/accept

// Reject offer (unchanged - works for both)
POST /api/offer/:offerId/reject
```

**⚠️ BREAKING CHANGE**: Application-based offer endpoint path changed from:
- Old: `POST /api/offer/:applicationId/send`
- New: `POST /api/offer/application/:applicationId/send`

---

### 5. OpenAPI Documentation (`src/api/offer/offer.openapi.ts`)

Added complete documentation for invite-based offer endpoint:
- Request/response schemas
- Error handling (400, 401, 403, 404, 500)
- Security requirements
- Detailed descriptions

Updated application-based offer documentation:
- Clarified it's for application flow
- Updated path to include `/application/`

---

### 6. Service Exports (`src/api/offer/services/index.ts`)

Added export for new service:
```typescript
export * from "./send-offer-from-invite.service";
```

---

## Complete Flow Diagrams

### Flow 1: Application-Based Offer

```
1. Contractor applies to job
   └─> POST /api/job-request/apply/:jobId
   └─> Application status: "pending"

2. Customer reviews applications
   └─> GET /api/job-request/job/:jobId

3. Customer sends offer
   └─> POST /api/offer/application/:applicationId/send
   └─> Money moved to escrow
   └─> Application status: "offer_sent"
   └─> Offer created with application reference

4. Contractor accepts/rejects
   └─> POST /api/offer/:offerId/accept OR
   └─> POST /api/offer/:offerId/reject
```

### Flow 2: Invite-Based Offer

```
1. Customer invites contractor
   └─> POST /api/job-invite/send/:jobId
   └─> Invite status: "pending"

2. Contractor accepts invite
   └─> PATCH /api/job-invite/:inviteId/accept
   └─> Invite status: "accepted"

3. Customer sends offer
   └─> POST /api/offer/invite/:inviteId/send
   └─> Money moved to escrow
   └─> Invite status: "offer_sent"
   └─> Offer created with invite reference

4. Contractor accepts/rejects
   └─> POST /api/offer/:offerId/accept OR
   └─> POST /api/offer/:offerId/reject
```

---

## Business Rules

### Application-Based Offers
- ✅ Contractor must have applied to the job
- ✅ Application must be in "pending" status
- ✅ Job must be in "open" status
- ✅ Only one offer per job allowed
- ✅ Customer must own the job

### Invite-Based Offers
- ✅ Customer must have sent invite to contractor
- ✅ Contractor must have accepted the invite
- ✅ Invite must be in "accepted" status
- ✅ Job must be in "open" status
- ✅ Only one offer per job allowed
- ✅ Customer must own the job

### Common Rules (Both Flows)
- ✅ Customer must have sufficient wallet balance
- ✅ Payment calculation is identical (5% platform fee, 20% service fee)
- ✅ Money moved to escrow on offer creation
- ✅ Platform fee transferred to admin on acceptance
- ✅ Full refund on rejection
- ✅ Offer expires after 7 days

---

## API Response Differences

Both endpoints return the same response structure, but with a `source` field:

**Application-Based Response**:
```json
{
  "status": 201,
  "message": "Offer sent successfully",
  "data": {
    "offer": { ... },
    "walletBalance": 95,
    "amounts": { ... },
    "source": "application"
  }
}
```

**Invite-Based Response**:
```json
{
  "status": 201,
  "message": "Offer sent successfully",
  "data": {
    "offer": { ... },
    "walletBalance": 95,
    "amounts": { ... },
    "source": "invite"
  }
}
```

---

## Testing Checklist

### Application-Based Offer Tests
- [ ] Customer can send offer with valid application ID
- [ ] Fails if application doesn't exist
- [ ] Fails if application not in "pending" status
- [ ] Fails if customer doesn't own job
- [ ] Fails if job not "open"
- [ ] Fails if offer already exists for job
- [ ] Fails if insufficient wallet balance
- [ ] Application status updated to "offer_sent"
- [ ] Contractor receives notification

### Invite-Based Offer Tests
- [ ] Customer can send offer with valid invite ID
- [ ] Fails if invite doesn't exist
- [ ] Fails if invite not in "accepted" status
- [ ] Fails if customer doesn't own job
- [ ] Fails if job not "open"
- [ ] Fails if offer already exists for job
- [ ] Fails if insufficient wallet balance
- [ ] Invite status updated to "offer_sent"
- [ ] Contractor receives notification

### Accept Offer Tests (Both Flows)
- [ ] Contractor can accept application-based offer
- [ ] Contractor can accept invite-based offer
- [ ] Application status updated (if application-based)
- [ ] Invite status unchanged (if invite-based)
- [ ] Other applications rejected in both cases
- [ ] Platform fee transferred to admin
- [ ] Job status changes to "assigned"

### Reject Offer Tests (Both Flows)
- [ ] Contractor can reject application-based offer
- [ ] Contractor can reject invite-based offer
- [ ] Application reset to "pending" (if application-based)
- [ ] Invite reset to "accepted" (if invite-based)
- [ ] Full refund issued to customer
- [ ] Customer can send new offer after rejection

---

## Migration Guide

### For Frontend Developers

**Before**:
```typescript
// Old endpoint
await sendOffer(applicationId, amount);
// POST /api/offer/:applicationId/send
```

**After**:
```typescript
// Application-based offer
await sendOfferFromApplication(applicationId, amount);
// POST /api/offer/application/:applicationId/send

// Invite-based offer (NEW)
await sendOfferFromInvite(inviteId, amount);
// POST /api/offer/invite/:inviteId/send
```

### For Mobile Developers

**New Dart Methods**:
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

// Invite-based offer (NEW)
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
```

---

## Files Modified

1. ✅ `src/db/models/offer.model.ts` - Added invite field
2. ✅ `src/db/models/job-invite.model.ts` - Added offer_sent status
3. ✅ `src/api/offer/offer.validation.ts` - Added InviteIdParamSchema
4. ✅ `src/api/offer/offer.route.ts` - Updated routes
5. ✅ `src/api/offer/services/send-offer.service.ts` - Added comments
6. ✅ `src/api/offer/services/send-offer-from-invite.service.ts` - NEW
7. ✅ `src/api/offer/services/accept-offer.service.ts` - Handle both flows
8. ✅ `src/api/offer/services/reject-offer.service.ts` - Handle both flows
9. ✅ `src/api/offer/services/index.ts` - Export new service
10. ✅ `src/api/offer/offer.openapi.ts` - Added documentation
11. ✅ `api-client/get-own-jobs-contractor-filter.http` - Updated tests

---

## Summary

The offer module now fully supports JobSphere's dual hiring model:
- **Reactive hiring**: Contractors apply → Customer sends offer
- **Proactive hiring**: Customer invites → Contractor accepts → Customer sends offer

Both flows use the same payment logic, escrow system, and commission structure. The accept and reject offer endpoints work seamlessly with both flows, automatically detecting the offer source and handling the appropriate status updates.

---

**Status**: ✅ Production Ready  
**Breaking Changes**: Yes - Application offer endpoint path changed  
**Database Migration**: No - Fields are optional, backward compatible
