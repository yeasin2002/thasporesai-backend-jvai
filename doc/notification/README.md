# Push Notification System Documentation

## Overview

JobSphere's push notification system uses Firebase Cloud Messaging (FCM) to send real-time notifications to mobile devices.

## Documentation Files

### For Mobile App Developers

📱 **[MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md)** - **START HERE**
- API endpoints reference
- Request/response examples
- Integration flow
- Flutter code examples
- Testing guide

This is the essential guide for integrating your mobile app with the notification system.

### For Backend Developers

🔧 **[PUSH_NOTIFICATION_SETUP.md](./PUSH_NOTIFICATION_SETUP.md)**
- Firebase project setup
- Backend configuration
- Service account setup
- Environment variables

📐 **[NOTIFICATION_ARCHITECTURE.md](./NOTIFICATION_ARCHITECTURE.md)**
- System architecture
- Component breakdown
- Data flow diagrams
- Database schema
- Security considerations

### Deprecated

~~[FLUTTER_INTEGRATION.md](./FLUTTER_INTEGRATION.md)~~ - Replaced by MOBILE_APP_INTEGRATION.md

---

## Quick Start for Mobile Developers

1. Read **[MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md)**
2. Setup Firebase in your mobile app
3. Implement the 5 API endpoints:
   - `POST /api/notification/register-token` - Register device
   - `DELETE /api/notification/unregister-token` - Unregister device
   - `GET /api/notification` - Get all notifications
   - `POST /api/notification/mark-read` - Mark as read
   - `DELETE /api/notification/:id` - Delete notification

4. Test with your backend URL

---

## API Base URL

```
Production: https://your-production-url.com/api
Development: http://localhost:4000/api
```

---

## Key Features

✅ Multi-device support per user
✅ Notification history persistence
✅ Read/unread tracking
✅ Type-based notifications (10 types)
✅ Automatic token management
✅ Both Android and iOS support

---

## Notification Types

- `job_posted` - New job available
- `job_application` - Job application received
- `booking_confirmed` - Booking accepted
- `booking_declined` - Booking rejected
- `message_received` - New chat message
- `payment_received` - Payment received
- `payment_released` - Payment released
- `job_completed` - Job completed
- `review_submitted` - Review posted
- `general` - Generic notification

---

## Support

- Backend API issues: Contact backend team
- Firebase setup: See [Firebase Console](https://console.firebase.google.com/)
- Mobile integration: See [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md)
