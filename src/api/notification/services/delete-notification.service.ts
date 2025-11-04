import { db } from "@/db";
import { sendError, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Delete a notification
 * User can only delete their own notifications
 */
export const deleteNotification: RequestHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.userId;

		if (!userId) {
			return sendInternalError(res, "User not authenticated");
		}

		// Find and delete notification (only if user owns it)
		const notification = await db.notification.findOneAndDelete({
			_id: id,
			userId,
		});

		if (!notification) {
			return sendError(res, 404, "Notification not found");
		}

		return sendSuccess(res, 200, "Notification deleted successfully", null);
	} catch (error) {
		console.error("Error deleting notification:", error);
		return sendInternalError(res, "Failed to delete notification");
	}
};
