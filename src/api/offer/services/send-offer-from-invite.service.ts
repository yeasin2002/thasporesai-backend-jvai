import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { logger } from "@/lib";
import type { RequestHandler } from "express";
import type { SendOffer } from "../offer.validation";

/**
 * Send offer to contractor based on accepted job invite
 * POST /api/offer/invite/:inviteId/send
 */
export const sendOfferFromInvite: RequestHandler<
  { inviteId: string },
  any,
  SendOffer
> = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const customerId = req?.user?.id;
    const { amount, timeline, description } = req.body;

    // 1. Validate invite
    const invite = await db.inviteApplication
      .findById(inviteId)
      .populate("job")
      .populate("contractor", "full_name email");

    if (!invite) {
      return sendBadRequest(res, "Invite not found");
    }

    // Verify this is a customer invite (not a contractor request)
    if (invite.sender !== "customer") {
      return sendBadRequest(res, "Invalid invite - not a customer invite");
    }

    // 2. Verify invite is accepted (engaged status)
    if (invite.status !== "engaged") {
      return sendBadRequest(
        res,
        "Can only send offer to accepted invites. Current status: " +
          invite.status
      );
    }

    const job = invite.job as any;

    // 3. Verify customer owns the job
    if (job.customerId.toString() !== customerId) {
      return sendBadRequest(res, "Not authorized");
    }

    // 4. Check job is still open
    if (job.status !== "open") {
      return sendBadRequest(res, "Job is not open for offers");
    }

    // 5. Check for existing offer
    const existingOffer = await db.offer.findOne({
      job: job._id,
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

    // 10. Create offer with expiresAt (7 days from now)
    const offer = await db.offer.create({
      job: job._id,
      customer: customerId,
      contractor: invite.contractor._id,
      engaged: inviteId, // Link to unified application model
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

    // 11. Update invite status to offered
    invite.status = "offered";
    await invite.save();

    // 12. Send notification to contractor
    await NotificationService.sendToUser({
      userId: (invite.contractor as any)._id.toString(),
      title: "New Offer Received",
      body: `You received an offer of $${amount} for "${job.title}"`,
      type: "sent_offer",
      data: {
        offerId: (offer._id as any).toString(),
        jobId: job._id.toString(),
        amount: amount.toString(),
        source: "invite",
      },
    });

    return sendSuccess(res, 201, "Offer sent successfully", {
      offer,
      walletBalance: wallet.balance,
      amounts,
      source: "invite",
    });
  } catch (error) {
    logger.error("Error sending offer from invite:", error);
    return sendInternalError(res, "Failed to send offer", error as Error);
  }
};
