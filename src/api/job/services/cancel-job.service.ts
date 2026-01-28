import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

/**
 * Cancel job with refund if offer was accepted
 * Uses MongoDB transaction for atomic wallet adjustments
 */
export const cancelJob: RequestHandler = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const job = await db.job.findById(jobId);

    if (!job) {
      return sendBadRequest(res, "Job not found");
    }

    // Only customer or admin can cancel
    if (job.customerId.toString() !== userId && userRole !== "admin") {
      return sendBadRequest(res, "Not authorized to cancel this job");
    }

    // Cannot cancel completed jobs
    if (job.status === "completed") {
      return sendBadRequest(res, "Cannot cancel completed job");
    }

    // Cannot cancel already cancelled jobs
    if (job.status === "cancelled") {
      return sendBadRequest(res, "Job is already cancelled");
    }

    // Get offer if exists
    const offer = await db.offer.findOne({
      job: jobId,
    });

    let refundAmount = 0;

    // If offer was accepted, perform refund via MongoDB transaction
    if (offer && offer.status === "accepted") {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Get admin wallet and user ID
        const adminWallet = await AdminService.getAdminWallet();
        const adminUserId = await AdminService.getAdminUserId();

        // Deduct from admin wallet
        adminWallet.balance -= offer.totalCharge;
        await adminWallet.save({ session });

        // Get or create customer wallet
        let customerWallet = await db.wallet.findOne({
          user: offer.customer,
        });
        if (!customerWallet) {
          [customerWallet] = await db.wallet.create(
            [
              {
                user: offer.customer,
                balance: 0,
              },
            ],
            { session }
          );
        }

        // Add refund to customer wallet
        customerWallet.balance += offer.totalCharge;
        await customerWallet.save({ session });

        refundAmount = offer.totalCharge;

        // Create refund transaction
        await db.transaction.create(
          [
            {
              type: "refund",
              amount: offer.totalCharge,
              from: adminUserId,
              to: offer.customer,
              offer: offer._id,
              job: jobId,
              status: "completed",
              description: `Refund for cancelled job: ${job.title}`,
              completedAt: new Date(),
            },
          ],
          { session }
        );

        // Update offer status
        offer.status = "cancelled";
        offer.cancelledAt = new Date();
        offer.cancellationReason = reason;
        await offer.save({ session });

        // Update job status
        job.status = "cancelled";
        job.cancelledAt = new Date();
        job.cancellationReason = reason;
        await job.save({ session });

        // Commit transaction
        await session.commitTransaction();

        // Send notification to contractor if assigned (outside transaction)
        if (job.contractorId) {
          await NotificationService.sendToUser({
            userId: job.contractorId.toString(),
            title: "Job Cancelled",
            body: `The job "${job.title}" has been cancelled. Reason: ${reason}`,
            type: "general",
            data: {
              jobId: jobId.toString(),
              reason,
            },
          });
        }
      } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // No accepted offer, just update job status
      job.status = "cancelled";
      job.cancelledAt = new Date();
      job.cancellationReason = reason;
      await job.save();

      // Update offer status if exists
      if (offer) {
        offer.status = "cancelled";
        offer.cancelledAt = new Date();
        offer.cancellationReason = reason;
        await offer.save();
      }

      // Send notification to contractor if assigned
      if (job.contractorId) {
        await NotificationService.sendToUser({
          userId: job.contractorId.toString(),
          title: "Job Cancelled",
          body: `The job "${job.title}" has been cancelled. Reason: ${reason}`,
          type: "general",
          data: {
            jobId: jobId.toString(),
            reason,
          },
        });
      }
    }

    return sendSuccess(res, 200, "Job cancelled successfully", {
      job,
      refundAmount,
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return sendInternalError(res, "Failed to cancel job", error);
  }
};
