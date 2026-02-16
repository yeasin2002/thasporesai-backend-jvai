import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { logger } from "@/lib";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

export const acceptOffer: RequestHandler = async (req, res) => {
  try {
    const { offerId } = req.params;
    const contractorId = req?.user?.id;

    // 1. Validate offer
    const offer = await db.offer
      .findOne({
        _id: offerId,
        contractor: contractorId,
        status: "pending",
      })
      .populate("job")
      .populate("customer", "full_name email");

    if (!offer) {
      return sendBadRequest(res, "Offer not found or already processed");
    }

    const job = offer.job as any;

    // 2. Validate customer has sufficient balance
    const customerWallet = await db.wallet.findOne({ user: offer.customer });
    if (!customerWallet) {
      return sendBadRequest(res, "Customer wallet not found");
    }

    if (customerWallet.balance < offer.totalCharge) {
      return sendBadRequest(
        res,
        `Insufficient balance. Required: $${offer.totalCharge}, Available: $${customerWallet.balance}`
      );
    }

    if (customerWallet.isFrozen) {
      return sendBadRequest(
        res,
        "Customer wallet is frozen. Please contact support."
      );
    }

    // 3. Execute all database operations atomically
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get admin wallet and user ID
      const adminUserId = await AdminService.getAdminUserId();

      // 4. MongoDB transaction: Transfer funds from customer to admin
      // Deduct from customer wallet
      const updatedCustomerWallet = await db.wallet.findOneAndUpdate(
        {
          user: offer.customer,
          balance: { $gte: offer.totalCharge }, // Atomic check
        },
        {
          $inc: {
            balance: -offer.totalCharge,
            totalSpent: offer.totalCharge,
          },
        },
        { new: true, session }
      );

      // If wallet update failed, balance was insufficient (race condition)
      if (!updatedCustomerWallet) {
        await session.abortTransaction();
        return sendBadRequest(
          res,
          `Insufficient balance. Required: $${offer.totalCharge}, Available: $${customerWallet.balance}`
        );
      }

      // Add to admin wallet
      await db.wallet.findOneAndUpdate(
        { user: adminUserId },
        {
          $inc: {
            balance: offer.totalCharge,
            totalEarnings: offer.totalCharge,
          },
        },
        { new: true, session, upsert: true }
      );

      // 5. Update offer status
      offer.status = "accepted";
      offer.acceptedAt = new Date();
      await offer.save({ session });

      // 6. Update job status
      job.status = "assigned";
      job.contractorId = contractorId;
      job.offerId = offerId;
      job.assignedAt = new Date();
      await job.save({ session });

      // 7. Update engaged application/invite status (if applicable)
      if (offer.engaged) {
        // Mark the engaged application as accepted
        await db.inviteApplication.findByIdAndUpdate(
          offer.engaged,
          { status: "assigned" }, // Mark as engaged (accepted)
          { session }
        );

        // Cancel other applications/invites for this job
        await db.inviteApplication.updateMany(
          {
            job: job._id,
            _id: { $ne: offer.engaged },
            status: { $in: ["requested", "invited"] },
          },
          { status: "cancelled" },
          { session }
        );
      } else {
        // Direct offer - cancel any pending applications/invites
        await db.inviteApplication.updateMany(
          {
            job: job._id,
            status: { $in: ["requested", "invited"] },
          },
          { status: "cancelled" },
          { session }
        );
      }

      // 8. Create transaction record
      await db.transaction.create(
        [
          {
            type: "wallet_transfer",
            amount: offer.totalCharge,
            from: offer.customer,
            to: adminUserId,
            offer: offerId,
            job: job._id,
            status: "completed",
            description: `Wallet transfer for accepted offer: $${offer.totalCharge} (budget + 5% platform fee)`,
            completedAt: new Date(),
          },
        ],
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // 9. Send notifications (outside transaction)
      await NotificationService.sendToUser({
        userId: offer.customer._id.toString(),
        title: "Offer Accepted",
        body: `Your offer has been accepted by the contractor`,
        type: "accept_offer",
        data: {
          offerId: offerId.toString(),
          jobId: job._id.toString(),
          contractorId: contractorId?.toString(),
          customerId: offer.customer._id.toString(),
        },
      });

      // Notify cancelled applicants/invitees
      const cancelledApplications = await db.inviteApplication
        .find({
          job: job._id,
          status: "cancelled",
        })
        .populate("contractor", "_id");

      for (const app of cancelledApplications) {
        await NotificationService.sendToUser({
          userId: (app.contractor as any)._id.toString(),
          title: "Job Filled",
          body: `The job "${job.title}" has been filled`,
          type: "general",
          data: {
            jobId: job._id.toString(),
            contractorId: contractorId?.toString(),
            customerId: offer.customer._id.toString(),
          },
        });
      }

      return sendSuccess(res, 200, "Offer accepted successfully", {
        offer,
        job,
        payment: {
          totalCharge: offer.totalCharge,
          platformFee: offer.platformFee,
          serviceFee: offer.serviceFee,
          contractorPayout: offer.contractorPayout,
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
    logger.error("Error accepting offer:", error);
    return sendInternalError(res, "Failed to accept offer", error as Error);
  }
};
