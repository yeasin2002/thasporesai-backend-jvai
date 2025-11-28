import { db } from "@/db";
import {
  exceptionErrorHandler,
  sendSuccess,
  validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchOfferSendJob } from "../job.validation";

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
 * Query Parameters:
 * - page: Page number for pagination
 * - limit: Items per page
 * - contractorId: (Optional) Filter by specific contractor
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
  SearchOfferSendJob
> = async (req, res) => {
  try {
    const customerId = req.user?.userId;

    if (!customerId) {
      return exceptionErrorHandler(
        new Error("Unauthorized"),
        res,
        "Unauthorized access"
      );
    }

    const { page, limit, contractorId } = req.query;

    // Validate and sanitize pagination
    const {
      page: pageNum,
      limit: limitNum,
      skip,
    } = validatePagination(page, limit);

    // Step 1: Build offer query
    const offerQuery: Record<string, any> = {
      customer: customerId,
      status: "pending",
    };

    // Filter by contractor if provided
    if (contractorId) {
      offerQuery.contractor = contractorId;
    }

    // Find all pending offers for this customer's jobs
    const pendingOffers = await db.offer.find(offerQuery).lean();

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
    const query: Record<string, any> = {
      _id: { $in: jobIdsWithPendingOffers },
      customerId, // Ensure jobs belong to this customer
      status: { $nin: ["in_progress", "completed", "cancelled"] }, // Exclude in_progress jobs
    };

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
      pendingOffers.map((offer) => [offer.job.toString(), offer])
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
      })
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
      "Failed to retrieve pending offer jobs"
    );
  }
};
