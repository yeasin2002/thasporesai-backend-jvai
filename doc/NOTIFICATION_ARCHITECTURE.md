# Push Notification System Architecture

This document explains the complete architecture and implementation details of the push notification system in JobSphere.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Components Breakdown](#components-breakdown)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Design](#api-design)
7. [Implementation Details](#implementation-details)
8. [Security Considerations](#security-considerations)

---

## System Overview

The JobSphere push notification system is built on Firebase Cloud Messaging (FCM) and provides:

- **Real-time notifications** to mobile devices (Android & iOS)
- **Persistent storage** of notification history in MongoDB
- **Multi-device support** for users with multiple devices
- **Type-based notifications** for different events
- **Role-based broadcasting** to specific user groups
- **Admin control** for custom notifications

### Technology Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Push Service**: Firebase Cloud Messaging (FCM)
- **Mobile**: Flutter (Android & iOS)
- **Authentication**: JWT (JSON Web Tokens)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile Apps                              │
│                    (Flutter - Android/iOS)                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ FCM Plugin   │  │ Local Notif  │  │ API Client   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │ FCM Token        │ Display          │ HTTP/REST
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Cloud                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Firebase Cloud Messaging (FCM)               │  │
│  │                                                            │  │
│  │  • Receives messages from backend                         │  │
│  │  • Routes to appropriate devices                          │  │
│  │  • Handles delivery & retries                             │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            │ Push Notification
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Server                              │
│                  (Node.js + Express + TypeScript)                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Layer                              │  │
│  │                                                            │  │
│  │  /api/notification/register-token    (POST)              │  │
│  │  /api/notification/unregister-token  (DELETE)            │  │
│  │  /api/notification                   (GET)               │  │
│  │  /api/notification/mark-read         (POST)              │  │
│  │  /api/notification/:id               (DELETE)            │  │
│  │  /api/notification/send              (POST - Admin)      │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │              Notification Service Layer                   │  │
│  │                                                            │  │
│  │  • sendToUser()                                           │  │
│  │  • sendToMultipleUsers()                                  │  │
│  │  • sendToRole()                                           │  │
│  │  • notifyNewJob()                                         │  │
│  │  • notifyJobApplication()                                 │  │
│  │  • notifyBookingConfirmed()                               │  │
│  │  • notifyNewMessage()                                     │  │
│  │  • notifyPaymentReceived()                                │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │              Firebase Admin SDK                           │  │
│  │                                                            │  │
│  │  • Initialize with service account                        │  │
│  │  • Send multicast messages                                │  │
│  │  • Handle token validation                                │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │                  Database Layer                           │  │
│  │                                                            │  │
│  │  Models:                                                  │  │
│  │  • Notification (history & status)                       │  │
│  │  • FcmToken (device tokens)                              │  │
│  │  • User (user data)                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                            │
│                                                                   │
│  Collections:                                                    │
│  • notifications                                                 │
│  • fcmtokens                                                     │
│  • users                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components Breakdown

### 1. Firebase Admin SDK (`src/lib/firebase.ts`)

**Purpose**: Initialize and manage Firebase connection

**Key Functions**:
- `initializeFirebase()` - Reads service account JSON and initializes Firebase
- `getFirebaseAdmin()` - Returns Firebase app instance
- `getMessaging()` - Returns Firebase Messaging instance

**Implementation Details**:
```typescript
- Reads firebase-service-account.json from project root
- Validates file exists before initialization
- Creates singleton instance (initialized once)
- Provides error handling and logging
```

### 2. Database Models

#### Notification Model (`src/db/models/notification.model.ts`)

**Purpose**: Store notification history and status

**Schema**:
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

**Indexes**:
- `userId + isRead` - For efficient unread queries
- `createdAt` - For sorting by date

#### FCM Token Model (`src/db/models/fcm-token.model.ts`)

**Purpose**: Manage device tokens for push notifications

**Schema**:
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

**Indexes**:
- `token` - Unique index for fast lookups
- `userId + deviceId` - Compound index for user's devices

### 3. Notification Service (`src/common/service/notification.service.ts`)

**Purpose**: Core business logic for sending notifications

**Class Methods**:

#### `sendToUser(payload)`
Sends notification to a single user across all their devices.

**Process**:
1. Save notification to database
2. Fetch all active FCM tokens for user
3. Prepare FCM multicast message
4. Send via Firebase Messaging
5. Update notification status
6. Deactivate failed tokens

**Returns**: `{ success: boolean, message: string }`

#### `sendToMultipleUsers(payload)`
Sends notification to multiple users.

**Process**:
1. Iterate through user IDs
2. Call `sendToUser()` for each
3. Collect results
4. Return summary

**Returns**: `{ success: boolean, message: string, results: any[] }`

#### `sendToRole(role, title, body, type, data)`
Broadcasts notification to all users with specific role.

**Process**:
1. Query database for users with role
2. Extract user IDs
3. Call `sendToMultipleUsers()`

**Supported Roles**: `contractor`, `customer`, `admin`

#### Helper Methods
Pre-configured methods for common scenarios:
- `notifyNewJob()` - Notify contractors of new job
- `notifyJobApplication()` - Notify customer of application
- `notifyBookingConfirmed()` - Notify contractor of booking
- `notifyNewMessage()` - Notify user of new message
- `notifyPaymentReceived()` - Notify contractor of payment

### 4. API Routes (`src/api/notification/`)

**Structure**:
```
notification/
├── notification.route.ts           # Route definitions
├── notification.validation.ts      # Zod schemas
├── notification.openapi.ts         # OpenAPI documentation
└── services/
    ├── register-token.service.ts
    ├── unregister-token.service.ts
    ├── get-notifications.service.ts
    ├── mark-as-read.service.ts
    ├── delete-notification.service.ts
    └── send-notification.service.ts
```

**Middleware Applied**:
- `requireAuth` - JWT authentication (all routes)
- `requireRole('admin')` - Admin-only (send notification)
- `validateBody()` - Request validation

---

## Data Flow

### Flow 1: User Registration & Token Setup

```
1. User installs app
2. User logs in
3. Flutter app requests FCM token from Firebase
4. Flutter app receives token
5. Flutter app calls POST /api/notification/register-token
6. Backend validates JWT
7. Backend saves token to fcmtokens collection
8. Backend returns success
9. User is ready to receive notifications
```

### Flow 2: Sending Notification

```
1. Event occurs (e.g., new job posted)
2. Backend calls NotificationService.notifyNewJob()
3. Service creates notification record in database
4. Service queries fcmtokens for target user(s)
5. Service prepares FCM message payload
6. Service calls Firebase Admin SDK
7. Firebase sends to FCM servers
8. FCM delivers to user's device(s)
9. Service updates notification.isSent = true
10. Service deactivates any failed tokens
```

### Flow 3: Receiving Notification (Mobile)

```
1. FCM delivers notification to device
2. Flutter app receives via FirebaseMessaging

   If app is FOREGROUND:
   - onMessage handler triggered
   - Show local notification
   - Update in-app notification list

   If app is BACKGROUND:
   - System shows notification automatically
   - onMessageOpenedApp triggered on tap

   If app is TERMINATED:
   - System shows notification automatically
   - getInitialMessage() retrieves on app launch

3. User taps notification
4. App navigates to relevant screen
5. App calls POST /api/notification/mark-read
6. Backend updates notification.isRead = true
```

### Flow 4: Fetching Notification History

```
1. User opens notifications screen
2. App calls GET /api/notification
3. Backend validates JWT
4. Backend queries notifications collection
5. Backend filters by userId
6. Backend sorts by createdAt (newest first)
7. Backend returns notification list
8. App displays in UI
```

---

## Database Schema

### Notifications Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  userId: ObjectId("507f191e810c19729de860ea"),
  title: "New Job Available",
  body: "A new plumbing job has been posted in your area",
  type: "job_posted",
  data: {
    jobId: "507f1f77bcf86cd799439012",
    category: "plumbing",
    location: "New York"
  },
  isRead: false,
  isSent: true,
  sentAt: ISODate("2025-10-30T10:30:00Z"),
  readAt: null,
  createdAt: ISODate("2025-10-30T10:30:00Z"),
  updatedAt: ISODate("2025-10-30T10:30:00Z")
}
```

### FCM Tokens Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  userId: ObjectId("507f191e810c19729de860ea"),
  token: "fGcI8xKxRZe...",  // FCM device token
  deviceId: "device_12345",
  deviceType: "android",
  isActive: true,
  lastUsed: ISODate("2025-10-30T10:30:00Z"),
  createdAt: ISODate("2025-10-29T08:00:00Z"),
  updatedAt: ISODate("2025-10-30T10:30:00Z")
}
```

---

## API Design

### Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request/Response Format

All responses follow standard format:

```json
{
  "status": 200,
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Error Handling

Errors return appropriate HTTP status codes:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Implementation Details

### Token Management

**Registration**:
- Tokens are unique (enforced by database)
- Multiple devices per user supported
- Device type tracked for platform-specific handling
- Tokens marked active on registration

**Validation**:
- Invalid tokens detected during send
- Failed tokens automatically deactivated
- Users can re-register after token refresh

**Cleanup**:
- Inactive tokens kept for audit
- Can be purged periodically (future enhancement)

### Notification Types

Supported types:
- `job_posted` - New job available
- `job_application` - Someone applied to job
- `booking_confirmed` - Booking accepted
- `booking_declined` - Booking rejected
- `message_received` - New chat message
- `payment_received` - Payment received
- `payment_released` - Payment released to contractor
- `job_completed` - Job marked complete
- `review_submitted` - New review posted
- `general` - Generic notification

### Payload Structure

FCM message payload:

```typescript
{
  notification: {
    title: string,
    body: string
  },
  data: {
    type: string,
    notificationId: string,
    ...customData
  },
  tokens: string[]
}
```

### Performance Optimizations

1. **Batch Processing**: Multicast messages sent to multiple devices
2. **Database Indexes**: Optimized queries for userId and createdAt
3. **Singleton Pattern**: Firebase initialized once
4. **Async Operations**: Non-blocking notification sends
5. **Token Caching**: Active tokens queried efficiently

---

## Security Considerations

### Backend Security

1. **Service Account Protection**:
   - JSON file excluded from git
   - File permissions restricted
   - Never exposed via API

2. **Authentication**:
   - JWT required for all endpoints
   - Token validation on every request
   - Role-based access control

3. **Input Validation**:
   - Zod schemas validate all inputs
   - SQL injection prevented (MongoDB)
   - XSS protection via sanitization

4. **Rate Limiting** (recommended):
   - Limit notification sends per user
   - Prevent spam/abuse
   - Implement in production

### Mobile Security

1. **Token Storage**:
   - Access tokens in secure storage
   - Never log sensitive data
   - Clear on logout

2. **HTTPS Only**:
   - All API calls over HTTPS
   - Certificate pinning (recommended)

3. **Data Validation**:
   - Validate notification payloads
   - Handle malformed data gracefully

---

## Summary

The JobSphere push notification system provides:

✅ **Reliable delivery** via Firebase Cloud Messaging
✅ **Persistent history** in MongoDB
✅ **Multi-device support** for users
✅ **Type-based notifications** for different events
✅ **Role-based broadcasting** to user groups
✅ **Admin control** for custom notifications
✅ **Automatic token management** with cleanup
✅ **Comprehensive API** for mobile integration

The architecture is scalable, maintainable, and follows best practices for production systems.
