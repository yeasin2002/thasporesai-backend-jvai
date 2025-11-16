import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get customer's sent invites
 * GET /api/job-invite/sent
 */
export const getSentInvites: RequestHandler = async (req, res) => {
	try {
		const customerId = req.user?.userId;
		const { jobId, status, page = "1", limit = "10" } = req.query;

		if (!customerId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Build query
		const query: any = { customer: customerId };

		if (jobId) {
			query.job = jobId;
		}

		if (status) {
			query.status = status;
		}

		// Pagination
		const pageNum = Number.parseInt(page as string, 10);
		const limitNum = Number.parseInt(limit as string, 10);
		const skip = (pageNum - 1) * limitNum;

		// Get total count
		const total = await db.jobInvite.countDocuments(query);

		// Get invites
		const invites = await db.jobInvite
			.find(query)
			.populate("job", "title description budget location category status")
			.populate("contractor", "full_name email profile_img skills")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum);

		return sendSuccess(res, 200, "Invites retrieved successfully", {
			invites,
			total,
			page: pageNum,
			limit: limitNum,
			totalPages: Math.ceil(total / limitNum),
		});
	} catch (error) {
		console.error("Get sent invites error:", error);
		return sendError(res, 500, "Failed to retrieve invites");
	}
};
