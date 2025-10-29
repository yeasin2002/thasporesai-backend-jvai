import { db } from "@/db";
import { getReviewStatsWithReviews, sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

// Get Current User (Me) Handler
export const me: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const user = await db.user
      .findById(userId)
      .select("-password -refreshTokens -otp")
      .populate("location")
      .populate("category");

    if (!user) return sendError(res, 404, "User not found");

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
    console.error("Get user error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
