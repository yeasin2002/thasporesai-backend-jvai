import { db } from "@/db";
import { sendError, sendSuccess, validatePagination } from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchMyApplications } from "../job-request.validation";

/**
 * Get contractor's own job applications with search and filters
 * GET /api/job-request/my
 */
export const getMyApplications: RequestHandler<
	unknown,
	unknown,
	unknown,
	SearchMyApplications
> = async (req, res) => {
	try {
		const contractorId = req.user?.userId;

		if (!contractorId) {
			return sendError(res, 401, "Unauthorized");
		}

		const { status, page, limit } = req.query;

		// Validate and sanitize pagination
		const {
			page: pageNum,
			limit: limitNum,
			skip,
		} = validatePagination(page, limit);

		// Build base query - always filter by contractor
		const applicationQuery: any = { contractor: contractorId };

		// Filter by application status (matches model: pending, accepted, rejected, offer_sent)
		if (status) {
			applicationQuery.status = status;
		}

		// Get total count for pagination
		const total =
			await db.jobApplicationRequest.countDocuments(applicationQuery);

		// Get paginated applications with populated data
		const applications = await db.jobApplicationRequest
			.find(applicationQuery)
			.populate({
				path: "job",
				populate: [
					{
						path: "customerId",
						select: "full_name email profile_img",
					},
					{
						path: "category",
						select: "name icon",
					},
					{
						path: "location",
						select: "name state coordinates",
					},
				],
			})
			.populate({
				path: "offerId",
				select: "amount timeline description status",
			})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum)
			.lean();

		const totalPages = Math.ceil(total / limitNum);

		return sendSuccess(res, 200, "Your applications retrieved successfully", {
			applications,
			total,
			page: pageNum,
			limit: limitNum,
			totalPages,
		});
	} catch (error) {
		console.error("Get my applications error:", error);
		return sendError(res, 500, "Failed to retrieve your applications");
	}
};
