# Notification System Integration

## Overview

The notification module has been refactored and integrated with the job-request module to automatically send push notifications to users when important events occur.

## Changes Made

### 1. Notification Module Cleanup

- **Removed**: `src/api/notification/services/example.service.ts` (unnecessary template file)
- **Kept**: All functional notification services:
  - `register-token.service.ts` - Register FCM device tokens
  - `unregister-token.service.ts` - Unregister FCM tokens
  - `get-notifications.service.ts` - Fetch user notifications
  - `mark-as-read.service.ts` - Mark notifications as read
  - `delete-notification.service.ts` - Delete notifications
  - `send-notification.service.ts` - Admin-only manual notification sending

### 2. Job Application Notifications

#### When Contractor Applies to a Job

**File**: `src/api/job-request/services/apply-for-job.service.ts`

When a contractor applies to a job, the job owner (customer) receives a notification:

```typescript
await NotificationService.sendToUser({
  userId: job.customerId.toString(),
  title: "New Job Application",
  body: `${contractor.full_name} has applied to your job "${job.title}"`,
  type: "job_application",
  data: {
    jobId: jobId,
    applicationId: String(application._id),
    contractorId: contractorId,
    contractorName: contractor.full_name,
  },
});
```

**Notification Details:**

- **Recipient**: Job owner (customer)
- **Type**: `job_application`
- **Title**: "New Job Application"
- **Body**: "{Contractor Name} has applied to your job '{Job Title}'"
- **Data**: Includes jobId, applicationId, contractorId, and contractorName for deep linking

#### When Application is Accepted

**File**: `src/api/job-request/services/accept-application.service.ts`

When a customer accepts a contractor's application, the contractor receives a notification:

```typescript
await NotificationService.sendToUser({
  userId: application.contractor.toString(),
  title: "Application Accepted! 🎉",
  body: `Congratulations! Your application for "${job.title}" has been accepted`,
  type: "booking_confirmed",
  data: {
    jobId: job._id.toString(),
    applicationId: applicationId,
    jobTitle: job.title,
  },
});
```

**Notification Details:**

- **Recipient**: Contractor
- **Type**: `booking_confirmed`
- **Title**: "Application Accepted! 🎉"
- **Body**: "Congratulations! Your application for '{Job Title}' has been accepted"
- **Data**: Includes jobId, applicationId, and jobTitle

#### When Application is Rejected

**File**: `src/api/job-request/services/reject-application.service.ts`

When a customer rejects a contractor's application, the contractor receives a notification:

```typescript
await NotificationService.sendToUser({
  userId: application.contractor.toString(),
  title: "Application Update",
  body: `Your application for "${job.title}" was not selected this time`,
  type: "booking_declined",
  data: {
    jobId: job._id.toString(),
    applicationId: applicationId,
    jobTitle: job.title,
  },
});
```

**Notification Details:**

- **Recipient**: Contractor
- **Type**: `booking_declined`
- **Title**: "Application Update"
- **Body**: "Your application for '{Job Title}' was not selected this time"
- **Data**: Includes jobId, applicationId, and jobTitle

## Notification Flow

### 1. Application Submission Flow

```
Contractor applies → Application created → Notification sent to Customer
                                        ↓
                                   Customer's device(s) receive push notification
                                        ↓
                                   Notification saved in database
```

### 2. Application Acceptance Flow

```
Customer accepts → Application status updated → Job assigned to contractor
                                             ↓
                                   Notification sent to Contractor
                                             ↓
                                   Other pending applications rejected
```

### 3. Application Rejection Flow

```
Customer rejects → Application status updated → Notification sent to Contractor
```

## Database Models

### Notification Model

Located at: `src/db/models/notification.model.ts`

```typescript
{
  userId: ObjectId,           // Reference to User
  title: string,              // Notification title
  body: string,               // Notification body
  type: enum,                 // Notification type
  data: Object,               // Additional payload
  isRead: boolean,            // Read status
  isSent: boolean,            // Sent status
  sentAt: Date,               // When sent
  readAt: Date,               // When read
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

### FCM Token Model

Located at: `src/db/models/fcm-token.model.ts`

```typescript
{
  userId: ObjectId,           // Reference to User
  token: string,              // FCM device token (unique)
  deviceId: string,           // Unique device identifier
  deviceType: enum,           // 'android' or 'ios'
  isActive: boolean,          // Token validity status
  lastUsed: Date,             // Last notification sent
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

## Notification Types

The system supports 10 notification types:

1. `job_posted` - New job available (sent to all contractors)
2. `job_application` - Job application received (sent to customer) ✅ **Implemented**
3. `booking_confirmed` - Booking accepted (sent to contractor) ✅ **Implemented**
4. `booking_declined` - Booking rejected (sent to contractor) ✅ **Implemented**
5. `message_received` - New chat message
6. `payment_received` - Payment received
7. `payment_released` - Payment released
8. `job_completed` - Job marked complete
9. `review_submitted` - Review posted
10. `general` - Generic notification

## API Endpoints

### Notification Endpoints

#### Register FCM Token

```
POST /api/notification/register-token
Authorization: Bearer {token}
Body: {
  "token": "fcm_device_token",
  "deviceId": "unique_device_id",
  "deviceType": "android" | "ios"
}
```

#### Get User Notifications

```
GET /api/notification
Authorization: Bearer {token}
Returns: Last 100 notifications, sorted newest first
```

#### Mark Notifications as Read

```
POST /api/notification/mark-read
Authorization: Bearer {token}
Body: {
  "notificationIds": ["id1", "id2", ...]
}
```

#### Delete Notification

```
DELETE /api/notification/:id
Authorization: Bearer {token}
```

#### Send Notification (Admin Only)

```
POST /api/notification/send
Authorization: Bearer {admin_token}
Body: {
  "userId": "user_id",
  "title": "Notification Title",
  "body": "Notification Body",
  "type": "general",
  "data": { ... }
}
```

## Testing the Integration

### 1. Test Application Submission

```bash
# Contractor applies to a job
POST /api/job-request/apply/:jobId
Authorization: Bearer {contractor_token}
Body: {
  "message": "I'm interested in this job"
}

# Expected: Customer receives notification
GET /api/notification
Authorization: Bearer {customer_token}
# Should see "New Job Application" notification
```

### 2. Test Application Acceptance

```bash
# Customer accepts application
PATCH /api/job-request/:applicationId/accept
Authorization: Bearer {customer_token}

# Expected: Contractor receives notification
GET /api/notification
Authorization: Bearer {contractor_token}
# Should see "Application Accepted! 🎉" notification
```

### 3. Test Application Rejection

```bash
# Customer rejects application
PATCH /api/job-request/:applicationId/reject
Authorization: Bearer {customer_token}

# Expected: Contractor receives notification
GET /api/notification
Authorization: Bearer {contractor_token}
# Should see "Application Update" notification
```

## Mobile App Integration

### Flutter Setup

1. Add Firebase to your Flutter project
2. Configure FCM in `android/app/build.gradle` and `ios/Runner/Info.plist`
3. Install packages:

```yaml
dependencies:
  firebase_core: ^latest
  firebase_messaging: ^latest
```

4. Register FCM token on app startup:

```dart
final fcmToken = await FirebaseMessaging.instance.getToken();
await api.post('/api/notification/register-token', {
  'token': fcmToken,
  'deviceId': deviceId,
  'deviceType': Platform.isAndroid ? 'android' : 'ios',
});
```

5. Handle notifications:

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  // Handle foreground notification
  print('Notification: ${message.notification?.title}');
  print('Data: ${message.data}');
});

FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  // Handle notification tap (app in background)
  navigateToScreen(message.data);
});
```

## Error Handling

All notification sending is wrapped in try-catch blocks and won't break the main flow if it fails:

- If notification sending fails, the application process continues
- Failed FCM tokens are automatically deactivated
- Errors are logged to console for debugging
- Users without active FCM tokens receive database notifications only

## Future Enhancements

1. **Batch Notifications**: Send notifications to multiple users efficiently
2. **Notification Preferences**: Allow users to customize notification types
3. **Scheduled Notifications**: Send reminders for pending actions
4. **Rich Notifications**: Add images and action buttons
5. **Web Push**: Support browser notifications for web clients
6. **Email Fallback**: Send email if push notification fails

## Troubleshooting

### Notifications Not Received

1. **Check FCM Token Registration**:

   - Verify token is registered: `GET /api/notification` (check if user has active tokens)
   - Re-register token if needed

2. **Check Firebase Configuration**:

   - Ensure `firebase-service-account.json` exists in project root
   - Verify Firebase is initialized in `src/app.ts`

3. **Check User Permissions**:

   - Ensure user has granted notification permissions on device
   - Check if token is marked as `isActive: true`

4. **Check Logs**:
   - Server logs show notification sending status
   - Look for "✅ Notification sent" or error messages

### Database Issues

1. **Missing Notifications**:

   - Check if notification was created: `db.notification.find({ userId })`
   - Verify `isSent` status

2. **Duplicate Tokens**:
   - FCM tokens are unique, duplicates are automatically updated
   - Old tokens are deactivated when new ones are registered

## Summary

The notification system is now fully integrated with the job application flow. Customers receive notifications when contractors apply to their jobs, and contractors receive notifications when their applications are accepted or rejected. The system uses Firebase Cloud Messaging for reliable push notification delivery and stores all notifications in the database for history and offline access.
