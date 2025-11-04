import { NotificationService } from "@/common/service/notification.service";
import { sendError, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { SendNotification } from "../notification.validation";

/**
 * Send push notification to a user (Admin only)
 * This endpoint is protected by requireRole("admin") middleware
 */
export const sendNotification: RequestHandler<
	{},
	any,
	SendNotification
> = async (req, res) => {
	try {
		const { userId, title, body, type, data } = req.body;

		// Send notification using NotificationService
		const result = await NotificationService.sendToUser({
			userId,
			title,
			body,
			type,
			data,
		});

		if (!result.success) {
			return sendError(res, 400, result.message);
		}

		return sendSuccess(res, 200, result.message, null);
	} catch (error) {
		console.error("Error sending notification:", error);
		return sendInternalError(res, "Failed to send notification");
	}
};
