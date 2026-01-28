import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

/**
 * Admin rejects job completion request
 * Updates request status and sends notification to customer
 */
export const rejectCompletionRequest: RequestHandler = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return sendBadRequest(res, "Admin ID not found");
    }

    // 1. Get completion request
    const completionRequest = await db.completionRequest
      .findById(requestId)
      .populate("job");

    if (!completionRequest) {
      return sendBadRequest(res, "Completion request not found");
    }

    // 2. Validate request is pending
    if (completionRequest.status !== "pending") {
      return sendBadRequest(
        res,
        `Completion request is already ${completionRequest.status}`
      );
    }

    // 3. Get job
    const job = await db.job.findById(completionRequest.job);

    if (!job) {
      return sendBadRequest(res, "Job not found");
    }

    // 4. Update completion request
    completionRequest.status = "rejected";
    completionRequest.rejectedBy = new mongoose.Types.ObjectId(adminId);
    completionRequest.rejectedAt = new Date();
    completionRequest.rejectionReason = reason;
    await completionRequest.save();

    // 5. Send notification to customer
    await NotificationService.sendToUser({
      userId: completionRequest.customer.toString(),
      title: "Completion Request Rejected",
      body: `Your completion request for job "${job.title}" was rejected. Reason: ${reason}`,
      type: "general",
      data: {
        jobId: String(job._id),
        requestId: String(completionRequest._id),
        reason,
      },
    });

    return sendSuccess(res, 200, "Completion request rejected", {
      requestId: String(completionRequest._id),
      status: "rejected",
      reason,
    });
  } catch (error) {
    console.error("Error rejecting completion request:", error);
    return sendInternalError(res, "Failed to reject completion request", error);
  }
};
