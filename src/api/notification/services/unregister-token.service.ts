import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Unregister FCM device token
 * Marks token as inactive instead of deleting
 */
export const unregisterToken: RequestHandler = async (req, res) => {
	try {
		const { token } = req.body;
		const userId = req.user?.userId;

		if (!userId) {
			return sendInternalError(res, "User not authenticated");
		}

		// Find and deactivate token
		const fcmToken = await db.fcmToken.findOne({
			userId,
			token,
		});

		if (!fcmToken) {
			return sendSuccess(
				res,
				200,
				"Token not found or already unregistered",
				null,
			);
		}

		fcmToken.isActive = false;
		await fcmToken.save();

		return sendSuccess(res, 200, "FCM token unregistered successfully", null);
	} catch (error) {
		console.error("Error unregistering FCM token:", error);
		return sendInternalError(res, "Failed to unregister FCM token");
	}
};
