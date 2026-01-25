import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
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
        status: "pending",
      })
      .populate("customer", "full_name email");

    if (!offer) {
      return sendBadRequest(res, "Offer not found or already processed");
    }

    // 2. Update offer status
    offer.status = "rejected";
    offer.rejectedAt = new Date();
    offer.rejectionReason = reason;
    await offer.save();

    // 3. Update engaged application/invite status (if applicable)
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
        // Clear offer reference (cast to any to avoid TypeScript error)
        engagement.offerId = undefined as any;
        await engagement.save();
      }
    }
    // If direct offer (no engaged reference), no status to reset

    // 4. Refund customer wallet
    await db.wallet.findOneAndUpdate(
      { user: offer.customer },
      {
        $inc: {
          balance: offer.totalCharge,
          escrowBalance: -offer.totalCharge,
        },
      }
    );

    // 5. Create refund transaction
    await db.transaction.create({
      type: "refund",
      amount: offer.totalCharge,
      from: offer.customer,
      to: offer.customer,
      offer: offerId,
      job: offer.job,
      status: "completed",
      description: `Refund for rejected offer: ${offer.totalCharge}`,
      completedAt: new Date(),
    });

    // 6. Send notification to customer
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
      refundAmount: offer.totalCharge,
    });
  } catch (error) {
    // TODO: Integrate with error tracking service (e.g., Sentry) for production monitoring
    // Enhanced error logging with context
    console.error("Error rejecting offer:", {
      operation: "reject_offer",
      offerId: req.params?.offerId,
      contractorId: req?.user?.id,
      reason: req.body?.reason,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return sendInternalError(res, "Failed to reject offer", error);
  }
};
