import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import { validatePagination } from "@/helpers/validate-pagination";
import type { RequestHandler } from "express";

/**
 * Get paginated list of withdrawal requests with optional filters
 */
export const getWithdrawalRequests: RequestHandler = async (req, res) => {
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
    const total = await db.withdrawalRequest.countDocuments(query);

    // Get requests with pagination
    const requests = await db.withdrawalRequest
      .find(query)
      .populate("contractor", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return sendSuccess(res, 200, "Withdrawal requests retrieved successfully", {
      requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error getting withdrawal requests:", error);
    return sendInternalError(res, "Failed to get withdrawal requests", error);
  }
};
