import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get contractor's own job applications
 * GET /api/job-request/my
 */
export const getMyApplications: RequestHandler = async (req, res) => {
  try {
    const contractorId = req.user?.userId;

    if (!contractorId) {
      return sendError(res, 401, "Unauthorized");
    }

    // Get all applications by this contractor
    const applications = await db.jobApplicationRequest
      .find({ contractor: contractorId })
      .populate("job", "title description budget status location category")
      .populate({
        path: "job",
        populate: {
          path: "customerId",
          select: "full_name email profile_img",
        },
      })
      .sort({ createdAt: -1 });

    return sendSuccess(
      res,
      200,
      "Your applications retrieved successfully",
      applications
    );
  } catch (error) {
    console.error("Get my applications error:", error);
    return sendError(res, 500, "Failed to retrieve your applications");
  }
};
