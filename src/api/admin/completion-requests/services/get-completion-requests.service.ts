import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import { validatePagination } from "@/helpers/validate-pagination";
import type { RequestHandler } from "express";

/**
 * Get paginated list of completion requests with optional filters
 */
export const getCompletionRequests: RequestHandler = async (req, res) => {
  try {
    const { status = "pending", page = "1", limit = "20" } = req.query;

    // Validate pagination
    const { page: pageNum, limit: limitNum } = validatePagination(
      page as string,
      limit as string
    );

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Get total count
    const total = await db.completionRequest.countDocuments(query);

    // Get requests with pagination
    const requests = await db.completionRequest
      .find(query)
      .populate("job", "title budget status")
      .populate("offer", "amount contractorPayout totalCharge")
      .populate("customer", "firstName lastName email")
      .populate("contractor", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return sendSuccess(res, 200, "Completion requests retrieved successfully", {
      requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error getting completion requests:", error);
    return sendInternalError(res, "Failed to get completion requests", error);
  }
};
