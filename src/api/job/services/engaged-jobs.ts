import { db } from "@/db";
import {
	exceptionErrorHandler,
	sendSuccess,
	validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";

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
 * Query Parameters:
 * - status: Filter by job status (open, in_progress, completed, cancelled)
 * - contractorId: Exclude jobs where this contractor has been invited or applied
 * - page: Page number for pagination
 * - limit: Items per page
 *
 * @route GET /api/job/engaged
 * @access Private (Customer only)
 */
export const getEngagedJobs: RequestHandler = async (req, res) => {
	try {
		const customerId = req.user?.userId;

		if (!customerId) {
			return exceptionErrorHandler(
				new Error("Unauthorized"),
				res,
				"Unauthorized access",
			);
		}

		const { status, contractorId, page, limit } = req.query as {
			status?: string;
			contractorId?: string;
			page?: string;
			limit?: string;
		};

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
			// Include: requested (applied), engaged (mutual interest), offered (offer sent)
			// Exclude: invited (customer initiated), cancelled (rejected/cancelled)
			db.inviteApplication
				.find({
					job: { $in: customerJobIds },
					sender: "contractor", // Only contractor-initiated applications
					status: { $in: ["requested", "engaged", "offered"] }, // Active engagement statuses
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

		// Apply status filter
		if (status) {
			query.status = status;
		}

		// Apply contractorId filter - exclude jobs where this contractor has been invited or applied
		if (contractorId && typeof contractorId === "string") {
			// Get jobs where this contractor has any engagement
			const contractorEngagedJobIds = await db.inviteApplication
				.find({
					contractor: contractorId,
					customer: customerId,
					status: { $in: ["invited", "requested", "engaged", "offered"] },
				})
				.distinct("job");

			// Exclude these jobs from the results
			if (contractorEngagedJobIds.length > 0) {
				query._id = {
					$in: engagedJobIds.filter(
						(id) =>
							!contractorEngagedJobIds
								.map((cid) => cid.toString())
								.includes(id),
					),
				};
			}
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
						requestedApplications: {
							$sum: { $cond: [{ $eq: ["$status", "requested"] }, 1, 0] },
						},
						engagedApplications: {
							$sum: { $cond: [{ $eq: ["$status", "engaged"] }, 1, 0] },
						},
						offeredApplications: {
							$sum: { $cond: [{ $eq: ["$status", "offered"] }, 1, 0] },
						},
						cancelledApplications: {
							$sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
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
				requestedApplications: 0,
				engagedApplications: 0,
				offeredApplications: 0,
				cancelledApplications: 0,
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
						requested: appStats.requestedApplications, // Contractor applied
						engaged: appStats.engagedApplications, // Mutual interest
						offered: appStats.offeredApplications, // Offer sent
						cancelled: appStats.cancelledApplications, // Rejected/cancelled
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
