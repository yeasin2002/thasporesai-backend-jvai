# Notification Types Update - Changelog

## Date: November 17, 2025

## Summary

Updated the notification system to support 5 new notification types for the payment and bidding workflow. The system now supports 15 total notification types.

## New Notification Types Added

1. **`job_invite`** - Customer invites contractor to apply for a job
2. **`job_request`** - Contractor requests to work on a customer's job
3. **`sent_offer`** - Customer sends an offer to a contractor
4. **`accept_offer`** - Contractor accepts a customer's offer
5. **`payment_complete`** - Payment is captured and held by admin (order started)

## Files Modified

### 1. `src/api/notification/notification.validation.ts`
- Added 5 new notification types to `notificationTypes` array
- Updated Zod schemas to include new types
- All TypeScript types automatically updated

### 2. `src/db/models/notification.model.ts`
- Added 5 new types to TypeScript interface
- Added 5 new types to Mongoose schema enum
- Database will accept new notification types

### 3. `src/common/service/notification.service.ts`
- Updated `NotificationPayload` interface with new types
- Updated `BulkNotificationPayload` interface with new types
- Updated `sendToRole` method type parameter with new types

### 4. `src/common/service/notification-helpers.ts` (NEW FILE)
- Created new helper class `NotificationHelpers`
- Added 5 new helper methods:
  - `notifyJobInvite()` - For job invitations
  - `notifyJobRequest()` - For job requests
  - `notifySentOffer()` - For offer notifications
  - `notifyAcceptOffer()` - For offer acceptance
  - `notifyPaymentComplete()` - For payment completion (notifies both parties)

### 5. `src/common/service/index.ts`
- Added export for `notification.service`
- Added export for `notification-helpers`

### 6. `doc/notification/NOTIFICATION_TYPES.md` (NEW FILE)
- Comprehensive documentation for all 15 notification types
- Usage examples for each type
- Guide for adding new notification types in the future
- Best practices and testing instructions

### 7. `doc/notification/CHANGELOG_NOTIFICATION_TYPES.md` (NEW FILE)
- This file - documents all changes made

## Usage Examples

### Import the new helpers:

```typescript
import { NotificationHelpers } from "@/common/service";
```

### Send job invitation notification:

```typescript
await NotificationHelpers.notifyJobInvite(
  contractorId,
  customerName,
  jobTitle,
  jobId
);
```

### Send offer notification:

```typescript
await NotificationHelpers.notifySentOffer(
  contractorId,
  customerName,
  jobTitle,
  offerAmount,
  offerId
);
```

### Send payment complete notification:

```typescript
await NotificationHelpers.notifyPaymentComplete(
  contractorId,
  customerId,
  jobTitle,
  amount,
  jobId
);
```

## Backward Compatibility

✅ All existing notification types remain unchanged  
✅ Existing code will continue to work without modifications  
✅ New types are additive only - no breaking changes

## Testing

All files passed TypeScript type checking with no errors:
- ✅ `src/api/notification/notification.validation.ts`
- ✅ `src/db/models/notification.model.ts`
- ✅ `src/common/service/notification.service.ts`
- ✅ `src/common/service/notification-helpers.ts`

## Next Steps

1. **Implement in your modules**: Use the new notification helpers in your job-invite, offer, and payment modules
2. **Test on mobile**: Verify notifications appear correctly in the Flutter app
3. **Add more types**: Follow the guide in `NOTIFICATION_TYPES.md` to add more types as needed

## Complete Notification Type List

1. `job_posted` - New job available
2. `job_application` - Contractor applied to job
3. `job_invite` ⭐ NEW - Customer invites contractor
4. `job_request` ⭐ NEW - Contractor requests job
5. `sent_offer` ⭐ NEW - Customer sends offer
6. `accept_offer` ⭐ NEW - Contractor accepts offer
7. `booking_confirmed` - Booking accepted
8. `booking_declined` - Booking declined
9. `message_received` - New chat message
10. `payment_complete` ⭐ NEW - Payment held by admin
11. `payment_received` - Payment received in wallet
12. `payment_released` - Payment released to contractor
13. `job_completed` - Job marked complete
14. `review_submitted` - Review posted
15. `general` - Generic notifications

## Architecture Benefits

✅ **Modular**: New helpers in separate file for easy maintenance  
✅ **Type-safe**: Full TypeScript support with proper types  
✅ **Extensible**: Easy to add more notification types  
✅ **Consistent**: All notifications follow the same pattern  
✅ **Well-documented**: Comprehensive documentation provided  
✅ **No breaking changes**: Existing code unaffected
