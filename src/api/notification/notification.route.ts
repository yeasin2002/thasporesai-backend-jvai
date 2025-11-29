import "./notification.openapi";

import {
  requireAuth,
  requireRole,
  validateBody,
  validateQuery,
} from "@/middleware";
import express, { type Router } from "express";
import {
  MarkAsReadSchema,
  RegisterFcmTokenSchema,
  SendNotificationSchema,
} from "./notification.validation";
import {
  deleteNotification,
  getNotifications,
  markAsRead,
  registerToken,
  sendNotification,
  unregisterToken,
} from "./services";

export const notification: Router = express.Router();

// Register FCM token (requires authentication)
notification.post(
  "/register-token",
  requireAuth,
  validateBody(RegisterFcmTokenSchema),
  registerToken
);

// Unregister FCM token (requires authentication)
notification.delete(
  "/unregister-token",
  requireAuth,
  validateBody(RegisterFcmTokenSchema.pick({ token: true })),
  unregisterToken
);

// Get user's notifications (requires authentication)
notification.get("/", requireAuth, getNotifications);

// Mark notifications as read (requires authentication)
notification.post(
  "/mark-read",
  requireAuth,
  validateBody(MarkAsReadSchema),
  markAsRead
);

// Delete notification (requires authentication)
notification.delete("/:id", requireAuth, deleteNotification);

// Send notification (Admin only)
notification.post(
  "/send",
  requireAuth,
  requireRole("admin"),
  validateQuery(SendNotificationSchema),
  sendNotification
);
