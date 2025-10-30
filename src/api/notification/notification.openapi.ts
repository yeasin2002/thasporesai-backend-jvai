import { registry } from "@/lib/openapi";
import { z } from "zod";
import {
  ErrorResponseSchema,
  FcmTokenResponseSchema,
  MarkAsReadSchema,
  NotificationIdSchema,
  NotificationResponseSchema,
  NotificationsResponseSchema,
  RegisterFcmTokenSchema,
  SendNotificationSchema,
} from "./notification.validation";

// Register schemas
registry.register("RegisterFcmToken", RegisterFcmTokenSchema);
registry.register("SendNotification", SendNotificationSchema);
registry.register("MarkAsRead", MarkAsReadSchema);
registry.register("NotificationIdParam", NotificationIdSchema);
registry.register("NotificationResponse", NotificationResponseSchema);
registry.register("NotificationsResponse", NotificationsResponseSchema);
registry.register("FcmTokenResponse", FcmTokenResponseSchema);
registry.register("ErrorResponse", ErrorResponseSchema);

// POST /api/notification/register-token - Register FCM token
registry.registerPath({
  method: "post",
  path: "/api/notification/register-token",
  description: "Register FCM device token for push notifications",
  summary: "Register FCM token",
  tags: ["notification"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterFcmTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token registered successfully",
      content: {
        "application/json": {
          schema: FcmTokenResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// DELETE /api/notification/unregister-token - Unregister FCM token
registry.registerPath({
  method: "delete",
  path: "/api/notification/unregister-token",
  description: "Unregister FCM device token",
  summary: "Unregister FCM token",
  tags: ["notification"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            token: z
              .string()
              .min(1)
              .openapi({ description: "FCM device token" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token unregistered successfully",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// GET /api/notification - Get user's notifications
registry.registerPath({
  method: "get",
  path: "/api/notification",
  description: "Get all notifications for authenticated user",
  summary: "Get user notifications",
  tags: ["notification"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Notifications retrieved successfully",
      content: {
        "application/json": {
          schema: NotificationsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// POST /api/notification/mark-read - Mark notifications as read
registry.registerPath({
  method: "post",
  path: "/api/notification/mark-read",
  description: "Mark one or more notifications as read",
  summary: "Mark notifications as read",
  tags: ["notification"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: MarkAsReadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Notifications marked as read",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// DELETE /api/notification/{id} - Delete notification
registry.registerPath({
  method: "delete",
  path: "/api/notification/{id}",
  description: "Delete a notification",
  summary: "Delete notification",
  tags: ["notification"],
  security: [{ bearerAuth: [] }],
  request: {
    params: NotificationIdSchema,
  },
  responses: {
    200: {
      description: "Notification deleted successfully",
      content: {
        "application/json": {
          schema: NotificationResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Notification not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// POST /api/notification/send - Send notification (Admin only)
registry.registerPath({
  method: "post",
  path: "/api/notification/send",
  description: "Send push notification to a user (Admin only)",
  summary: "Send notification",
  tags: ["notification"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendNotificationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Notification sent successfully",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Admin only",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
