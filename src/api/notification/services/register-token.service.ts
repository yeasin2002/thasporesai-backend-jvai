import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { RegisterFcmToken } from "../notification.validation";

/**
 * Register FCM device token for push notifications
 * Updates existing token if device already registered
 */
export const registerToken: RequestHandler<{}, any, RegisterFcmToken> = async (
	req,
	res,
) => {
	try {
		const { token, deviceId, deviceType } = req.body;
		const userId = req.user?.userId;

		if (!userId) {
			return sendInternalError(res, "User not authenticated", { userId });
		}

		// Check if token already exists for this device
		const existingToken = await db.fcmToken.findOne({
			userId,
			deviceId,
		});

		if (existingToken) {
			// Update existing token
			existingToken.token = token;
			existingToken.deviceType = deviceType;
			existingToken.isActive = true;
			existingToken.lastUsed = new Date();
			await existingToken.save();

			return sendSuccess(res, 200, "FCM token updated successfully", {
				token: existingToken.token,
				deviceId: existingToken.deviceId,
				deviceType: existingToken.deviceType,
			});
		}

		// Create new token
		const fcmToken = await db.fcmToken.create({
			userId,
			token,
			deviceId,
			deviceType,
			isActive: true,
			lastUsed: new Date(),
		});

		return sendSuccess(res, 200, "FCM token registered successfully", {
			token: fcmToken.token,
			deviceId: fcmToken.deviceId,
			deviceType: fcmToken.deviceType,
		});
	} catch (error) {
		console.error("Error registering FCM token:", error);
		return sendInternalError(res, "Failed to register FCM token", error);
	}
};
