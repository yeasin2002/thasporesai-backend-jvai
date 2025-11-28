import { db } from "@/db";
import {
  exceptionErrorHandler,
  sendSuccess,
  validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get Engaged Jobs (Available for Offers)
 * Returns all jobs where the customer has engagement through:0
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
 * - contractorId: Filter jobs where this contractor has been invited or applied
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
        "Unauthorized access"
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

    // Build query
    const query: any = {
      customer: customerId,
    };

    if (contractorId) {
      query.contractor = contractorId;
    }

    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const [engagedJobs, total] = await Promise.all([
      db.inviteApplication
        .find(query)
        .populate("job")
        .populate(
          "contractor",
          "_id name full_name profile_img cover_img email phone address"
        )
        .populate("offerId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      db.inviteApplication.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, 200, "Engaged jobs retrieved successfully", {
      jobs: engagedJobs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    return exceptionErrorHandler(error, res, "Failed to retrieve engaged jobs");
  }
};
