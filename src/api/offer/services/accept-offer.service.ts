import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
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

    // 2-9. Execute all database operations atomically
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get admin wallet and user ID
      const adminWallet = await AdminService.getAdminWallet();
      const adminUserId = await AdminService.getAdminUserId();

      // Update offer status
      offer.status = "accepted";
      offer.acceptedAt = new Date();
      await offer.save({ session });

      // Update job
      job.status = "assigned";
      job.contractorId = contractorId;
      job.offerId = offerId;
      job.assignedAt = new Date();
      await job.save({ session });

      // Update engaged application/invite status (if applicable)
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

      // Transfer platform fee to admin
      adminWallet.balance += offer.platformFee;
      adminWallet.totalEarnings += offer.platformFee;
      await adminWallet.save({ session });

      // Update customer escrow
      await db.wallet.findOneAndUpdate(
        { user: offer.customer },
        {
          $inc: {
            escrowBalance: -offer.platformFee,
          },
        },
        { session }
      );

      // Create transaction for platform fee
      await db.transaction.create(
        [
          {
            type: "platform_fee",
            amount: offer.platformFee,
            from: offer.customer,
            to: adminUserId,
            offer: offerId,
            job: job._id,
            status: "completed",
            description: `Platform fee (5%) for accepted offer`,
            completedAt: new Date(),
          },
        ],
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // 10. Send notifications (outside transaction)
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
    console.error("Error accepting offer:", error);
    return sendInternalError(res, "Failed to accept offer", error as Error);
  }
};
