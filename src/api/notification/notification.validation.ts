import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
const notificationTypes = [
  "job_posted",
  "job_application",
  "booking_confirmed",
  "booking_declined",
  "message_received",
  "payment_received",
  "payment_released",
  "job_completed",
  "review_submitted",
  "general",
];

// Base notification schema
export const NotificationSchema = z.object({
  _id: z.string().openapi({ description: "Notification ID" }),
  userId: z.string().openapi({ description: "User ID" }),
  title: z.string().openapi({ description: "Notification title" }),
  body: z.string().openapi({ description: "Notification body" }),
  type: z.enum(notificationTypes).openapi({ description: "Notification type" }),
  data: z
    .record(z.string(), z.any())
    .optional()
    .openapi({ description: "Additional data" }),
  isRead: z.boolean().openapi({ description: "Read status" }),
  isSent: z.boolean().openapi({ description: "Sent status" }),
  sentAt: z.date().optional().openapi({ description: "Sent timestamp" }),
  readAt: z.date().optional().openapi({ description: "Read timestamp" }),
  createdAt: z.date().optional().openapi({ description: "Creation timestamp" }),
  updatedAt: z.date().optional().openapi({ description: "Update timestamp" }),
});

// FCM Token schema
export const FcmTokenSchema = z.object({
  token: z.string().min(1).openapi({ description: "FCM device token" }),
  deviceId: z.string().min(1).openapi({ description: "Device ID" }),
  deviceType: z
    .enum(["android", "ios"])
    .openapi({ description: "Device type" }),
});

// Register FCM token schema
export const RegisterFcmTokenSchema = FcmTokenSchema.openapi("RegisterFcmToken");

// Send notification schema
export const SendNotificationSchema = z
  .object({
    userId: z.string().min(1).openapi({ description: "Target user ID" }),
    title: z.string().min(1).openapi({ description: "Notification title" }),
    body: z.string().min(1).openapi({ description: "Notification body" }),
    type: z
      .enum(notificationTypes)
      .optional()
      .openapi({ description: "Notification type" }),
    data: z
      .record(z.string(), z.any())
      .optional()
      .openapi({ description: "Additional data" }),
  })
  .openapi("SendNotification");

// Mark as read schema
export const MarkAsReadSchema = z
  .object({
    notificationIds: z
      .array(z.string())
      .openapi({ description: "Array of notification IDs to mark as read" }),
  })
  .openapi("MarkAsRead");

// Param schema
export const NotificationIdSchema = z
  .object({
    id: z.string().min(1).openapi({ description: "Notification ID" }),
  })
  .openapi("NotificationIdParam");

// Response schemas
export const NotificationResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: NotificationSchema.nullable(),
  })
  .openapi("NotificationResponse");

export const NotificationsResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.array(NotificationSchema),
  })
  .openapi("NotificationsResponse");

export const FcmTokenResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z
      .object({
        token: z.string(),
        deviceId: z.string(),
        deviceType: z.enum(["android", "ios"]),
      })
      .nullable(),
  })
  .openapi("FcmTokenResponse");

export const ErrorResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.null(),
  })
  .openapi("ErrorResponse");

// Export types
export type Notification = z.infer<typeof NotificationSchema>;
export type RegisterFcmToken = z.infer<typeof RegisterFcmTokenSchema>;
export type SendNotification = z.infer<typeof SendNotificationSchema>;
export type MarkAsRead = z.infer<typeof MarkAsReadSchema>;
export type NotificationId = z.infer<typeof NotificationIdSchema>;
