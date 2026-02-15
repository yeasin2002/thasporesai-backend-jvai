import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { logger } from "@/lib";
import type { RequestHandler } from "express";
import type { SendOffer } from "../offer.validation";

/**
 * Send offer to contractor based on job application
 * POST /api/offer/application/:applicationId/send
 */
export const sendOffer: RequestHandler<
  { applicationId: string },
  any,
  SendOffer
> = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const customerId = req?.user?.id;
    const { amount, timeline, description } = req.body;

    // 1. Validate application
    const application = await db.inviteApplication
      .findById(applicationId)
      .populate("job")
      .populate("contractor", "full_name email");

    if (!application) {
      return sendBadRequest(res, "Application not found");
    }

    // Verify this is a contractor request (not a customer invite)
    if (application.sender !== "contractor") {
      return sendBadRequest(
        res,
        "Invalid application - not a contractor request"
      );
    }

    const job = application.job as any;

    // 2. Verify customer owns the job
    if (job.customerId.toString() !== customerId) {
      return sendBadRequest(res, "Not authorized");
    }

    // 3. Check job is still open
    if (job.status !== "open") {
      return sendBadRequest(res, "Job is not open for offers");
    }

    // 4. Check for existing offer
    const existingOffer = await db.offer.findOne({
      job: job._id,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingOffer) {
      return sendBadRequest(res, "An offer already exists for this job");
    }

    // 5. Calculate payment amounts
    const amounts = calculatePaymentAmounts(amount);

    // 6. Get or create wallet and validate balance (no deduction yet)
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

    // 7. Validate customer has sufficient balance (no deduction)
    if (wallet.balance < amounts.totalCharge) {
      return sendBadRequest(
        res,
        `Insufficient balance. Required: $${amounts.totalCharge}, Available: $${wallet.balance}`
      );
    }

    // 8. Check if wallet is frozen
    if (wallet.isFrozen) {
      return sendBadRequest(res, "Wallet is frozen. Please contact support.");
    }

    // 9. Create offer with expiresAt (7 days from now)
    const offer = await db.offer.create({
      job: job._id,
      customer: customerId,
      contractor: application.contractor._id,
      engaged: applicationId, // Link to unified application model
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

    // 10. Update application status to offered
    application.status = "offered";
    application.offerId = offer._id as any;
    await application.save();

    // Populate offer with customer and contractor details
    await offer.populate([
      { path: "customer", select: "full_name email profile_img role" },
      { path: "contractor", select: "full_name email profile_img role" },
      { path: "job", select: "title description budget location category" },
    ]);

    // 11. Send notification to contractor
    await NotificationService.sendToUser({
      userId: (application.contractor as any)._id.toString(),
      title: "New Offer Received",
      body: `You received an offer of $${amount} for "${job.title}"`,
      type: "sent_offer",
      data: {
        offerId: (offer._id as any).toString(),
        jobId: job._id.toString(),
        amount: amount.toString(),
        source: "application",
      },
    });

    return sendSuccess(res, 201, "Offer sent successfully", {
      offer,
      walletBalance: wallet.balance,
      amounts,
      source: "application",
    });
  } catch (error) {
    logger.error("Error sending offer", error);
    return sendInternalError(res, "Failed to send offer", error as Error);
  }
};
