import { NotificationService } from "@/common/service/notification.service";
import { sendError, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { TestNotification } from "../test-notification.validation";

// Send test notification
export const sendTestNotification: RequestHandler<
  {},
  any,
  TestNotification
> = async (req, res) => {
  try {
    const {
      userId,
      title = "Test Notification",
      body = "This is a test notification from JobSphere backend",
    } = req.body;

    // Send notification using NotificationService
    const result = await NotificationService.sendToUser({
      userId,
      title,
      body,
      type: "general",
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      return sendSuccess(res, 200, "Test notification sent successfully", {
        success: result.success,
        message: result.message,
      });
    }

    return sendError(res, 400, result.message);
  } catch (error) {
    console.log(error);
    return sendInternalError(res, "Failed to send test notification", error);
  }
};
