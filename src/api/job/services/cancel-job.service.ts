import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const cancelJob: RequestHandler = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { reason } = req.body;
    const userId = req?.user?.id;
    const userRole = req?.user?.role;

    const job = await db.job.findById(jobId);

    if (!job) {
      return sendBadRequest(res, "Job not found");
    }

    // Only customer or admin can cancel
    if (job.customerId.toString() !== userId && userRole !== "admin") {
      return sendBadRequest(res, "Not authorized");
    }

    // Cannot cancel completed jobs
    if (job.status === "completed") {
      return sendBadRequest(res, "Cannot cancel completed job");
    }

    // Get offer if exists
    const offer = await db.offer.findOne({
      job: jobId,
      status: { $in: ["pending", "accepted"] },
    });

    let refundAmount = 0;

    if (offer) {
      // Refund customer
      await db.wallet.findOneAndUpdate(
        { user: offer.customer },
        {
          $inc: {
            balance: offer.totalCharge,
            escrowBalance: -offer.totalCharge,
          },
        }
      );

      refundAmount = offer.totalCharge;

      // Create refund transaction
      await db.transaction.create({
        type: "refund",
        amount: offer.totalCharge,
        from: offer.customer,
        to: offer.customer,
        offer: offer._id,
        job: jobId,
        status: "completed",
        description: "Refund for cancelled job",
        completedAt: new Date(),
      });

      // Update offer
      offer.status = "cancelled";
      offer.cancelledAt = new Date();
      offer.cancellationReason = reason;
      await offer.save();

      // Send notification to contractor if assigned
      if (job.contractorId) {
        await NotificationService.sendToUser({
          userId: job.contractorId.toString(),
          title: "Job Cancelled",
          body: `The job has been cancelled. Reason: ${reason}`,
          type: "general",
          data: {
            jobId: jobId.toString(),
            reason,
          },
        });
      }
    }

    // Update job
    job.status = "cancelled";
    job.cancelledAt = new Date();
    job.cancellationReason = reason;
    await job.save();

    return sendSuccess(res, 200, "Job cancelled successfully", {
      job,
      refundAmount,
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return sendInternalError(res, "Failed to cancel job", error);
  }
};
