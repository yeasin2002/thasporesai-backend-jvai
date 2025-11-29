import { db } from "@/db";
import { exceptionErrorHandler, sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { CreateReview } from "../review.validation";

/**
 * Create a new review
 * POST /api/review
 */
export const createReview: RequestHandler<{}, unknown, CreateReview> = async (
  req,
  res
) => {
  try {
    const senderId = req.user?.userId;
    if (!senderId) {
      return sendError(res, 401, "Unauthorized");
    }

    const { receiverId, job_id, rating, rating_message } = req.body;

    // Check if user is trying to review themselves
    if (receiverId === senderId) {
      return sendError(res, 400, "You cannot review yourself");
    }

    // Check if receiver exists
    const receiver = await db.user.findById(receiverId);
    if (!receiver) {
      return sendError(res, 404, "User not found");
    }

    // If job_id provided, check if already reviewed for this job
    if (job_id) {
      const existingReview = await db.review.findOne({
        senderId,
        receiverId,
        job_id,
      });

      if (existingReview) {
        return sendError(
          res,
          400,
          "You have already reviewed this user for this job"
        );
      }
    }

    // Create review
    const review = await db.review.create({
      senderId,
      receiverId,
      job_id,
      rating,
      rating_message,
    });

    // Populate the review
    const populatedReview = await db.review
      .findById(review._id)
      .populate("senderId", "full_name profile_img email role")
      .populate("receiverId", "full_name profile_img email role")
      .populate("job_id", "title budget status");

    return sendSuccess(
      res,
      201,
      "Review created successfully",
      populatedReview
    );
  } catch (error) {
    return exceptionErrorHandler(error, res, "Failed to create review");
  }
};
