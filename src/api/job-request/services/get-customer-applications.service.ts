import { db } from "@/db";
import { exceptionErrorHandler, sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchCustomerApplications } from "../job-request.validation";

/**
 * Get all applications for customer's jobs
 * GET /api/job-request/customer/all
 * Supports pagination and filtering by job and status
 */
export const getCustomerApplications: RequestHandler<
  {},
  any,
  any,
  SearchCustomerApplications
> = async (req, res) => {
  try {
    const customerId = req.user?.userId;

    if (!customerId) {
      return sendError(res, 401, "Unauthorized");
    }

    // Extract query parameters
    const { jobId, status, page = "1", limit = "10" } = req.query;

    // Parse pagination
    const pageNum = Number.parseInt(page, 10);
    const limitNum = Number.parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build job filter - get all jobs owned by this customer
    const jobFilter: any = { customerId };
    if (jobId) {
      jobFilter._id = jobId;
    }

    // Find all jobs owned by the customer
    const customerJobs = await db.job.find(jobFilter).select("_id").lean();
    const jobIds = customerJobs.map((job) => job._id);

    if (jobIds.length === 0) {
      return sendSuccess(res, 200, "Applications retrieved successfully", {
        applications: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
      });
    }

    // Build application filter - only contractor requests
    const applicationFilter: any = {
      job: { $in: jobIds },
      sender: "contractor", // Only show contractor-initiated applications
    };

    if (status) {
      // Map old status to new
      const statusMap: Record<string, string> = {
        pending: "requested",
        accepted: "engaged",
        rejected: "cancelled",
        offer_sent: "offered",
      };
      applicationFilter.status = statusMap[status] || status;
    }

    // Get total count
    const total = await db.inviteApplication.countDocuments(applicationFilter);

    // Fetch applications with populated fields
    const applications = await db.inviteApplication
      .find(applicationFilter)
      .populate({
        path: "job",
        select: "title description budget status coverImg location category",
        populate: [
          { path: "location", select: "name state coordinates" },
          { path: "category", select: "name icon description" },
        ],
      })
      .populate({
        path: "contractor",
        select:
          "full_name profile_img email phone bio skills starting_budget hourly_charge category location",
        populate: [
          { path: "category", select: "name icon description" },
          { path: "location", select: "name state coordinates" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, 200, "Applications retrieved successfully", {
      applications,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    return exceptionErrorHandler(error, res, "Failed to retrieve applications");
  }
};
