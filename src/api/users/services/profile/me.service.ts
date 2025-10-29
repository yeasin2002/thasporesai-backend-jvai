import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
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
      // Get total reviews and calculate average rating
      const [reviews, ratingAggregation] = await Promise.all([
        db.review
          .find({ contractor_id: userId })
          .populate("user_id", "full_name profile_img email")
          .populate("job_id", "title")
          .sort({ createdAt: -1 })
          .limit(5),
        db.review.aggregate([
          { $match: { contractor_id: userId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              average: { $avg: "$rating" },
            },
          },
        ]),
      ]);

      reviewStats = {
        total: ratingAggregation[0]?.total || 0,
        average: ratingAggregation[0]?.average
          ? Number(ratingAggregation[0].average.toFixed(1))
          : 0,
        reviews: reviews,
      };
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
