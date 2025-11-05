# Mobile App Push Notification Integration

Minimal guide for integrating push notifications with JobSphere backend.

## Base URL

```
https://your-backend-url.com/api
```

## Authentication

All endpoints require JWT Bearer token:

```
Authorization: Bearer <your_access_token>
```

---

## API Endpoints

### 1. Register FCM Token

Register device token to receive push notifications.

**Endpoint:** `POST /api/notification/register-token`

**Request Body:**

```json
{
  "token": "fcm_device_token_here",
  "deviceId": "unique_device_id",
  "deviceType": "android"
}
```

**Fields:**

- `token` (string, required): FCM device token from Firebase
- `deviceId` (string, required): Unique device identifier
- `deviceType` (enum, required): Either `"android"` or `"ios"`

**Response (200 OK):**

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

**When to call:**

- After successful user login
- When FCM token is refreshed

---

### 2. Unregister FCM Token

Remove device token (e.g., on logout).

**Endpoint:** `DELETE /api/notification/unregister-token`

**Request Body:**

```json
{
  "token": "fcm_device_token_here"
}
```

**Response (200 OK):**

```json
{
  "status": 200,
  "message": "FCM token unregistered successfully",
  "data": null
}
```

**When to call:**

- On user logout
- When user disables notifications

---

### 3. Get All Notifications

Retrieve all notifications for authenticated user.

**Endpoint:** `GET /api/notification`

**Query Parameters:** None

**Response (200 OK):**

```json
{
  "status": 200,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "_id": "67890abcdef",
      "userId": "12345abcdef",
      "title": "New Job Available",
      "body": "A new plumbing job has been posted in your area",
      "type": "job_posted",
      "data": {
        "jobId": "job_12345",
        "category": "plumbing"
      },
      "isRead": false,
      "isSent": true,
      "sentAt": "2025-11-05T10:30:00.000Z",
      "readAt": null,
      "createdAt": "2025-11-05T10:30:00.000Z",
      "updatedAt": "2025-11-05T10:30:00.000Z"
    }
  ]
}
```

**Notification Object:**

- `_id` (string): Notification ID
- `userId` (string): User ID
- `title` (string): Notification title
- `body` (string): Notification message
- `type` (enum): Notification type (see types below)
- `data` (object): Additional data payload
- `isRead` (boolean): Read status
- `isSent` (boolean): Sent status
- `sentAt` (date): When notification was sent
- `readAt` (date): When notification was read
- `createdAt` (date): Creation timestamp
- `updatedAt` (date): Update timestamp

**Notification Types:**

- `job_posted` - New job available
- `job_application` - Someone applied to your job
- `booking_confirmed` - Booking accepted
- `booking_declined` - Booking rejected
- `message_received` - New chat message
- `payment_received` - Payment received
- `payment_released` - Payment released to contractor
- `job_completed` - Job marked complete
- `review_submitted` - New review posted
- `general` - Generic notification

**Notes:**

- Returns last 100 notifications
- Sorted by newest first (createdAt descending)
- Empty array if no notifications

---

### 4. Mark Notifications as Read

Mark one or more notifications as read.

**Endpoint:** `POST /api/notification/mark-read`

**Request Body:**

```json
{
  "notificationIds": ["notification_id_1", "notification_id_2"]
}
```

**Response (200 OK):**

```json
{
  "status": 200,
  "message": "Notifications marked as read successfully",
  "data": null
}
```

**When to call:**

- When user opens notification
- When user views notification list

---

### 5. Delete Notification

Delete a specific notification.

**Endpoint:** `DELETE /api/notification/:id`

**URL Parameters:**

- `id` (string): Notification ID

**Response (200 OK):**

```json
{
  "status": 200,
  "message": "Notification deleted successfully",
  "data": null
}
```

---

## Error Responses

All endpoints may return these error responses:

**401 Unauthorized:**

```json
{
  "status": 401,
  "message": "Unauthorized",
  "data": null
}
```

**400 Bad Request:**

```json
{
  "status": 400,
  "message": "Validation error message",
  "data": null
}
```

**500 Internal Server Error:**

```json
{
  "status": 500,
  "message": "Internal Server Error",
  "data": null
}
```

---

## Integration Flow

### 1. On App Launch

```
1. Initialize Firebase
2. Request notification permissions
3. Get FCM token from Firebase
```

### 2. After Login

```
1. Save access token securely
2. Get FCM token
3. Call POST /api/notification/register-token
4. Listen for token refresh
```

### 3. On Token Refresh

```
1. Get new FCM token
2. Call POST /api/notification/register-token with new token
```

### 4. On Logout

```
1. Get current FCM token
2. Call DELETE /api/notification/unregister-token
3. Clear access token
```

### 5. Receiving Notifications

```
Foreground:
- Show local notification
- Update in-app notification list

Background/Terminated:
- System shows notification automatically
- Handle tap to navigate to relevant screen
```

### 6. Viewing Notifications

```
1. Call GET /api/notification
2. Display list in UI
3. On tap, call POST /api/notification/mark-read
4. Navigate to relevant screen based on type
```

---

## Example: Flutter Implementation

### Register Token After Login

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> registerFcmToken(String accessToken) async {
  // Get FCM token
  String? fcmToken = await FirebaseMessaging.instance.getToken();

  if (fcmToken == null) return;

  // Register with backend
  final response = await http.post(
    Uri.parse('https://your-backend-url.com/api/notification/register-token'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({
      'token': fcmToken,
      'deviceId': 'unique_device_id', // Generate or get from device
      'deviceType': Platform.isAndroid ? 'android' : 'ios',
    }),
  );

  if (response.statusCode == 200) {
    print('Token registered successfully');
  }
}
```

### Get All Notifications

```dart
Future<List<Map<String, dynamic>>> getNotifications(String accessToken) async {
  final response = await http.get(
    Uri.parse('https://your-backend-url.com/api/notification'),
    headers: {
      'Authorization': 'Bearer $accessToken',
    },
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return List<Map<String, dynamic>>.from(data['data']);
  }

  return [];
}
```

### Mark as Read

```dart
Future<void> markAsRead(String accessToken, List<String> notificationIds) async {
  await http.post(
    Uri.parse('https://your-backend-url.com/api/notification/mark-read'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({
      'notificationIds': notificationIds,
    }),
  );
}
```

### Unregister on Logout

```dart
Future<void> unregisterFcmToken(String accessToken, String fcmToken) async {
  await http.delete(
    Uri.parse('https://your-backend-url.com/api/notification/unregister-token'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({
      'token': fcmToken,
    }),
  );
}
```

---

## Testing

### 1. Test Token Registration

```bash
curl -X POST https://your-backend-url.com/api/notification/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "token": "test_fcm_token",
    "deviceId": "test_device_001",
    "deviceType": "android"
  }'
```

### 2. Test Get Notifications

```bash
curl -X GET https://your-backend-url.com/api/notification \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test Mark as Read

```bash
curl -X POST https://your-backend-url.com/api/notification/mark-read \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "notificationIds": ["notification_id_1"]
  }'
```

---

## Important Notes

1. **Firebase Setup Required**: Your mobile app must have Firebase configured with FCM enabled
2. **Token Refresh**: Listen for FCM token refresh and re-register with backend
3. **Secure Storage**: Store access tokens securely (use flutter_secure_storage or similar)
4. **Error Handling**: Always handle network errors and invalid responses
5. **Notification Permissions**: Request permissions before getting FCM token
6. **HTTPS Only**: Use HTTPS in production for all API calls

---

## Support

For backend issues or questions, contact the backend team.

For Firebase setup, refer to:

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Flutter Documentation](https://firebase.flutter.dev/)
