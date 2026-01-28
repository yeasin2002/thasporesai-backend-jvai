import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { logger } from "@/lib";
import type { RequestHandler } from "express";
import mongoose from "mongoose";
import type { RejectOffer } from "../offer.validation";

export const rejectOffer: RequestHandler<
  { offerId: string },
  any,
  RejectOffer
> = async (req, res) => {
  try {
    const { offerId } = req.params;
    const contractorId = req?.user?.id;
    const { reason } = req.body;

    // 1. Validate offer
    const offer = await db.offer
      .findOne({
        _id: offerId,
        contractor: contractorId,
      })
      .populate("customer", "full_name email");

    if (!offer) {
      return sendBadRequest(res, "Offer not found");
    }

    // Check if offer can be rejected
    if (offer.status !== "pending" && offer.status !== "accepted") {
      return sendBadRequest(
        res,
        `Cannot reject offer with status: ${offer.status}`
      );
    }

    const wasAccepted = offer.status === "accepted";

    // 2. If offer was accepted, perform MongoDB transaction to refund
    if (wasAccepted) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Get admin user ID
        const adminUserId = await AdminService.getAdminUserId();

        // MongoDB transaction: Refund from admin to customer
        // Deduct from admin wallet
        const adminWallet = await db.wallet.findOneAndUpdate(
          {
            user: adminUserId,
            balance: { $gte: offer.totalCharge }, // Atomic check
          },
          {
            $inc: {
              balance: -offer.totalCharge,
            },
          },
          { new: true, session }
        );

        // If admin wallet update failed, insufficient balance (should not happen)
        if (!adminWallet) {
          await session.abortTransaction();
          logger.error("Admin wallet has insufficient balance for refund", {
            offerId,
            amount: offer.totalCharge,
          });
          return sendInternalError(
            res,
            "Unable to process refund. Please contact support.",
            new Error("Admin wallet has insufficient balance")
          );
        }

        // Add back to customer wallet
        await db.wallet.findOneAndUpdate(
          { user: offer.customer },
          {
            $inc: {
              balance: offer.totalCharge,
            },
          },
          { new: true, session }
        );

        // Update offer status
        offer.status = "rejected";
        offer.rejectedAt = new Date();
        offer.rejectionReason = reason;
        await offer.save({ session });

        // Update engaged application/invite status (if applicable)
        if (offer.engaged) {
          // Get the engaged application to check its sender
          const engagement = await db.inviteApplication.findById(
            offer.engaged,
            null,
            { session }
          );
          if (engagement) {
            // Reset based on who initiated
            if (engagement.sender === "contractor") {
              // Contractor requested - reset to requested
              engagement.status = "requested";
            } else {
              // Customer invited - reset to engaged
              engagement.status = "engaged";
            }
            // Clear offer reference
            engagement.offerId = undefined as any;
            await engagement.save({ session });
          }
        }

        // Update job status back to open
        await db.job.findByIdAndUpdate(
          offer.job,
          {
            status: "open",
            contractorId: null,
            offerId: null,
            assignedAt: null,
          },
          { session }
        );

        // Create refund transaction
        await db.transaction.create(
          [
            {
              type: "refund",
              amount: offer.totalCharge,
              from: adminUserId,
              to: offer.customer,
              offer: offerId,
              job: offer.job,
              status: "completed",
              description: `Refund for rejected offer: $${offer.totalCharge}`,
              completedAt: new Date(),
            },
          ],
          { session }
        );

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Send notification to customer
        await NotificationService.sendToUser({
          userId: offer.customer._id.toString(),
          title: "Offer Rejected",
          body: `Your offer was rejected. Reason: ${reason}`,
          type: "offer_reject",
          data: {
            offerId: offerId.toString(),
            jobId: offer.job.toString(),
            refundAmount: offer.totalCharge.toString(),
          },
        });

        return sendSuccess(res, 200, "Offer rejected successfully", {
          offer,
          refundAmount: offer.totalCharge,
        });
      } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } else {
      // Offer was pending - just update status (no refund needed)
      offer.status = "rejected";
      offer.rejectedAt = new Date();
      offer.rejectionReason = reason;
      await offer.save();

      // Update engaged application/invite status (if applicable)
      if (offer.engaged) {
        // Get the engaged application to check its sender
        const engagement = await db.inviteApplication.findById(offer.engaged);
        if (engagement) {
          // Reset based on who initiated
          if (engagement.sender === "contractor") {
            // Contractor requested - reset to requested
            engagement.status = "requested";
          } else {
            // Customer invited - reset to engaged
            engagement.status = "engaged";
          }
          // Clear offer reference
          engagement.offerId = undefined as any;
          await engagement.save();
        }
      }

      // Send notification to customer
      await NotificationService.sendToUser({
        userId: offer.customer._id.toString(),
        title: "Offer Rejected",
        body: `Your offer was rejected. Reason: ${reason}`,
        type: "offer_reject",
        data: {
          offerId: offerId.toString(),
          jobId: offer.job.toString(),
        },
      });

      return sendSuccess(res, 200, "Offer rejected successfully", {
        offer,
        refundAmount: null,
      });
    }
  } catch (error) {
    logger.error("Error rejecting offer:", error);
    return sendInternalError(res, "Failed to reject offer", error as Error);
  }
};
