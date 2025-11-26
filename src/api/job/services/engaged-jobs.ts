import { db } from "@/db";
import {
	exceptionErrorHandler,
	sendSuccess,
	validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchJob } from "../job.validation";

/**
 * Get Engaged Jobs (For Offer Management)
 * Returns all jobs where the customer has engagement through:
 * 1. Receiving job applications from contractors
 * 2. Having pending offers (that can be cancelled)
 *
 * This endpoint INCLUDES jobs with pending offers so customers can:
 * - View offer details (including offerId)
 * - Cancel pending offers if needed
 * - Send new offers after cancellation
 *
 * This endpoint EXCLUDES jobs with accepted offers (already assigned).
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

		// Step 2: Find jobs that have applications OR pending offers
		const [
			jobsWithApplications,
			jobsWithAcceptedOffers,
			jobsWithPendingOffers,
		] = await Promise.all([
			// Jobs that have received applications
			db.jobApplicationRequest
				.find({ job: { $in: customerJobIds } })
				.distinct("job"),

			// Jobs that have ACCEPTED offers (exclude these - job already assigned)
			db.offer
				.find({
					job: { $in: customerJobIds },
					status: "accepted",
				})
				.distinct("job"),

			// Jobs that have PENDING offers (include these - customer can cancel)
			db.offer
				.find({
					job: { $in: customerJobIds },
					status: "pending",
				})
				.distinct("job"),
		]);

		// Convert to strings for easier comparison
		const jobsWithApplicationsIds = jobsWithApplications.map((id) =>
			id.toString(),
		);
		const jobsWithAcceptedOffersIds = jobsWithAcceptedOffers.map((id) =>
			id.toString(),
		);
		const jobsWithPendingOffersIds = jobsWithPendingOffers.map((id) =>
			id.toString(),
		);

		// Include jobs that have:
		// 1. Applications (with or without pending offers)
		// 2. Pending offers (even without applications)
		// BUT exclude jobs with accepted offers (already assigned)
		const engagedJobIds = [
			...new Set([...jobsWithApplicationsIds, ...jobsWithPendingOffersIds]),
		].filter((jobId) => !jobsWithAcceptedOffersIds.includes(jobId));

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
				.populate("offerId", "_id amount")
				.skip(skip)
				.limit(limitNum)
				.sort({ createdAt: -1 })
				.lean(),
			db.job.countDocuments(query),
		]);

		// Step 5: Enrich jobs with engagement statistics
		const jobIds = jobs.map((job) => job._id);

		const [applicationCounts, offerCounts, offerDetails] = await Promise.all([
			// Count applications per job
			db.jobApplicationRequest.aggregate([
				{ $match: { job: { $in: jobIds } } },
				{
					$group: {
						_id: "$job",
						totalApplications: { $sum: 1 },
						pendingApplications: {
							$sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
						},
						acceptedApplications: {
							$sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
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

			// Get offer details for each job (including offerId for cancellation)
			db.offer
				.find({ job: { $in: jobIds } })
				.lean(),
		]);

		// Create lookup maps for quick access
		const applicationMap = new Map(
			applicationCounts.map((item) => [item._id.toString(), item]),
		);
		const offerMap = new Map(
			offerCounts.map((item) => [item._id.toString(), item]),
		);

		// Create offer details map (group by job)
		const offerDetailsMap = new Map<string, any[]>();
		for (const offer of offerDetails) {
			const jobId = offer.job.toString();
			if (!offerDetailsMap.has(jobId)) {
				offerDetailsMap.set(jobId, []);
			}
			offerDetailsMap.get(jobId)?.push(offer);
		}

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

			// Get offer details for this job
			const jobOffers = offerDetailsMap.get(jobId) || [];

			// Find the most recent pending offer (for cancellation)
			const pendingOffer = jobOffers.find(
				(offer) => offer.status === "pending",
			);

			// Get all offers with their details
			const offersWithDetails = jobOffers.map((offer) => ({
				offerId: offer._id,
				status: offer.status,
				amount: offer.amount,
				timeline: offer.timeline,
				description: offer.description,
				createdAt: offer.createdAt,
				expiresAt: offer.expiresAt,
			}));

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

					// Offer details for frontend actions
					currentOffer: pendingOffer
						? {
								offerId: pendingOffer._id,
								status: pendingOffer.status,
								amount: pendingOffer.amount,
								timeline: pendingOffer.timeline,
								createdAt: pendingOffer.createdAt,
								expiresAt: pendingOffer.expiresAt,
								canCancel: true, // Pending offers can be cancelled
							}
						: null,

					// All offers history (for reference)
					allOffers: offersWithDetails,
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
