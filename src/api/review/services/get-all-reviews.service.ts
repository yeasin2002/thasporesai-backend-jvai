import { db } from "@/db";
import {
  exceptionErrorHandler,
  sendSuccess,
  validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchReview } from "../review.validation";

/**
 * Get all reviews with filters and pagination
 * GET /api/review
 */
export const getAllReviews: RequestHandler<
  unknown,
  unknown,
  unknown,
  SearchReview
> = async (req, res) => {
  try {
    const { senderId, receiverId, job_id, minRating, maxRating, page, limit } =
      req.query;

    // Validate and sanitize pagination
    const {
      page: pageNum,
      limit: limitNum,
      skip,
    } = validatePagination(page, limit);

    // Build query
    const query: any = {};

    if (senderId) query.senderId = senderId;
    if (receiverId) query.receiverId = receiverId;
    if (job_id) query.job_id = job_id;

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
        .populate("receiverId", "full_name profile_img email role")
        .populate("job_id", "title budget status")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      db.review.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Calculate statistics if filtering by receiver
    let stats = null;
    if (receiverId) {
      const { calculateReviewStats } = await import("@/helpers");
      stats = await calculateReviewStats(receiverId);
    }

    return sendSuccess(res, 200, "Reviews retrieved successfully", {
      reviews,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      ...(stats && {
        average: stats.average,
        ratingDistribution: stats.ratingDistribution,
      }),
    });
  } catch (error) {
    return exceptionErrorHandler(error, res, "Failed to retrieve reviews");
  }
};
