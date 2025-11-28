import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

export const completeJob: RequestHandler = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const customerId = req?.user?.id;

    // 1. Validate job
    const job = await db.job.findOne({
      _id: jobId,
      customerId,
      status: "in_progress",
    });

    if (!job) {
      return sendBadRequest(res, "Job not found or not in progress");
    }

    // 2. Get offer
    const offer = await db.offer.findOne({
      job: jobId,
      status: "accepted",
    });

    if (!offer) {
      return sendBadRequest(res, "Offer not found");
    }

    // 3-10. Execute all database operations atomically
    if (!job.contractorId) {
      return sendBadRequest(res, "No contractor assigned to this job");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get admin wallet and user ID
      const adminWallet = await AdminService.getAdminWallet();
      const adminUserId = await AdminService.getAdminUserId();

      // Update job status
      job.status = "completed";
      job.completedAt = new Date();
      await job.save({ session });

      // Update offer status
      offer.status = "completed";
      offer.completedAt = new Date();
      await offer.save({ session });

      // Transfer service fee to admin
      adminWallet.balance += offer.serviceFee;
      adminWallet.totalEarnings += offer.serviceFee;
      await adminWallet.save({ session });

      // Get or create contractor wallet
      let contractorWallet = await db.wallet.findOne({
        user: job.contractorId,
      });
      if (!contractorWallet) {
        [contractorWallet] = await db.wallet.create(
          [
            {
              user: job.contractorId,
              balance: 0,
              escrowBalance: 0,
            },
          ],
          { session }
        );
      }

      // Transfer contractor payout
      contractorWallet.balance += offer.contractorPayout;
      contractorWallet.totalEarnings += offer.contractorPayout;
      await contractorWallet.save({ session });

      // Release from customer escrow
      await db.wallet.findOneAndUpdate(
        { user: customerId },
        {
          $inc: {
            escrowBalance: -(offer.serviceFee + offer.contractorPayout),
          },
        },
        { session }
      );

      // Create transaction records
      await db.transaction.create(
        [
          {
            type: "service_fee",
            amount: offer.serviceFee,
            from: customerId,
            to: adminUserId,
            offer: offer._id,
            job: jobId,
            status: "completed",
            description: `Service fee (20%) for completed job`,
            completedAt: new Date(),
          },
          {
            type: "contractor_payout",
            amount: offer.contractorPayout,
            from: customerId,
            to: job.contractorId,
            offer: offer._id,
            job: jobId,
            status: "completed",
            description: `Payment for completed job: ${offer.contractorPayout}`,
            completedAt: new Date(),
          },
        ],
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // 11. Send notification to contractor (outside transaction)
      await NotificationService.sendToUser({
        userId: job.contractorId.toString(),
        title: "Payment Released",
        body: `You received $${offer.contractorPayout} for completing the job`,
        type: "job_completed",
        data: {
          jobId: jobId.toString(),
          amount: offer.contractorPayout.toString(),
        },
      });

      return sendSuccess(res, 200, "Job marked as complete", {
        job,
        payment: {
          serviceFee: offer.serviceFee,
          contractorPayout: offer.contractorPayout,
          adminCommission: offer.platformFee + offer.serviceFee,
        },
      });
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error completing job:", error);
    return sendInternalError(res, "Failed to complete job", error);
  }
};
