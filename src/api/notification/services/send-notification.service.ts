import { NotificationService } from "@/common/service/notification.service";
import { sendError, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type {
  SendNotificationBody,
  SendNotificationQuery,
} from "../notification.validation";

/**
 * Send push notification to a user (Admin only)
 * This endpoint is protected by requireRole("admin") middleware
 *
 * Query params: userId, title, body, type
 * Body: data (optional)
 */
export const sendNotification: RequestHandler<
  {},
  any,
  SendNotificationBody,
  SendNotificationQuery
> = async (req, res) => {
  try {
    // Get parameters from query
    const { userId, title, body, type } = req.query;

    // Get data from body
    const { data } = req.body;

    // Send notification using NotificationService
    const result = await NotificationService.sendToUser({
      userId: userId as string,
      title: title as string,
      body: body as string,
      type,
      data,
    });

    if (!result.success) {
      return sendError(res, 400, result.message);
    }

    return sendSuccess(res, 200, result.message, null);
  } catch (error) {
    console.error("Error sending notification:", error);
    return sendInternalError(res, "Failed to send notification", error);
  }
};
