import { db } from "@/db";
import { exceptionErrorHandler, sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get contractor's current jobs (offered or assigned status)
 * GET /api/job/my/jobs-status
 *
 * Returns jobs where contractor has been offered work or assigned to work
 * Based on invite-application status: "offered" or "assigned"
 */
export const myCurrentJobList: RequestHandler = async (req, res) => {
  try {
    const contractorId = req.user?.userId;
    const { status, page = "1", limit = "10" } = req.query;

    if (!contractorId) {
      return sendError(res, 401, "Unauthorized");
    }

    // Parse pagination
    const pageNum = Number.parseInt(page as string, 10);
    const limitNum = Number.parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query for invite-application
    const inviteAppQuery: Record<string, any> = {
      contractor: contractorId,
    };

    // Filter by status if provided
    if (status) {
      inviteAppQuery.status = status;
    } else {
      // Default: show both offered and assigned
      inviteAppQuery.status = { $in: ["offered", "assigned"] };
    }

    // Get total count
    const totalCount =
      await db.inviteApplication.countDocuments(inviteAppQuery);

    // Get invite-applications with pagination
    const inviteApplications = await db.inviteApplication
      .find(inviteAppQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("job")
      .populate("customer", "full_name email phone profile_img")
      .populate("contractor", "full_name email phone profile_img")
      .lean();

    // Extract job IDs
    const jobIds = inviteApplications.map((app) => app.job);

    // Get full job details with populated fields
    const jobs = await db.job
      .find({ _id: { $in: jobIds } })
      .populate("category", "name")
      .populate("location", "name")
      .populate("customerId", "full_name email phone profile_img")
      .lean();

    // Create a map of jobs by ID for easy lookup
    const jobMap = new Map(jobs.map((job) => [job._id.toString(), job]));

    // Combine invite-application data with job data
    const result = inviteApplications.map((app: any) => {
      const job = jobMap.get(app.job._id.toString());

      return {
        inviteApplication: {
          _id: app._id,
          status: app.status,
          sender: app.sender,
          offerId: app.offerId,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        },
        job: job || app.job,
        customer: app.customer,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return sendSuccess(res, 200, "Current jobs retrieved successfully", {
      jobs: result,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching current jobs:", error);
    return exceptionErrorHandler(error, res, "Failed to fetch current jobs");
  }
};
