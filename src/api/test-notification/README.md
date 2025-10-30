# Test Notification Module

This module provides a simple endpoint for testing push notifications in the JobSphere backend.

## Purpose

This endpoint is designed for **testing purposes only** to verify that the push notification system is working correctly. It allows you to send a test notification to any user without triggering actual business logic.

## Endpoint

### POST `/api/test-notification`

Send a test push notification to a specific user.

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "userId": "string (required)",
  "title": "string (optional)",
  "body": "string (optional)"
}
```

**Default Values:**
- `title`: "Test Notification"
- `body`: "This is a test notification from JobSphere backend"

**Response (Success):**

```json
{
  "status": 200,
  "message": "Test notification sent successfully",
  "data": {
    "success": true,
    "message": "Notification sent to 2 device(s)"
  }
}
```

**Response (Error - No Devices):**

```json
{
  "status": 400,
  "message": "No active devices found for user",
  "data": null
}
```

## Usage Examples

### Using cURL

```bash
curl -X POST http://localhost:4000/api/test-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "userId": "507f191e810c19729de860ea",
    "title": "Test Notification",
    "body": "Testing push notifications"
  }'
```

### Using HTTP Client (VS Code REST Client)

See `api-client/test-notification-api.http` for ready-to-use requests.

### Using Postman

1. Create a new POST request to `http://localhost:4000/api/test-notification`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Set body to JSON:
   ```json
   {
     "userId": "USER_ID_HERE",
     "title": "Test",
     "body": "Testing notifications"
   }
   ```
4. Send the request

## Testing Checklist

Before testing, ensure:

1. ✅ Backend server is running
2. ✅ Firebase Admin SDK is initialized (check console for "✅ Firebase Admin SDK initialized successfully")
3. ✅ User has registered their FCM token (via `/api/notification/register-token`)
4. ✅ You have a valid access token
5. ✅ You have the target user's ID

## How It Works

1. Receives request with userId and optional title/body
2. Calls `NotificationService.sendToUser()` with test data
3. Creates notification record in database
4. Fetches all active FCM tokens for the user
5. Sends push notification via Firebase Cloud Messaging
6. Returns success/failure status

## Notification Data

The test notification includes:
- **Type:** `general`
- **Custom Data:**
  - `test: true`
  - `timestamp: ISO date string`

## Common Issues

### "No active devices found for user"

**Cause:** User hasn't registered their FCM token or all tokens are inactive.

**Solution:** 
- Ensure user has logged in on mobile app
- Verify token registration via `/api/notification/register-token`
- Check `fcmtokens` collection in MongoDB

### "Unauthorized"

**Cause:** Missing or invalid access token.

**Solution:**
- Login via `/api/auth/login` to get a valid token
- Ensure token is included in Authorization header

### "Firebase initialization failed"

**Cause:** Firebase service account file missing or invalid.

**Solution:**
- Ensure `firebase-service-account.json` exists in project root
- Verify file contains valid Firebase credentials
- Restart the server

## Production Note

⚠️ **This endpoint should be disabled or restricted in production environments.** Consider:

- Removing the route in production
- Adding admin-only access control
- Implementing rate limiting
- Logging all test notification requests

## Related Documentation

- [Push Notification Setup Guide](../../../doc/PUSH_NOTIFICATION_SETUP.md)
- [Flutter Integration Guide](../../../doc/FLUTTER_INTEGRATION.md)
- [Notification Architecture](../../../doc/NOTIFICATION_ARCHITECTURE.md)
