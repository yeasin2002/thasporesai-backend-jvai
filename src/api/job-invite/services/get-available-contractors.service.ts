import { db } from "@/db";
import {
	exceptionErrorHandler,
	sendSuccess,
	validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get Available Contractors for Job Invite
 * Returns contractors who:
 * 1. Haven't applied to this job
 * 2. Haven't been invited to this job
 *
 * This helps customers find contractors they can invite
 *
 * @route GET /api/job-invite/available/:jobId
 * @access Private (Customer only)
 */
export const getAvailableContractors: RequestHandler = async (req, res) => {
	try {
		const jobId = req.params.jobId;
		const customerId = req.user?.userId;
		const { search, category, location, minBudget, maxBudget, page, limit } =
			req.query;

		if (!customerId) {
			return exceptionErrorHandler(
				new Error("Unauthorized"),
				res,
				"Unauthorized access",
			);
		}

		// Validate and sanitize pagination
		const {
			page: pageNum,
			limit: limitNum,
			skip,
		} = validatePagination(
			page as string | undefined,
			limit as string | undefined,
		);

		// Check if job exists and belongs to customer
		const job = await db.job.findById(jobId);
		if (!job) {
			return exceptionErrorHandler(
				new Error("Job not found"),
				res,
				"Job not found",
			);
		}

		if (job.customerId.toString() !== customerId) {
			return exceptionErrorHandler(
				new Error("Forbidden"),
				res,
				"You can only view available contractors for your own jobs",
			);
		}

		// Get contractors who have already applied or been invited
		// Using the unified model, we check for any existing application/invite
		const existingApplications = await db.inviteApplication
			.find({
				job: jobId,
				status: { $in: ["invited", "requested", "engaged", "offered"] },
			})
			.distinct("contractor");

		// Combine excluded contractor IDs
		const excludedContractorIds = existingApplications.map((id) =>
			id.toString(),
		);

		// Step 4: Build query for available contractors
		const query: any = {
			role: "contractor",
			isSuspend: false,
			_id: { $nin: excludedContractorIds }, // Exclude applied and invited contractors
		};

		// Apply search filter
		if (search) {
			query.$or = [
				{ full_name: { $regex: search, $options: "i" } },
				{ bio: { $regex: search, $options: "i" } },
				{ skills: { $regex: search, $options: "i" } },
			];
		}

		// Apply category filter (contractors with matching skills/categories)
		if (category) {
			query.category = category;
		}

		// Apply location filter
		if (location) {
			query.location = location;
		}

		// Apply budget filter (contractors within budget range)
		if (minBudget || maxBudget) {
			query.$and = query.$and || [];
			if (minBudget && typeof minBudget === "string") {
				query.$and.push({
					$or: [
						{ starting_budget: { $lte: Number.parseInt(minBudget, 10) } },
						{ hourly_charge: { $lte: Number.parseInt(minBudget, 10) } },
					],
				});
			}
			if (maxBudget && typeof maxBudget === "string") {
				query.$and.push({
					$or: [
						{ starting_budget: { $gte: Number.parseInt(maxBudget, 10) } },
						{ hourly_charge: { $gte: Number.parseInt(maxBudget, 10) } },
					],
				});
			}
		}

		// Step 5: Get available contractors with pagination
		const [contractors, total] = await Promise.all([
			db.user
				.find(query)
				.select(
					"full_name email profile_img bio skills starting_budget hourly_charge category location",
				)
				.populate("category", "name icon")
				.populate("location", "name state")
				.skip(skip)
				.limit(limitNum)
				.sort({ createdAt: -1 })
				.lean(),
			db.user.countDocuments(query),
		]);

		const totalPages = Math.ceil(total / limitNum);

		return sendSuccess(
			res,
			200,
			"Available contractors retrieved successfully",
			{
				contractors,
				total,
				page: pageNum,
				limit: limitNum,
				totalPages,
				excludedCount: excludedContractorIds.length,
				jobInfo: {
					id: job._id,
					title: job.title,
					budget: job.budget,
				},
			},
		);
	} catch (error) {
		return exceptionErrorHandler(
			error,
			res,
			"Failed to retrieve available contractors",
		);
	}
};
