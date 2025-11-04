# Push Notification Setup Guide

This comprehensive guide explains the complete push notification system implementation in JobSphere using Firebase Cloud Messaging (FCM).

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Firebase Setup](#firebase-setup)
4. [Backend Implementation](#backend-implementation)
5. [API Endpoints](#api-endpoints)
6. [Testing the System](#testing-the-system)
7. [Usage Examples](#usage-examples)
8. [Troubleshooting](#troubleshooting)

---

## System Overview

JobSphere's push notification system enables real-time communication between the backend and mobile apps (Flutter). The system:

- Sends push notifications via Firebase Cloud Messaging (FCM)
- Stores notification history in MongoDB
- Manages device tokens for multiple devices per user
- Supports both Android and iOS platforms
- Provides notification types for different events (job posted, payment received, etc.)
- Allows bulk notifications to multiple users or user roles

### Key Features

✅ **Multi-device support** - Users can receive notifications on multiple devices
✅ **Notification persistence** - All notifications stored in database
✅ **Read/unread tracking** - Track which notifications have been read
✅ **Type-based notifications** - Different notification types for different events
✅ **Role-based broadcasting** - Send notifications to all users with specific role
✅ **Automatic token cleanup** - Invalid tokens are automatically deactivated
✅ **Admin control** - Admins can send custom notifications to any user

---

## Architecture

### Components

1. **Firebase Admin SDK** (`src/lib/firebase.ts`)
   - Initializes Firebase connection
   - Provides messaging interface
   - Handles service account authentication

2. **Database Models**
   - `Notification` model - Stores notification records
   - `FcmToken` model - Manages device tokens

3. **Notification Service** (`src/common/service/notification.service.ts`)
   - Core business logic for sending notifications
   - Helper methods for common notification scenarios
   - Handles bulk notifications

4. **API Routes** (`src/api/notification/`)
   - REST endpoints for mobile apps
   - Token registration/unregistration
   - Notification retrieval and management

### Data Flow

```
Mobile App → Register FCM Token → Backend stores token
Backend Event → NotificationService → Firebase FCM → Mobile App
Mobile App → Fetch Notifications → Backend returns history
```

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select existing project
3. Enter project name (e.g., "JobSphere")
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Add Android App (if applicable)

1. In Firebase Console, click **"Add app"** → **Android**
2. Enter Android package name (e.g., `com.jobsphere.app`)
3. Download `google-services.json`
4. Follow Firebase setup instructions for Flutter

### Step 3: Add iOS App (if applicable)

1. In Firebase Console, click **"Add app"** → **iOS**
2. Enter iOS bundle ID (e.g., `com.jobsphere.app`)
3. Download `GoogleService-Info.plist`
4. Follow Firebase setup instructions for Flutter

### Step 4: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Cloud Messaging** tab
3. Cloud Messaging API should be enabled by default
4. Note your **Server Key** (legacy, for reference only)

### Step 5: Generate Service Account Key

1. In Firebase Console, go to **Project Settings**
2. Navigate to **Service Accounts** tab
3. Click **"Generate New Private Key"**
4. Click **"Generate Key"** in the confirmation dialog
5. A JSON file will be downloaded

### Step 6: Configure Backend

1. Rename the downloaded file to `firebase-service-account.json`
2. Place it in your project root directory (same level as `package.json`)

```
your-project/
├── src/
├── package.json
├── firebase-service-account.json  ← Place here
└── .gitignore
```

3. **⚠️ IMPORTANT**: Add to `.gitignore` to prevent committing credentials:

```bash
# Add to .gitignore
firebase-service-account.json
```

### Service Account JSON Structure

Your `firebase-service-account.json` should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

---

## Backend Implementation

### Dependencies

The following packages are already installed:

```json
{
  "firebase-admin": "^13.5.0"
}
```

### File Structure

```
src/
├── lib/
│   └── firebase.ts                          # Firebase initialization
├── db/
│   └── models/
│       ├── notification.model.ts            # Notification schema
│       └── fcm-token.model.ts               # FCM token schema
├── common/
│   └── service/
│       └── notification.service.ts          # Core notification logic
└── api/
    └── notification/
        ├── notification.route.ts            # API routes
        ├── notification.validation.ts       # Zod schemas
        ├── notification.openapi.ts          # OpenAPI docs
        └── services/
            ├── register-token.service.ts    # Register device token
            ├── unregister-token.service.ts  # Unregister token
            ├── get-notifications.service.ts # Fetch notifications
            ├── mark-as-read.service.ts      # Mark as read
            ├── delete-notification.service.ts # Delete notification
            └── send-notification.service.ts # Send notification (admin)
```

### Key Implementation Details

#### 1. Firebase Initialization (`src/lib/firebase.ts`)

- Reads service account JSON from file system
- Initializes Firebase Admin SDK on app startup
- Provides singleton instance for messaging
- Validates service account file exists

#### 2. Database Models

**Notification Model** (`src/db/models/notification.model.ts`):
- Stores notification history
- Tracks read/unread status
- Supports custom data payload
- Indexed for efficient queries

**FCM Token Model** (`src/db/models/fcm-token.model.ts`):
- Stores device tokens per user
- Supports multiple devices per user
- Tracks device type (Android/iOS)
- Auto-deactivates invalid tokens

#### 3. Notification Service (`src/common/service/notification.service.ts`)

Core service with methods:

- `sendToUser()` - Send to single user
- `sendToMultipleUsers()` - Send to multiple users
- `sendToRole()` - Send to all users with specific role
- `notifyNewJob()` - Helper for new job notifications
- `notifyJobApplication()` - Helper for job applications
- `notifyBookingConfirmed()` - Helper for booking confirmations
- `notifyNewMessage()` - Helper for new messages
- `notifyPaymentReceived()` - Helper for payments

**Features:**
- Saves notification to database before sending
- Retrieves all active FCM tokens for user
- Sends via Firebase multicast messaging
- Updates notification status after sending
- Automatically deactivates failed tokens
- Returns success/failure status

#### 4. API Routes (`src/api/notification/`)

Six main endpoints:

1. **POST /api/notification/register-token** - Register device token
2. **DELETE /api/notification/unregister-token** - Remove device token
3. **GET /api/notification** - Get user's notifications
4. **POST /api/notification/mark-read** - Mark notifications as read
5. **DELETE /api/notification/:id** - Delete notification
6. **POST /api/notification/send** - Send notification (admin only)

All routes require authentication. Admin route requires admin role.

---

## API Endpoints

### 1. Register FCM Token

Register a device token to receive push notifications.

**Endpoint:** `POST /api/notification/register-token`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "token": "fcm_device_token_here",
  "deviceId": "unique_device_id",
  "deviceType": "android"
}
```

**Response:**
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

Remove a device token (e.g., on logout).

**Endpoint:** `DELETE /api/notification/unregister-token`

**Authentication:** Required

**Request Body:**
```json
{
  "token": "fcm_device_token_here"
}
```

### 3. Get Notifications

Retrieve all notifications for authenticated user.

**Endpoint:** `GET /api/notification`

**Authentication:** Required

**Response:**
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
      "sentAt": "2025-10-30T10:00:00Z",
      "createdAt": "2025-10-30T10:00:00Z"
    }
  ]
}
```

### 4. Mark as Read

Mark one or more notifications as read.

**Endpoint:** `POST /api/notification/mark-read`

**Authentication:** Required

**Request Body:**
```json
{
  "notificationIds": ["notification_id_1", "notification_id_2"]
}
```

### 5. Delete Notification

Delete a specific notification.

**Endpoint:** `DELETE /api/notification/:id`

**Authentication:** Required

### 6. Send Notification (Admin Only)

Send a custom notification to any user.

**Endpoint:** `POST /api/notification/send`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "userId": "target_user_id",
  "title": "Important Update",
  "body": "Your account has been verified",
  "type": "general",
  "data": { "customKey": "customValue" }
}
```

---

## Testing the System

### Step 1: Start the Backend

```bash
bun dev
```

Verify Firebase initialization in console:
```
✅ Firebase Admin SDK initialized successfully
```

### Step 2: Register a Test Token

Use Postman or any HTTP client:

```bash
POST http://localhost:4000/api/notification/register-token
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "token": "test_fcm_token_123",
  "deviceId": "test_device_001",
  "deviceType": "android"
}
```

### Step 3: Send Test Notification

Use the NotificationService in your code:

```typescript
import { NotificationService } from "@/common/service/notification.service";

// Send to specific user
await NotificationService.sendToUser({
  userId: "user_id_here",
  title: "Test Notification",
  body: "This is a test message",
  type: "general",
  data: { testKey: "testValue" }
});
```

### Step 4: Verify in Database

Check MongoDB collections:

```javascript
// Check notifications
db.notifications.find({ userId: ObjectId("user_id") })

// Check FCM tokens
db.fcmtokens.find({ userId: ObjectId("user_id") })
```

---

## Usage Examples

### Example 1: Notify When New Job is Posted

```typescript
import { NotificationService } from "@/common/service/notification.service";

// In your job creation service
const job = await db.job.create(jobData);

// Notify all contractors
await NotificationService.notifyNewJob(
  job._id.toString(),
  job.title
);
```

### Example 2: Notify Customer of Job Application

```typescript
// In job application service
await NotificationService.notifyJobApplication(
  job.customerId.toString(),
  contractor.name,
  job.title
);
```

### Example 3: Send Custom Notification (Admin)

```typescript
// In admin service
await NotificationService.sendToUser({
  userId: targetUserId,
  title: "Account Verified",
  body: "Your contractor account has been verified",
  type: "general",
  data: { verificationStatus: "approved" }
});
```

### Example 4: Broadcast to All Contractors

```typescript
await NotificationService.sendToRole(
  "contractor",
  "System Maintenance",
  "The app will be under maintenance from 2-4 AM",
  "general"
);
```

---

## Troubleshooting

### Issue: "Firebase service account file not found"

**Solution:** Ensure `firebase-service-account.json` is in project root:
```bash
ls firebase-service-account.json  # Should exist
```

### Issue: "No active FCM tokens found for user"

**Solution:** User hasn't registered their device token. Ensure Flutter app calls register-token endpoint after login.

### Issue: Notifications not received on device

**Checklist:**
1. ✅ Device token registered in backend
2. ✅ Firebase project configured correctly
3. ✅ Flutter app has FCM dependencies
4. ✅ App has notification permissions
5. ✅ Token is active in database (`isActive: true`)

### Issue: "Invalid token" errors

**Solution:** The system automatically deactivates invalid tokens. User needs to re-register their device token.

### Issue: Notifications sent but not stored in database

**Solution:** Check MongoDB connection and ensure Notification model is properly registered in `src/db/index.ts`.

---

## Next Steps

1. ✅ Backend setup complete
2. 📱 Integrate with Flutter app (see [FLUTTER_INTEGRATION.md](./FLUTTER_INTEGRATION.md))
3. 🧪 Test on real devices
4. 🚀 Deploy to production

---

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Flutter Firebase Messaging](https://firebase.flutter.dev/docs/messaging/overview)