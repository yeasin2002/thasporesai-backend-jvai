import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { createConnectTransfer } from "@/common/service/stripe-helpers";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

/**
 * Admin approves job completion
 * Performs MongoDB transaction to update wallets and initiates Stripe Connect transfer
 */
export const approveCompletionRequest: RequestHandler = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return sendBadRequest(res, "Admin ID not found");
    }

    // 1. Get completion request
    const completionRequest = await db.completionRequest
      .findById(requestId)
      .populate("job")
      .populate("offer");

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

    // 3. Get job and offer
    const job = await db.job.findById(completionRequest.job);
    const offer = await db.offer.findById(completionRequest.offer);

    if (!job || !offer) {
      return sendBadRequest(res, "Job or offer not found");
    }

    // 4. Get contractor wallet to check Stripe Connect account
    const contractorWallet = await db.wallet.findOne({
      user: completionRequest.contractor,
    });

    if (!contractorWallet) {
      return sendBadRequest(res, "Contractor wallet not found");
    }

    if (!contractorWallet.stripeConnectAccountId) {
      return sendBadRequest(
        res,
        "Contractor has not connected their Stripe account"
      );
    }

    // 5. Start MongoDB transaction for wallet updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get admin wallet and user ID
      const adminWallet = await AdminService.getAdminWallet();
      const adminUserId = await AdminService.getAdminUserId();

      // 6. Deduct contractor payout from admin wallet
      adminWallet.balance -= offer.contractorPayout;
      await adminWallet.save({ session });

      // 7. Add contractor payout to contractor wallet
      contractorWallet.balance += offer.contractorPayout;
      contractorWallet.totalEarnings += offer.contractorPayout;
      await contractorWallet.save({ session });

      // 8. Create transaction record
      const transaction = await db.transaction.create(
        [
          {
            type: "contractor_payout",
            amount: offer.contractorPayout,
            from: adminUserId,
            to: completionRequest.contractor,
            offer: offer._id,
            job: job._id,
            status: "pending",
            description: `Payment for completed job: ${job.title}`,
          },
        ],
        { session }
      );

      // 9. Update completion request
      completionRequest.status = "approved";
      completionRequest.approvedBy = new mongoose.Types.ObjectId(adminId);
      completionRequest.approvedAt = new Date();
      await completionRequest.save({ session });

      // 10. Update job status
      job.status = "completed";
      job.completedAt = new Date();
      await job.save({ session });

      // 11. Update offer status
      offer.status = "completed";
      offer.completedAt = new Date();
      await offer.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // 12. Initiate Stripe Connect transfer (outside transaction)
      let stripeTransferId: string | null = null;
      try {
        stripeTransferId = await createConnectTransfer(
          contractorWallet.stripeConnectAccountId,
          offer.contractorPayout,
          `Payment for job: ${job.title}`
        );

        // Update transaction with Stripe transfer ID
        await db.transaction.findByIdAndUpdate(transaction[0]._id, {
          stripeTransferId,
          status: "completed",
          completedAt: new Date(),
        });
      } catch (stripeError) {
        console.error("Stripe transfer failed:", stripeError);
        // Mark transaction as failed but don't rollback DB changes
        await db.transaction.findByIdAndUpdate(transaction[0]._id, {
          status: "failed",
          failureReason:
            stripeError instanceof Error
              ? stripeError.message
              : "Stripe transfer failed",
        });
      }

      // 13. Send notification to contractor (outside transaction)
      await NotificationService.sendToUser({
        userId: completionRequest.contractor.toString(),
        title: "Payment Released",
        body: `You received $${offer.contractorPayout} for completing the job "${job.title}"`,
        type: "job_completed",
        data: {
          jobId: String(job._id),
          amount: offer.contractorPayout.toString(),
          stripeTransferId: stripeTransferId || "",
        },
      });

      return sendSuccess(res, 200, "Completion approved successfully", {
        requestId: String(completionRequest._id),
        jobId: String(job._id),
        stripeTransferId,
        contractorPayout: offer.contractorPayout,
        status: "approved",
      });
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error approving completion request:", error);
    return sendInternalError(
      res,
      "Failed to approve completion request",
      error
    );
  }
};
