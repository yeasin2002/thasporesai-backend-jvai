import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get all notifications for authenticated user
 * Returns notifications sorted by creation date (newest first)
 */
export const getNotifications: RequestHandler = async (req, res) => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			return sendInternalError(res, "User not authenticated");
		}

		// Get notifications for user, sorted by newest first
		const notifications = await db.notification
			.find({ userId })
			.sort({ createdAt: -1 })
			.limit(100); // Limit to last 100 notifications

		return sendSuccess(
			res,
			200,
			"Notifications retrieved successfully",
			notifications,
		);
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return sendInternalError(res, "Failed to fetch notifications");
	}
};
