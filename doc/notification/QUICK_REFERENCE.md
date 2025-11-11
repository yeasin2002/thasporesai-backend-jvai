# Quick Reference: Notification Integration

## What Was Done

### ✅ Notification Module Refactored
- Removed unnecessary `example.service.ts` file
- All 6 functional services are working properly:
  1. Register FCM token
  2. Unregister FCM token
  3. Get notifications
  4. Mark as read
  5. Delete notification
  6. Send notification (Admin only)

### ✅ Job Application Notifications Integrated

#### 3 Automatic Notifications Added:

1. **When Contractor Applies** → Customer gets notified
   - File: `apply-for-job.service.ts`
   - Type: `job_application`
   - Message: "{Name} has applied to your job '{Title}'"

2. **When Application Accepted** → Contractor gets notified
   - File: `accept-application.service.ts`
   - Type: `booking_confirmed`
   - Message: "Congratulations! Your application for '{Title}' has been accepted"

3. **When Application Rejected** → Contractor gets notified
   - File: `reject-application.service.ts`
   - Type: `booking_declined`
   - Message: "Your application for '{Title}' was not selected this time"

## How It Works

```
Contractor applies to job
         ↓
Application created in database
         ↓
NotificationService.sendToUser() called
         ↓
Notification saved to database
         ↓
FCM tokens fetched for user
         ↓
Push notification sent via Firebase
         ↓
Customer's device receives notification
```

## Code Example

```typescript
// Send notification to user
await NotificationService.sendToUser({
  userId: "user_id",
  title: "Notification Title",
  body: "Notification message",
  type: "job_application",
  data: {
    jobId: "job_123",
    applicationId: "app_456"
  }
});
```

## Testing

### 1. Register Device Token (Mobile App)
```bash
POST /api/notification/register-token
Authorization: Bearer {token}
{
  "token": "fcm_device_token",
  "deviceId": "device_123",
  "deviceType": "android"
}
```

### 2. Apply for Job (Contractor)
```bash
POST /api/job-request/apply/:jobId
Authorization: Bearer {contractor_token}
{
  "message": "I'm interested"
}
```

### 3. Check Notifications (Customer)
```bash
GET /api/notification
Authorization: Bearer {customer_token}
```

### 4. Accept Application (Customer)
```bash
PATCH /api/job-request/:applicationId/accept
Authorization: Bearer {customer_token}
```

### 5. Check Notifications (Contractor)
```bash
GET /api/notification
Authorization: Bearer {contractor_token}
```

## Files Modified

### Notification Module
- ❌ Deleted: `src/api/notification/services/example.service.ts`

### Job Request Module
- ✏️ Modified: `src/api/job-request/services/apply-for-job.service.ts`
- ✏️ Modified: `src/api/job-request/services/accept-application.service.ts`
- ✏️ Modified: `src/api/job-request/services/reject-application.service.ts`

### Documentation
- ✅ Created: `NOTIFICATION_INTEGRATION.md` (detailed guide)
- ✅ Created: `QUICK_REFERENCE.md` (this file)

## Key Features

✅ Automatic notifications on job application events
✅ Multi-device support (one user can have multiple devices)
✅ Notification history stored in database
✅ Failed token cleanup (invalid tokens auto-deactivated)
✅ Type-safe with TypeScript
✅ Error handling (won't break main flow if notification fails)
✅ Firebase Cloud Messaging integration
✅ OpenAPI documentation included

## Next Steps

1. **Test the integration** with real devices
2. **Configure Firebase** in mobile app
3. **Implement notification handling** in Flutter app
4. **Add more notification types** as needed (payment, messages, etc.)
5. **Consider adding** notification preferences for users

## Support

For detailed information, see `NOTIFICATION_INTEGRATION.md`

For project structure, see `.ruler/structure.md`

For features overview, see `.ruler/features.md`
