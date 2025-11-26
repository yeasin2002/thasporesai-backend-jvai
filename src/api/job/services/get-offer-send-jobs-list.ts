import { db } from "@/db";
import {
	exceptionErrorHandler,
	sendSuccess,
	validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchJob } from "../job.validation";

/**
 * Get Jobs with Pending Offers (Offer Sent Jobs)
 * Returns all jobs where the customer has sent offers that are pending contractor response.
 *
 * This endpoint shows:
 * - Jobs where customer sent offers (status: "pending")
 * - Contractor details who received the offer
 * - Offer details including offerId for cancellation
 * - Job must be in "open" status (not in_progress or completed)
 *
 * Use case: Customer wants to see all jobs where they're waiting for contractor response
 *
 * @route GET /api/job/pending-jobs
 * @access Private (Customer only)
 */
export const getOfferSendJobsList: RequestHandler<
	unknown,
	unknown,
	unknown,
	SearchJob
> = async (req, res) => {
	try {
		const customerId = req.user?.userId;

		if (!customerId) {
			return exceptionErrorHandler(
				new Error("Unauthorized"),
				res,
				"Unauthorized access",
			);
		}

		const {
			search,
			category,
			status,
			minBudget,
			maxBudget,
			location,
			page,
			limit,
		} = req.query;

		// Validate and sanitize pagination
		const {
			page: pageNum,
			limit: limitNum,
			skip,
		} = validatePagination(page, limit);

		// Step 1: Find all pending offers for this customer's jobs
		const pendingOffers = await db.offer
			.find({
				customer: customerId,
				status: "pending",
			})
			.lean();

		if (pendingOffers.length === 0) {
			return sendSuccess(res, 200, "No pending offers found", {
				jobs: [],
				total: 0,
				page: pageNum,
				limit: limitNum,
				totalPages: 0,
			});
		}

		// Extract job IDs from offers
		const jobIdsWithPendingOffers = pendingOffers.map((offer) => offer.job);

		// Step 2: Build query for jobs with pending offers
		const query: any = {
			_id: { $in: jobIdsWithPendingOffers },
			customerId, // Ensure jobs belong to this customer
			status: { $nin: ["in_progress", "completed", "cancelled"] }, // Exclude in_progress jobs
		};

		// Apply search filter
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		// Apply category filter
		if (category) {
			query.category = category;
		}

		// Apply status filter (if provided)
		if (status) {
			query.status = status;
		}

		// Apply budget range filter
		if (minBudget || maxBudget) {
			query.budget = {};
			if (minBudget) query.budget.$gte = Number.parseInt(minBudget, 10);
			if (maxBudget) query.budget.$lte = Number.parseInt(maxBudget, 10);
		}

		// Apply location filter
		if (location) {
			query.location = location;
		}

		// Step 3: Get jobs with pagination and populate related data
		const [jobs, total] = await Promise.all([
			db.job
				.find(query)
				.populate("category", "name icon description")
				.populate("customerId", "full_name email profile_img phone")
				.populate("location", "name state coordinates")
				.skip(skip)
				.limit(limitNum)
				.sort({ createdAt: -1 })
				.lean(),
			db.job.countDocuments(query),
		]);

		// Step 4: Create offer lookup map
		const offerMap = new Map(
			pendingOffers.map((offer) => [offer.job.toString(), offer]),
		);

		// Step 5: Enrich jobs with offer and contractor details
		const enrichedJobs = await Promise.all(
			jobs.map(async (job) => {
				const jobId = job._id.toString();
				const offer = offerMap.get(jobId);

				if (!offer) {
					return {
						...job,
						offer: null,
						contractor: null,
					};
				}

				// Fetch contractor details
				const contractor = await db.user
					.findById(offer.contractor)
					.select("full_name email profile_img phone skills")
					.lean();

				return {
					...job,
					offer: {
						offerId: offer._id,
						amount: offer.amount,
						timeline: offer.timeline,
						description: offer.description,
						status: "pending" as const,
						createdAt: (offer as any).createdAt,
						expiresAt: offer.expiresAt,
						canCancel: true,
					},
					contractor: contractor
						? {
								_id: contractor._id,
								full_name: contractor.full_name,
								email: contractor.email,
								profile_img: contractor.profile_img,
								phone: contractor.phone,
								skills: contractor.skills,
							}
						: null,
				};
			}),
		);

		const totalPages = Math.ceil(total / limitNum);

		return sendSuccess(res, 200, "Pending offer jobs retrieved successfully", {
			jobs: enrichedJobs,
			total,
			page: pageNum,
			limit: limitNum,
			totalPages,
		});
	} catch (error) {
		return exceptionErrorHandler(
			error,
			res,
			"Failed to retrieve pending offer jobs",
		);
	}
};
