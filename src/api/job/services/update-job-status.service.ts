import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const updateJobStatus: RequestHandler = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { status } = req.body;
    const userId = req?.user?.id;
    const userRole = req?.user?.role;

    // 1. Validate job
    const job = await db.job.findById(jobId);

    if (!job) {
      return sendBadRequest(res, "Job not found");
    }

    // 2. Authorization check
    if (userRole === "contractor" && job.contractorId?.toString() !== userId) {
      return sendBadRequest(res, "Not authorized");
    }

    if (userRole === "customer" && job.customerId.toString() !== userId) {
      return sendBadRequest(res, "Not authorized");
    }

    // 3. Validate status transition
    const allowedTransitions: Record<string, string[]> = {
      open: ["assigned", "cancelled"],
      assigned: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[job.status].includes(status)) {
      return sendBadRequest(
        res,
        `Cannot transition from ${job.status} to ${status}`
      );
    }

    // 4. Update job status
    job.status = status;
    await job.save();

    // 5. Send notification
    const notificationTarget =
      userRole === "contractor" ? job.customerId : job.contractorId;

    if (notificationTarget) {
      await NotificationService.sendToUser({
        userId: notificationTarget.toString(),
        title: "Job Status Updated",
        body: `Job status changed to: ${status}`,
        type: "general",
        data: {
          jobId: jobId.toString(),
          status,
        },
      });
    }

    return sendSuccess(res, 200, "Job status updated", job);
  } catch (error) {
    console.error("Error updating job status:", error);
    return sendInternalError(res, "Failed to update job status", error);
  }
};
