import { db } from "@/db";
import { getUserProfile, sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { UpdateProfile } from "../../users.validation";

/**
 * Update user profile
 * PATCH /api/user/me
 * Allows customers and contractors to update their profile information
 * Supports partial updates - only send fields you want to update
 */
export const updateProfile: RequestHandler<{}, unknown, UpdateProfile> = async (
	req,
	res,
) => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Get current user to check role
		const currentUser = await db.user.findById(userId).select("role");
		if (!currentUser) {
			return sendError(res, 404, "User not found");
		}

		const updateData: Record<string, any> = { ...req.body };

		// Remove empty or undefined fields to support partial updates
		for (const key of Object.keys(updateData)) {
			if (
				updateData[key] === undefined ||
				updateData[key] === null ||
				updateData[key] === ""
			) {
				delete updateData[key];
			}
		}

		// If no fields to update, return error
		if (Object.keys(updateData).length === 0) {
			return sendError(res, 400, "No fields to update");
		}

		// Validate category and location IDs if provided
		if (updateData.category && updateData.category.length > 0) {
			const categories = await db.category.find({
				_id: { $in: updateData.category },
			});
			if (categories.length !== updateData.category.length) {
				return sendError(res, 400, "One or more categories not found");
			}
		}

		if (updateData.location && updateData.location.length > 0) {
			const locations = await db.location.find({
				_id: { $in: updateData.location },
			});
			if (locations.length !== updateData.location.length) {
				return sendError(res, 400, "One or more locations not found");
			}
		}

		// Validate experience IDs if provided
		if (updateData.experience && updateData.experience.length > 0) {
			const experiences = await db.experience.find({
				_id: { $in: updateData.experience },
			});
			if (experiences.length !== updateData.experience.length) {
				return sendError(res, 400, "One or more experiences not found");
			}
		}

		// Validate work sample IDs if provided
		if (updateData.work_samples && updateData.work_samples.length > 0) {
			const workSamples = await db.workSample.find({
				_id: { $in: updateData.work_samples },
			});
			if (workSamples.length !== updateData.work_samples.length) {
				return sendError(res, 400, "One or more work samples not found");
			}
		}

		// Validate certification IDs if provided
		if (updateData.certifications && updateData.certifications.length > 0) {
			const certifications = await db.certification.find({
				_id: { $in: updateData.certifications },
			});
			if (certifications.length !== updateData.certifications.length) {
				return sendError(res, 400, "One or more certifications not found");
			}
		}

		// Contractor-specific field validation
		if (currentUser.role !== "contractor") {
			// Remove contractor-specific fields if user is not a contractor
			const contractorFields = [
				"skills",
				"experience",
				"work_samples",
				"starting_budget",
				"certifications",
				"hourly_charge",
				"category",
			];
			for (const field of contractorFields) {
				delete updateData[field];
			}

			// If all fields were contractor-specific, return error
			if (Object.keys(updateData).length === 0) {
				return sendError(res, 403, "Only contractors can update these fields");
			}
		}

		// Prevent updating sensitive fields
		const protectedFields = [
			"password",
			"refreshTokens",
			"otp",
			"role",
			"is_verified",
			"isSuspend",
			"_id",
			"createdAt",
			"updatedAt",
		];
		for (const field of protectedFields) {
			delete updateData[field];
		}

		// Update user profile
		await db.user.findByIdAndUpdate(
			userId,
			{ $set: updateData },
			{ new: true, runValidators: true },
		);

		// Fetch updated profile using the shared helper
		const updatedProfile = await getUserProfile(userId, 5);

		if (!updatedProfile) {
			return sendError(res, 404, "User not found after update");
		}

		return sendSuccess(
			res,
			200,
			"Profile updated successfully",
			updatedProfile,
		);
	} catch (error) {
		console.error("Update profile error:", error);
		return sendError(res, 500, "Failed to update profile");
	}
};
