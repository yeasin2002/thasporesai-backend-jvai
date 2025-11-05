# Core Features

## Real-Time Communication

### WebSocket Chat System

- Real-time messaging between Customers and Contractors
- No voice/video call functionality
- Native WebSocket implementation
- Features:
  - One-to-one chat rooms
  - Message history persistence with database
  - Online/offline status
  - Typing indicators
  - Message read receipts
  - File sharing in chat (images, documents) and store them in database (after uploading to  storage)

###  Email Sending with nodemailer 
-  Send Email for OTP verification

### Push Notifications

- Mobile push notifications for Flutter app using **Firebase Cloud Messaging (FCM)**
- Backend uses **Firebase Admin SDK** for sending notifications
- Multi-device support (users can receive notifications on multiple devices)
- Notification history stored in MongoDB
- Automatic token management and cleanup

#### Notification Types

- `job_posted` - New job available (sent to all contractors)
- `job_application` - Job application received (sent to customer)
- `booking_confirmed` - Booking accepted (sent to contractor)
- `booking_declined` - Booking rejected (sent to contractor)
- `message_received` - New chat message (sent to recipient)
- `payment_received` - Payment received (sent to contractor)
- `payment_released` - Payment released (sent to contractor)
- `job_completed` - Job marked complete
- `review_submitted` - Review posted
- `general` - Generic notification

#### API Endpoints

- `POST /api/notification/register-token` - Register FCM device token
- `DELETE /api/notification/unregister-token` - Unregister device token
- `GET /api/notification` - Get user's notifications (last 100, sorted newest first)
- `POST /api/notification/mark-read` - Mark notifications as read
- `DELETE /api/notification/:id` - Delete notification
- `POST /api/notification/send` - Send notification (Admin only)

#### Notification Service

Located at `src/common/service/notification.service.ts`:

- `NotificationService.sendToUser()` - Send to single user
- `NotificationService.sendToMultipleUsers()` - Send to multiple users
- `NotificationService.sendToRole()` - Broadcast to all users with specific role
- `NotificationService.notifyNewJob()` - Helper for new job notifications
- `NotificationService.notifyJobApplication()` - Helper for job applications
- `NotificationService.notifyBookingConfirmed()` - Helper for booking confirmations
- `NotificationService.notifyNewMessage()` - Helper for new messages
- `NotificationService.notifyPaymentReceived()` - Helper for payments

#### Usage Example

```typescript
import { NotificationService } from "@/common/service/notification.service";

// Send to specific user
await NotificationService.sendToUser({
  userId: "user_id",
  title: "New Job Available",
  body: "A new job has been posted",
  type: "job_posted",
  data: { jobId: "job_123" }
});

// Broadcast to all contractors
await NotificationService.sendToRole(
  "contractor",
  "System Update",
  "New features available",
  "general"
);
```

## File Upload System

### Current Implementation

- **Storage Location**: `/upload` folder in project root
- **Future Migration**: AWS S3 or other cloud storage planned
- **Supported File Types**:
  - Profile images (customers, contractors)
  - Portfolio images (contractors)
  - Job-related documents and images
  - Chat attachments
  - Proof of work images

### Upload Features

- File size validation
- File type validation (images, PDFs, documents)
- Unique filename generation
- Secure file access control
- Image optimization/compression (optional)

### API Endpoints

- `POST /api/upload` - General file upload
- `GET /api/files/:filename` - Retrieve uploaded file
- `DELETE /api/files/:filename` - Delete file (authorized users only)

## Payment System (Stripe Integration)

### Payment Flow

1. **Customer Posts Job** → Sets budget/payment amount
2. **Contractor Accepts** → Customer pays via Stripe
3. **Admin Holds Payment** → Money held in escrow
4. **Job Completed** → Customer marks job as complete
5. **Payment Released** → Automatically transferred to contractor
6. **Contractor Withdraws** → Transfers to bank account

### Stripe Features

#### Payment Processing

- Secure card payments via Stripe
- Payment intent creation
- 3D Secure authentication support
- Payment confirmation webhooks

#### Escrow System

- Hold payments in Stripe account
- Automatic release on job completion
- Dispute handling mechanism
- Refund capability for cancelled jobs

#### Contractor Payouts

- Stripe Connect for contractor accounts
- Contractor onboarding (KYC verification)
- Payout scheduling (manual or automatic)
- Withdrawal to bank account
- Earnings dashboard

#### Admin Commission

- Configurable commission percentage
- Automatic commission deduction
- Commission tracking and reporting

### Payment Endpoints

#### Customer Endpoints

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Payment history

#### Contractor Endpoints

- `POST /api/payouts/connect` - Connect Stripe account
- `GET /api/payouts/balance` - Available balance
- `POST /api/payouts/withdraw` - Request withdrawal
- `GET /api/payouts/history` - Payout history

#### Webhook

- `POST /api/webhooks/stripe` - Handle Stripe events

### Payment States

- `pending` - Payment intent created
- `held` - Payment captured, held in escrow
- `released` - Payment released to contractor
- `withdrawn` - Contractor withdrew funds
- `refunded` - Payment refunded to customer
- `failed` - Payment failed

## Database Models Required

### Chat/Message Model

- sender, receiver, message, timestamp, read status, room ID

### Notification Model

Located at `src/db/models/notification.model.ts`:

```typescript
{
  userId: ObjectId,           // Reference to User
  title: string,              // Notification title
  body: string,               // Notification body
  type: enum,                 // Notification type (10 types)
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

Located at `src/db/models/fcm-token.model.ts`:

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

### File Model

- filename, originalName, path, mimeType, size, uploadedBy, uploadDate

### Payment Model

- customer, contractor, job, amount, commission, status, stripePaymentId, timestamps

### Payout Model

- contractor, amount, status, stripePayoutId, requestDate, completedDate

## Environment Variables Required

```env
# WebSocket
SOCKET_PORT=3001

# File Upload
UPLOAD_DIR=./upload
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_COMMISSION_PERCENT=10

# ------------------------------
# Firebase Configuration (Push Notifications)
# ------------------------------

# Firebase service account JSON file
# Place 'firebase-service-account.json' in project root
# Download from Firebase Console > Project Settings > Service Accounts
# File contains: project_id, private_key, client_email, etc.
# ⚠️ Add to .gitignore to prevent committing credentials



```

## Dependencies

```json
{
  "stripe": "^14.x",
  "multer": "^1.4.x",
  "firebase-admin": "^13.5.0"
}
```

## Firebase Setup

### Backend Setup

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add Android/iOS apps to Firebase project
3. Enable Cloud Messaging
4. Generate service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `firebase-service-account.json` in project root
5. Add to `.gitignore`: `firebase-service-account.json`

### Mobile App Setup

See `doc/notification/MOBILE_APP_INTEGRATION.md` for complete mobile integration guide.

### Initialization

Firebase is initialized in `src/lib/firebase.ts` and called in `src/app.ts` on server startup:

```typescript
import { initializeFirebase } from "@/lib/firebase";

try {
  initializeFirebase();
} catch (error) {
  console.warn("⚠️ Firebase initialization failed. Push notifications will not work.");
}
```
