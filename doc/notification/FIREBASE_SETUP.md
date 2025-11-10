# Firebase Push Notification Setup Guide

## Overview

JobSphere uses **Firebase Cloud Messaging (FCM)** for sending push notifications to mobile devices (Flutter app). This guide covers the complete setup process for the backend.

## Prerequisites

- Firebase project created at [Firebase Console](https://console.firebase.google.com/)
- Node.js backend with Express.js
- `firebase-admin` package installed (already in dependencies)

## Backend Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard
4. Enable Google Analytics (optional)

### 2. Add Mobile Apps to Firebase

1. In Firebase Console, go to Project Settings
2. Add Android app:
   - Click "Add app" → Android icon
   - Enter package name (e.g., `com.jobsphere.app`)
   - Download `google-services.json` (for Flutter app)
3. Add iOS app (if needed):
   - Click "Add app" → iOS icon
   - Enter bundle ID
   - Download `GoogleService-Info.plist` (for Flutter app)

### 3. Enable Cloud Messaging

1. In Firebase Console, go to **Build** → **Cloud Messaging**
2. Cloud Messaging is enabled by default for new projects
3. Note: No additional configuration needed on Firebase side

### 4. Generate Service Account Key

1. Go to **Project Settings** → **Service Accounts**
2. Click **"Generate New Private Key"**
3. Confirm by clicking **"Generate Key"**
4. A JSON file will be downloaded (e.g., `jobsphere-firebase-adminsdk-xxxxx.json`)

### 5. Add Service Account to Backend

1. Rename the downloaded file to `firebase-service-account.json`
2. Place it in the **project root directory** (same level as `package.json`)
3. **IMPORTANT**: Add to `.gitignore` to prevent committing credentials:

```gitignore
# Firebase credentials
firebase-service-account.json
```

### 6. Verify Backend Configuration

The backend is already configured. Verify these files exist:

#### `src/lib/firebase.ts`

```typescript
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountPath = path.join(
    process.cwd(),
    "firebase-service-account.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Firebase service account file not found. Please add 'firebase-service-account.json' to project root."
    );
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin SDK initialized successfully");
  return firebaseApp;
};

export const getMessaging = (): admin.messaging.Messaging => {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
};
```

#### `src/app.ts`

Firebase is initialized on server startup:

```typescript
import { initializeFirebase } from "@/lib";

// Initialize Firebase Admin SDK for push notifications
try {
  initializeFirebase();
} catch (error) {
  console.warn("⚠️ Firebase initialization failed. Push notifications will not work.");
}
```

## Environment Variables

**No environment variables needed!** The `firebase-service-account.json` file contains all necessary credentials.

### Optional: `.env` Configuration

If you want to make the service account path configurable:

```env
# Optional: Custom path to Firebase service account
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Then update `src/lib/firebase.ts`:

```typescript
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(process.cwd(), "firebase-service-account.json");
```

## API Endpoints

### 1. Register FCM Token

**Endpoint**: `POST /api/notification/register-token`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "token": "fcm_device_token_here",
  "deviceId": "unique_device_id",
  "deviceType": "android" // or "ios"
}
```

**Response**:
```json
{
  "status": 200,
  "message": "FCM token registered successfully",
  "data": {
    "token": "fcm_device_token_here",
    "deviceId": "unique_device_id",
    "deviceType": "android"
  }
}
```

### 2. Unregister FCM Token

**Endpoint**: `DELETE /api/notification/unregister-token`

**Authentication**: Required

**Request Body**:
```json
{
  "token": "fcm_device_token_here"
}
```

### 3. Get User Notifications

**Endpoint**: `GET /api/notification`

**Authentication**: Required

**Response**:
```json
{
  "status": 200,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "_id": "notification_id",
      "userId": "user_id",
      "title": "New Job Available",
      "body": "A new job has been posted",
      "type": "job_posted",
      "data": { "jobId": "job_123" },
      "isRead": false,
      "isSent": true,
      "sentAt": "2025-11-10T10:30:00Z",
      "createdAt": "2025-11-10T10:30:00Z"
    }
  ]
}
```

### 4. Mark Notifications as Read

**Endpoint**: `POST /api/notification/mark-read`

**Authentication**: Required

**Request Body**:
```json
{
  "notificationIds": ["notification_id_1", "notification_id_2"]
}
```

### 5. Delete Notification

**Endpoint**: `DELETE /api/notification/:id`

**Authentication**: Required

### 6. Send Notification (Admin Only)

**Endpoint**: `POST /api/notification/send`

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "userId": "target_user_id",
  "title": "Important Update",
  "body": "Your job application has been reviewed",
  "type": "general",
  "data": {
    "jobId": "job_123",
    "customField": "value"
  }
}
```

## Using Notification Service

### Send to Single User

```typescript
import { NotificationService } from "@/common/service/notification.service";

await NotificationService.sendToUser({
  userId: "user_id",
  title: "New Job Available",
  body: "A new job has been posted",
  type: "job_posted",
  data: { jobId: "job_123" }
});
```

### Send to Multiple Users

```typescript
await NotificationService.sendToMultipleUsers({
  userIds: ["user1", "user2", "user3"],
  title: "System Update",
  body: "New features available",
  type: "general"
});
```

### Broadcast to Role

```typescript
// Send to all contractors
await NotificationService.sendToRole(
  "contractor",
  "New Job Available",
  "Check out the latest job postings",
  "job_posted"
);
```

### Helper Methods

```typescript
// New job posted (to all contractors)
await NotificationService.notifyNewJob("job_id", "Plumber Needed");

// Job application received (to customer)
await NotificationService.notifyJobApplication(
  "customer_id",
  "John Doe",
  "Plumber Needed"
);

// Booking confirmed (to contractor)
await NotificationService.notifyBookingConfirmed(
  "contractor_id",
  "Plumber Needed"
);

// New message (to recipient)
await NotificationService.notifyNewMessage("recipient_id", "Jane Smith");

// Payment received (to contractor)
await NotificationService.notifyPaymentReceived("contractor_id", 150.00);
```

## Database Models

### Notification Model

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

- `job_posted` - New job available
- `job_application` - Job application received
- `booking_confirmed` - Booking accepted
- `booking_declined` - Booking rejected
- `message_received` - New chat message
- `payment_received` - Payment received
- `payment_released` - Payment released
- `job_completed` - Job marked complete
- `review_submitted` - Review posted
- `general` - Generic notification

## Testing

### Test with cURL

```bash
# Register FCM token
curl -X POST http://localhost:4000/api/notification/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "token": "test_fcm_token",
    "deviceId": "test_device_123",
    "deviceType": "android"
  }'

# Send notification (Admin only)
curl -X POST http://localhost:4000/api/notification/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "userId": "user_id",
    "title": "Test Notification",
    "body": "This is a test",
    "type": "general"
  }'
```

### Test with Postman

Import the API collection from `api-client/test-notification-api.http`

## Troubleshooting

### Firebase initialization failed

**Error**: `Firebase service account file not found`

**Solution**: Ensure `firebase-service-account.json` exists in project root

### No active devices found

**Error**: `No active FCM tokens found for user`

**Solution**: User must register their device token first via `/api/notification/register-token`

### Invalid FCM token

**Error**: Token marked as inactive after failed send

**Solution**: Tokens are automatically deactivated when FCM reports them as invalid. User needs to re-register.

### Permission denied

**Error**: `Requested entity was not found`

**Solution**: Verify Firebase project ID in service account JSON matches your Firebase project

## Security Best Practices

1. **Never commit** `firebase-service-account.json` to version control
2. **Restrict API access** - Only authenticated users can register tokens
3. **Validate tokens** - Automatically deactivate invalid tokens
4. **Rate limiting** - Implement rate limits on notification endpoints
5. **Admin-only sending** - Only admins can send arbitrary notifications

## Production Deployment

### Environment Setup

1. Upload `firebase-service-account.json` to production server
2. Set proper file permissions (read-only for app user)
3. Ensure file path is correct in production environment

### Docker Deployment

Add to `.dockerignore`:
```
firebase-service-account.json
```

Add to `Dockerfile`:
```dockerfile
# Copy Firebase credentials (use secrets in production)
COPY firebase-service-account.json /app/firebase-service-account.json
```

### Kubernetes Deployment

Store as Kubernetes secret:
```bash
kubectl create secret generic firebase-credentials \
  --from-file=firebase-service-account.json
```

Mount in deployment:
```yaml
volumes:
  - name: firebase-credentials
    secret:
      secretName: firebase-credentials
volumeMounts:
  - name: firebase-credentials
    mountPath: /app/firebase-service-account.json
    subPath: firebase-service-account.json
```

## Monitoring

Track these metrics:

- Total notifications sent
- Delivery success rate
- Failed token count
- Average delivery time
- Active device count per user

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [FCM Server Documentation](https://firebase.google.com/docs/cloud-messaging/server)
- [Flutter Firebase Messaging](https://firebase.flutter.dev/docs/messaging/overview/)
