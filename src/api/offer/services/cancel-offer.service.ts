import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import {
  sendBadRequest,
  sendForbidden,
  sendInternalError,
  sendNotFound,
  sendSuccess,
} from "@/helpers";
import { logger } from "@/lib";
import type { RequestHandler } from "express";
import type { CancelOffer } from "../offer.validation";

export const cancelOffer: RequestHandler<any, any, CancelOffer> = async (
  req,
  res
) => {
  try {
    const userId = req.user?.id;
    const {
      customer: customerId,
      contractor: contractorId,
      jobId,
      reason,
    } = req.body;

    if (!userId) {
      return sendBadRequest(res, "User ID not found");
    }

    // 1. Validate: Authenticated user must be the customer
    if (customerId !== userId) {
      return sendForbidden(res, "You can only cancel your own offers");
    }

    // 2. Find offer using customer, contractor, and job
    const offer = await db.offer.findOne({
      customer: customerId,
      contractor: contractorId,
      job: jobId,
    });

    if (!offer) {
      return sendNotFound(
        res,
        "Offer not found for the specified customer, contractor, and job"
      );
    }

    // 3. Validate: Only pending offers can be cancelled (no refund needed)
    if (offer.status !== "pending") {
      return sendBadRequest(
        res,
        `Cannot cancel offer with status: ${offer.status}. Only pending offers can be cancelled.`
      );
    }

    // 4. Get related data for notification
    const customer = await db.user.findById(offer.customer);
    const contractor = await db.user.findById(offer.contractor);
    const job = await db.job.findById(offer.job);

    if (!customer || !contractor || !job) {
      return sendNotFound(res, "Related data not found");
    }

    // 5. Update offer status (no wallet changes needed for pending offers)
    offer.status = "cancelled";
    offer.cancelledAt = new Date();
    offer.cancellationReason =
      reason || "Cancelled by customer before contractor response";
    await offer.save();

    // 6. Update engaged application/invite status
    if (offer.engaged) {
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

    // 7. Send notification to contractor
    await NotificationService.sendToUser({
      userId: String(contractor._id),
      title: "Offer Cancelled",
      body: `${customer.full_name} has cancelled their offer for "${job.title}"`,
      type: "general",
      data: {
        offerId: String(offer._id),
        jobId: String(job._id),
        amount: offer.amount.toString(),
        reason: offer.cancellationReason || "",
      },
    });

    // 8. Return success response
    return sendSuccess(res, 200, "Offer cancelled successfully", {
      offer: {
        _id: offer._id,
        status: offer.status,
        cancelledAt: offer.cancelledAt,
        cancellationReason: offer.cancellationReason,
      },
      message:
        "Your offer has been cancelled. No refund needed as the offer was still pending.",
    });
  } catch (error) {
    logger.error("Error cancelling offer:", error);
    return sendInternalError(res, "Failed to cancel offer", error as Error);
  }
};
