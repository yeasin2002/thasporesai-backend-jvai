import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { logger } from "@/lib";
import type { RequestHandler } from "express";
import type { SendOffer } from "../offer.validation";

/**
 * Send offer directly to contractor via job ID (simplified flow)
 * POST /api/offer/application/send/:jobId
 *
 * This is a simplified flow where customer sends offer directly without
 * requiring prior application or invite. Useful for direct negotiations.
 */
export const sendJobOffer: RequestHandler<
  { jobId: string },
  any,
  SendOffer & { contractorId: string }
> = async (req, res) => {
  try {
    const { jobId } = req.params;
    const customerId = req?.user?.id;
    const { amount, timeline, description, contractorId } = req.body;

    // 1. Validate job
    const job = await db.job.findById(jobId);

    if (!job) {
      return sendBadRequest(res, "Job not found");
    }

    // 2. Verify customer owns the job
    if (job.customerId.toString() !== customerId) {
      return sendBadRequest(res, "Not authorized - you don't own this job");
    }

    // 3. Check job is still open
    if (job.status !== "open") {
      return sendBadRequest(res, "Job is not open for offers");
    }

    // 4. Validate contractor exists and is a contractor
    const contractor = await db.user.findOne({
      _id: contractorId,
      role: "contractor",
    });

    if (!contractor) {
      return sendBadRequest(res, "Contractor not found");
    }

    // 5. Check for existing offer
    const existingOffer = await db.offer.findOne({
      job: jobId,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingOffer) {
      return sendBadRequest(res, "An offer already exists for this job");
    }

    // 6. Calculate payment amounts
    const amounts = calculatePaymentAmounts(amount);

    // 7. Get or create wallet and validate balance (no deduction yet)
    let wallet = await db.wallet.findOne({ user: customerId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: customerId,
        balance: 0,
        currency: "USD",
        isActive: true,
        isFrozen: false,
        totalEarnings: 0,
        totalSpent: 0,
        totalWithdrawals: 0,
        stripeCustomerId: null,
        stripeConnectAccountId: null,
      });
    }

    // 8. Validate customer has sufficient balance (no deduction)
    if (wallet.balance < amounts.totalCharge) {
      return sendBadRequest(
        res,
        `Insufficient balance. Required: $${amounts.totalCharge}, Available: $${wallet.balance}`
      );
    }

    // 9. Check if wallet is frozen
    if (wallet.isFrozen) {
      return sendBadRequest(res, "Wallet is frozen. Please contact support.");
    }

    // 10. Find or create invite application
    const inviteApplicationId = await db.inviteApplication.findOne({
      job: req.params.jobId,
      contractor: req.body.contractorId,
    });
    if (!inviteApplicationId) {
      return sendBadRequest(res, "Invite application not found");
    }

    // 11. Create offer with expiresAt (7 days from now)
    const offer = await db.offer.create({
      job: jobId,
      customer: customerId,
      contractor: contractorId,
      engaged: inviteApplicationId._id,
      amount: amounts.jobBudget,
      platformFee: amounts.platformFee,
      serviceFee: amounts.serviceFee,
      contractorPayout: amounts.contractorPayout,
      totalCharge: amounts.totalCharge,
      timeline,
      description,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // 12. Update invite application status to offered
    await db.inviteApplication.updateOne(
      { _id: inviteApplicationId._id },
      { status: "offered" }
    );

    // Populate customer and contractor data
    const populatedOffer: any = await db.offer
      .findById(offer._id)
      .populate("customer", "name email phone profile_img role")
      .populate("contractor", "name email phone profile_img role")
      .lean();

    // 13. Send notification to contractor
    await NotificationService.sendToUser({
      userId: contractorId,
      title: "New Job Offer Received",
      body: `You received a direct offer of $${amount} for "${job.title}"`,
      type: "sent_offer",
      data: {
        offerId: (offer._id as any).toString(),
        jobId: jobId,
        amount: amount.toString(),
        source: "direct",
      },
    });

    return sendSuccess(res, 201, "Offer sent successfully", {
      offer: populatedOffer,
      walletBalance: wallet.balance,
      amounts,
      source: "direct",
    });
  } catch (error) {
    logger.error("Error sending direct job offer:", error);
    return sendInternalError(res, "Failed to send offer", error as Error);
  }
};
