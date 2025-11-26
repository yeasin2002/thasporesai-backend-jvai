import { db } from "@/db";
import {
	exceptionErrorHandler,
	sendSuccess,
	validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchJob } from "../job.validation";

/**
 * Get Engaged Jobs (Available for Offers)
 * Returns all jobs where the customer has engagement through:
 * 1. Receiving job applications from contractors
 * 2. NO active offers (pending or accepted)
 *
 * This endpoint filters out jobs that already have active offers,
 * since the system enforces "one offer per job" rule.
 *
 * Jobs with rejected or expired offers ARE included, allowing
 * the customer to send new offers to those contractors.
 *
 * @route GET /api/job/engaged
 * @access Private (Customer only)
 */
export const getEngagedJobs: RequestHandler<
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

		// Step 1: Find all jobs owned by this customer
		const customerJobs = await db.job.find({ customerId }).select("_id").lean();
		const customerJobIds = customerJobs.map((job) => job._id);

		if (customerJobIds.length === 0) {
			// Customer has no jobs, return empty result
			return sendSuccess(res, 200, "No engaged jobs found", {
				jobs: [],
				total: 0,
				page: pageNum,
				limit: limitNum,
				totalPages: 0,
			});
		}

		// Step 2: Find jobs that have applications OR offers
		const [jobsWithApplications, jobsWithActiveOffers] = await Promise.all([
			// Jobs that have received applications (contractor requests)
			db.inviteApplication
				.find({
					job: { $in: customerJobIds },
					sender: "contractor", // Only contractor-initiated applications
					status: { $in: ["requested", "engaged"] },
				})
				.distinct("job"),

			// Jobs that have ACTIVE offers (pending or accepted)
			// We exclude these because you can only send one offer per job
			db.offer
				.find({
					job: { $in: customerJobIds },
					status: { $in: ["pending", "accepted"] },
				})
				.distinct("job"),
		]);

		// Convert to strings for easier comparison
		const jobsWithApplicationsIds = jobsWithApplications.map((id) =>
			id.toString(),
		);
		const jobsWithActiveOffersIds = jobsWithActiveOffers.map((id) =>
			id.toString(),
		);

		// Only include jobs that have applications BUT no active offers
		// This allows sending offers to jobs with rejected/expired offers
		const engagedJobIds = jobsWithApplicationsIds.filter(
			(jobId) => !jobsWithActiveOffersIds.includes(jobId),
		);

		if (engagedJobIds.length === 0) {
			// No engaged jobs found
			return sendSuccess(res, 200, "No engaged jobs found", {
				jobs: [],
				total: 0,
				page: pageNum,
				limit: limitNum,
				totalPages: 0,
			});
		}

		// Step 3: Build query for engaged jobs with filters
		const query: any = {
			_id: { $in: engagedJobIds },
			customerId, // Ensure jobs belong to this customer
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

		// Apply status filter
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

		// Step 4: Get jobs with pagination and populate related data
		const [jobs, total] = await Promise.all([
			db.job
				.find(query)
				.populate("category", "name icon description")
				.populate("customerId", "full_name email profile_img phone")
				.populate("location", "name state coordinates")
				.populate("contractorId", "full_name email profile_img skills")
				.skip(skip)
				.limit(limitNum)
				.sort({ createdAt: -1 })
				.lean(),
			db.job.countDocuments(query),
		]);

		// Step 5: Enrich jobs with engagement statistics
		const jobIds = jobs.map((job) => job._id);

		const [applicationCounts, offerCounts] = await Promise.all([
			// Count applications per job (contractor requests only)
			db.inviteApplication.aggregate([
				{
					$match: {
						job: { $in: jobIds },
						sender: "contractor", // Only contractor-initiated applications
					},
				},
				{
					$group: {
						_id: "$job",
						totalApplications: { $sum: 1 },
						pendingApplications: {
							$sum: { $cond: [{ $eq: ["$status", "requested"] }, 1, 0] },
						},
						acceptedApplications: {
							$sum: { $cond: [{ $eq: ["$status", "engaged"] }, 1, 0] },
						},
					},
				},
			]),

			// Count offers per job (including rejected/expired for history)
			db.offer.aggregate([
				{ $match: { job: { $in: jobIds } } },
				{
					$group: {
						_id: "$job",
						totalOffers: { $sum: 1 },
						pendingOffers: {
							$sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
						},
						acceptedOffers: {
							$sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
						},
						rejectedOffers: {
							$sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
						},
						expiredOffers: {
							$sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
						},
					},
				},
			]),
		]);

		// Create lookup maps for quick access
		const applicationMap = new Map(
			applicationCounts.map((item) => [item._id.toString(), item]),
		);
		const offerMap = new Map(
			offerCounts.map((item) => [item._id.toString(), item]),
		);

		// Step 6: Add engagement statistics to each job
		const enrichedJobs = jobs.map((job) => {
			const jobId = job._id.toString();
			const appStats = applicationMap.get(jobId) || {
				totalApplications: 0,
				pendingApplications: 0,
				acceptedApplications: 0,
			};
			const offerStats = offerMap.get(jobId) || {
				totalOffers: 0,
				pendingOffers: 0,
				acceptedOffers: 0,
				rejectedOffers: 0,
				expiredOffers: 0,
			};

			return {
				...job,
				engagement: {
					applications: {
						total: appStats.totalApplications,
						pending: appStats.pendingApplications,
						accepted: appStats.acceptedApplications,
					},
					offers: {
						total: offerStats.totalOffers,
						pending: offerStats.pendingOffers,
						accepted: offerStats.acceptedOffers,
						rejected: offerStats.rejectedOffers,
						expired: offerStats.expiredOffers,
					},
					hasApplications: appStats.totalApplications > 0,
					hasOffers: offerStats.totalOffers > 0,
					canSendOffer: true, // All jobs in this list can receive offers
				},
			};
		});

		const totalPages = Math.ceil(total / limitNum);

		return sendSuccess(res, 200, "Engaged jobs retrieved successfully", {
			jobs: enrichedJobs,
			total,
			page: pageNum,
			limit: limitNum,
			totalPages,
		});
	} catch (error) {
		return exceptionErrorHandler(error, res, "Failed to retrieve engaged jobs");
	}
};
