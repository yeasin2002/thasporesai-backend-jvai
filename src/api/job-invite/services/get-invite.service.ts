import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get single invite details
 * GET /api/job-invite/:inviteId
 */
export const getInvite: RequestHandler = async (req, res) => {
	try {
		const inviteId = req.params.inviteId;
		const userId = req.user?.userId;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Find invite
		const invite = await db.inviteApplication
			.findById(inviteId)
			.populate("job", "title description budget location category status")
			.populate("customer", "full_name email profile_img")
			.populate("contractor", "full_name email profile_img skills");

		if (!invite) {
			return sendError(res, 404, "Invite not found");
		}

		// Verify user is involved in this invite
		const isCustomer = invite.customer._id.toString() === userId;
		const isContractor = invite.contractor._id.toString() === userId;

		if (!isCustomer && !isContractor) {
			return sendError(res, 403, "You are not authorized to view this invite");
		}

		return sendSuccess(res, 200, "Invite retrieved successfully", invite);
	} catch (error) {
		console.error("Get invite error:", error);
		return sendError(res, 500, "Failed to retrieve invite");
	}
};
