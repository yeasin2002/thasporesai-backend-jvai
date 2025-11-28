import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { MarkAsRead } from "../notification.validation";

/**
 * Mark one or more notifications as read
 */
export const markAsRead: RequestHandler<{}, any, MarkAsRead> = async (
	req,
	res,
) => {
	try {
		const { notificationIds } = req.body;
		const userId = req.user?.userId;

		if (!userId) {
			return sendInternalError(res, "User not authenticated", { userId });
		}

		// Update notifications to mark as read
		const result = await db.notification.updateMany(
			{
				_id: { $in: notificationIds },
				userId, // Ensure user owns these notifications
			},
			{
				isRead: true,
				readAt: new Date(),
			},
		);

		return sendSuccess(
			res,
			200,
			`${result.modifiedCount} notification(s) marked as read`,
			null,
		);
	} catch (error) {
		console.error("Error marking notifications as read:", error);
		return sendInternalError(
			res,
			"Failed to mark notifications as read",
			error,
		);
	}
};
