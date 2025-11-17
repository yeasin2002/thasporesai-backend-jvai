# Notification System - Quick Reference

## Import

```typescript
import { NotificationService, NotificationHelpers } from "@/common/service";
```

## New Notification Types (5 Added)

| Type | When to Use | Helper Method |
|------|-------------|---------------|
| `job_invite` | Customer invites contractor | `NotificationHelpers.notifyJobInvite()` |
| `job_request` | Contractor requests job | `NotificationHelpers.notifyJobRequest()` |
| `sent_offer` | Customer sends offer | `NotificationHelpers.notifySentOffer()` |
| `accept_offer` | Contractor accepts offer | `NotificationHelpers.notifyAcceptOffer()` |
| `payment_complete` | Payment held by admin | `NotificationHelpers.notifyPaymentComplete()` |

## Quick Usage

### Job Invitation
```typescript
await NotificationHelpers.notifyJobInvite(
  contractorId,      // string
  customerName,      // string
  jobTitle,          // string
  jobId              // string
);
```

### Job Request
```typescript
await NotificationHelpers.notifyJobRequest(
  customerId,        // string
  contractorName,    // string
  jobTitle,          // string
  jobId              // string
);
```

### Send Offer
```typescript
await NotificationHelpers.notifySentOffer(
  contractorId,      // string
  customerName,      // string
  jobTitle,          // string
  offerAmount,       // number
  offerId            // string
);
```

### Accept Offer
```typescript
await NotificationHelpers.notifyAcceptOffer(
  customerId,        // string
  contractorName,    // string
  jobTitle,          // string
  offerId            // string
);
```

### Payment Complete
```typescript
await NotificationHelpers.notifyPaymentComplete(
  contractorId,      // string
  customerId,        // string
  jobTitle,          // string
  amount,            // number
  jobId              // string
);
// Note: This sends notifications to BOTH contractor and customer
```

## Existing Notification Methods (Still Available)

```typescript
// New job posted (to all contractors)
await NotificationService.notifyNewJob(jobId, jobTitle);

// Job application received
await NotificationService.notifyJobApplication(customerId, contractorName, jobTitle);

// Booking confirmed
await NotificationService.notifyBookingConfirmed(contractorId, jobTitle);

// New message
await NotificationService.notifyNewMessage(recipientId, senderName);

// Payment received
await NotificationService.notifyPaymentReceived(contractorId, amount);
```

## Generic Notification

```typescript
// Send to specific user
await NotificationService.sendToUser({
  userId: userId,
  title: "Your Title",
  body: "Your message",
  type: "general", // or any other type
  data: { key: "value" } // optional
});

// Broadcast to role
await NotificationService.sendToRole(
  "contractor", // or "customer" or "admin"
  "Title",
  "Message body",
  "general",
  { key: "value" } // optional
);
```

## All 15 Notification Types

1. `job_posted`
2. `job_application`
3. `job_invite` ⭐ NEW
4. `job_request` ⭐ NEW
5. `sent_offer` ⭐ NEW
6. `accept_offer` ⭐ NEW
7. `booking_confirmed`
8. `booking_declined`
9. `message_received`
10. `payment_complete` ⭐ NEW
11. `payment_received`
12. `payment_released`
13. `job_completed`
14. `review_submitted`
15. `general`

## Files Changed

- ✅ `src/api/notification/notification.validation.ts` - Added new types
- ✅ `src/db/models/notification.model.ts` - Updated schema
- ✅ `src/common/service/notification.service.ts` - Updated types
- ✅ `src/common/service/notification-helpers.ts` - NEW helper methods
- ✅ `src/common/service/index.ts` - Added exports

## Documentation

- 📖 Full guide: `doc/notification/NOTIFICATION_TYPES.md`
- 📝 Changelog: `doc/notification/CHANGELOG_NOTIFICATION_TYPES.md`
- ⚡ This file: `doc/notification/QUICK_REFERENCE.md`
