import { db } from "@/db";
import {
  exceptionErrorHandler,
  getReviewStatsWithReviews,
  sendError,
  sendSuccess,
} from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get a single user by ID with full details
 * GET /api/user/:id
 */
export const getSingleUser: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // Find user with populated fields
    const user = await db.user
      .findById(id)
      .select("-password -refreshTokens -otp")
      .populate("category", "name icon description")
      .populate("location", "name state coordinates")
      .populate("experience")
      .populate("work_samples")
      .populate("certifications")
      .populate("job", "title budget status");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Get review statistics for contractors
    let reviewStats = null;
    if (user.role === "contractor") {
      reviewStats = await getReviewStatsWithReviews(
        (user._id as any).toString(),
        5
      );
    }

    // Convert user to plain object and add review stats
    const userObj: any = user.toObject();
    delete userObj.review; // Remove the review array reference

    return sendSuccess(res, 200, "User retrieved successfully", {
      ...userObj,
      ...(reviewStats && { review: reviewStats }),
    });
  } catch (error) {
    return exceptionErrorHandler(error, res, "Failed to retrieve user");
  }
};
