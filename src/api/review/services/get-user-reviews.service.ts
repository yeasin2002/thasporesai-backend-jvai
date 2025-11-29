import { db } from "@/db";
import {
  exceptionErrorHandler,
  sendError,
  sendSuccess,
  validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchReview } from "../review.validation";

/**
 * Get all reviews for a specific user
 * GET /api/review/user/:userId
 */
export const getUserReviews: RequestHandler<
  { userId: string },
  unknown,
  unknown,
  SearchReview
> = async (req, res) => {
  try {
    const { userId } = req.params;
    const { minRating, maxRating, page, limit } = req.query;

    // Check if user exists
    const user = await db.user.findById(userId);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    const {
      page: pageNum,
      limit: limitNum,
      skip,
    } = validatePagination(page, limit);

    // Build query
    const query: any = { receiverId: userId };

    // Filter by rating range
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = Number.parseInt(minRating, 10);
      if (maxRating) query.rating.$lte = Number.parseInt(maxRating, 10);
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      db.review
        .find(query)
        .populate("senderId", "full_name profile_img email role")
        .populate("job_id", "title budget status")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      db.review.countDocuments(query),
    ]);

    // Calculate review statistics
    const { calculateReviewStats } = await import("@/helpers");
    const stats = await calculateReviewStats(userId);

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, 200, "User reviews retrieved successfully", {
      reviews,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      average: stats.average,
      ratingDistribution: stats.ratingDistribution,
    });
  } catch (error) {
    return exceptionErrorHandler(error, res, "Failed to retrieve user reviews");
  }
};
