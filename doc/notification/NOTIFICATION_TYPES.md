# Notification Types

## Overview

JobSphere supports 15 different notification types to cover all user interactions in the platform. This document describes each type and provides usage examples.

## Notification Types

### 1. `job_posted`

**When**: A new job is posted on the platform  
**Sent to**: All contractors  
**Usage**:

```typescript
await NotificationService.notifyNewJob(jobId, jobTitle);
```

### 2. `job_application`

**When**: A contractor applies to a customer's job  
**Sent to**: Customer who posted the job  
**Usage**:

```typescript
await NotificationService.notifyJobApplication(
  customerId,
  contractorName,
  jobTitle
);
```

### 3. `job_invite` ⭐ NEW

**When**: Customer invites a specific contractor to apply for their job  
**Sent to**: Invited contractor  
**Usage**:

```typescript
import { NotificationHelpers } from "@/common/service";

await NotificationHelpers.notifyJobInvite(
  contractorId,
  customerName,
  jobTitle,
  jobId
);
```

### 4. `job_request` ⭐ NEW

**When**: Contractor requests to work on a customer's job  
**Sent to**: Customer who posted the job  
**Usage**:

```typescript
import { NotificationHelpers } from "@/common/service";

await NotificationHelpers.notifyJobRequest(
  customerId,
  contractorName,
  jobTitle,
  jobId
);
```

### 5. `sent_offer` ⭐ NEW

**When**: Customer sends an offer to a contractor  
**Sent to**: Contractor receiving the offer  
**Usage**:

```typescript
import { NotificationHelpers } from "@/common/service";

await NotificationHelpers.notifySentOffer(
  contractorId,
  customerName,
  jobTitle,
  offerAmount,
  offerId
);
```

### 6. `accept_offer` ⭐ NEW

**When**: Contractor accepts a customer's offer  
**Sent to**: Customer who sent the offer  
**Usage**:

```typescript
import { NotificationHelpers } from "@/common/service";

await NotificationHelpers.notifyAcceptOffer(
  customerId,
  contractorName,
  jobTitle,
  offerId
);
```

### 7. `booking_confirmed`

**When**: Customer confirms a contractor's application  
**Sent to**: Contractor whose application was accepted  
**Usage**:

```typescript
await NotificationService.notifyBookingConfirmed(contractorId, jobTitle);
```

### 8. `booking_declined`

**When**: Customer declines a contractor's application  
**Sent to**: Contractor whose application was declined  
**Usage**:

```typescript
await NotificationService.sendToUser({
  userId: contractorId,
  title: "Application Declined",n/service";

await NotificationHelpers.notifyPaymentComplete(
  contractorId,
  customerId,
  jobTitle,
  amount,
  jobId
);
```

### 11. `payment_received`

**When**: Contractor receives payment in their wallet  
**Sent to**: Contractor  
**Usage**:

```typescript
await NotificationService.notifyPaymentReceived(contractorId, amount);
```

### 12. `payment_released`

**When**: Admin releases payment to contractor after job completion  
**Sent to**: Contractor  
**Usage**:

```typescript
await NotificationService.sendToUser({
  userId: contractorId,
  title: "Payment Released",
  body: `Payment of $${amount} has been released to your account`,
  type: "payment_released",
  data: { jobId, amount },
});
```

### 13. `job_completed`

**When**: Job is marked as completed  
**Sent to**: Both contractor and customer  
**Usage**:

```typescript
await NotificationService.sendToUser({
  userId: contractorId,
  title: "Job Completed",
  body: `Job "${jobTitle}" has been marked as completed`,
  type: "job_completed",
  data: { jobId },
});
```

### 14. `review_submitted`

**When**: User submits a review  
**Sent to**: User being reviewed  
**Usage**:

```typescript
await NotificationService.sendToUser({
  userId: reviewedUserId,
  title: "New Review",
  body: `${reviewerName} left you a review`,
  type: "review_submitted",
  data: { reviewId },
});
```

### 15. `general`

**When**: Generic notifications (system updates, announcements, etc.)  
**Sent to**: Any user or role  
**Usage**:

```typescript
// Send to specific user
await NotificationService.sendToUser({
  userId: userId,
  title: "System Update",
  body: "New features are now available!",
  type: "general",
});

// Broadcast to all contractors
await NotificationService.sendToRole(
  "contractor",
  "Platform Maintenance",
  "Scheduled maintenance on Sunday at 2 AM",
  "general"
);
```

## Usage Examples

### Example 1: Customer Invites Contractor

```typescript
import { NotificationHelpers } from "@/common/service";
import { db } from "@/db";

// In your job-invite service
export const inviteContractor: RequestHandler = async (req, res) => {
  const { contractorId, jobId } = req.body;
  const customerId = req.user!.id;

  // Get job and customer details
  const job = await db.job.findById(jobId);
  const customer = await db.user.findById(customerId);

  // Create invitation record
  const invitation = await db.jobInvite.create({
    jobId,
    contractorId,
    customerId,
    status: "pending",
  });

  // Send notification
  await NotificationHelpers.notifyJobInvite(
    contractorId,
    customer.full_name,
    job.title,
    jobId
  );

  return sendSuccess(res, 201, "Invitation sent successfully", invitation);
};
```

### Example 2: Customer Sends Offer

```typescript
import { NotificationHelpers } from "@/common/service";
import { db } from "@/db";

// In your offer service
export const sendOffer: RequestHandler = async (req, res) => {
  const { contractorId, jobId, amount, description } = req.body;
  const customerId = req.user!.id;

  // Get job and customer details
  const job = await db.job.findById(jobId);
  const customer = await db.user.findById(customerId);

  // Create offer
  const offer = await db.offer.create({
    jobId,
    contractorId,
    customerId,
    amount,
    description,
    status: "pending",
  });

  // Send notification
  await NotificationHelpers.notifySentOffer(
    contractorId,
    customer.full_name,
    job.title,
    amount,
    offer._id.toString()
  );

  return sendSuccess(res, 201, "Offer sent successfully", offer);
};
```

### Example 3: Payment Held by Admin

```typescript
import { NotificationHelpers } from "@/common/service";
import { db } from "@/db";

// In your payment service
export const capturePayment: RequestHandler = async (req, res) => {
  const { offerId } = req.body;

  // Get offer details
  const offer = await db.offer
    .findById(offerId)
    .populate("job")
    .populate("contractor")
    .populate("customer");

  // Capture payment via Stripe
  await stripe.paymentIntents.capture(offer.paymentIntentId);

  // Update offer status
  offer.status = "accepted";
  await offer.save();

  // Send notifications to both parties
  await NotificationHelpers.notifyPaymentComplete(
    offer.contractor._id.toString(),
    offer.customer._id.toString(),
    offer.job.title,
    offer.amount,
    offer.job._id.toString()
  );

  return sendSuccess(res, 200, "Payment captured successfully");
};
```

## Adding New Notification Types

To add a new notification type in the future:

### Step 1: Update Validation Schema

Edit `src/api/notification/notification.validation.ts`:

```typescript
const notificationTypes = [
  // ... existing types
  "your_new_type", // Add your new type here
] as const;
```

### Step 2: Update Database Model

Edit `src/db/models/notification.model.ts`:

```typescript
type:
  | "job_posted"
  // ... existing types
  | "your_new_type" // Add to TypeScript interface

// And in the schema enum:
enum: [
  "job_posted",
  // ... existing types
  "your_new_type", // Add to Mongoose enum
]
```

### Step 3: Update Service Types

Edit `src/common/service/notification.service.ts`:

```typescript
export interface NotificationPayload {
  // ...
  type?:
    | "job_posted"
    // ... existing types
    | "your_new_type"; // Add to type union
}

// Also update BulkNotificationPayload and sendToRole method
```

### Step 4: Create Helper Method (Optional)

Add to `src/common/service/notification-helpers.ts`:

```typescript
/**
 * Send notification for your new scenario
 */
static async notifyYourNewScenario(
  userId: string,
  // ... other params
): Promise<void> {
  await NotificationService.sendToUser({
    userId,
    title: "Your Title",
    body: "Your message body",
    type: "your_new_type",
    data: { /* additional data */ }
  });
}
```

### Step 5: Document It

Add documentation to this file explaining when and how to use the new type.

## Best Practices

1. **Always include relevant data**: Add jobId, offerId, or other IDs in the `data` field for deep linking
2. **Use descriptive titles**: Make notification titles clear and actionable
3. **Keep bodies concise**: Mobile notifications have character limits
4. **Test on devices**: Always test notifications on actual mobile devices
5. **Handle errors gracefully**: Notification failures shouldn't break your main flow
6. **Use helper methods**: Prefer using helper methods over direct `sendToUser` calls for consistency

## Testing Notifications

Use the admin endpoint to test notifications:

```bash
POST /api/notification/send
Authorization: Bearer <admin_token>

{
  "userId": "user_id_here",
  "title": "Test Notification",
  "body": "This is a test",
  "type": "general",
  "data": {
    "testKey": "testValue"
  }
}
```

## Mobile App Integration

See `doc/notification/MOBILE_APP_INTEGRATION.md` for Flutter integration guide.

body: `Your application for "${jobTitle}" was not accepted`,
type: "booking_declined",
data: { jobId },
});

````

### 9. `message_received`

**When**: User receives a new chat message
**Sent to**: Message recipient
**Usage**:

```typescript
await NotificationService.notifyNewMessage(recipientId, senderName);
````

### 10. `payment_complete` ⭐ NEW

**When**: Payment is captured and held by admin (order started)  
**Sent to**: Both contractor and customer  
**Usage**:

```typescript
import { NotificationHelpers } from "@/commo
```
