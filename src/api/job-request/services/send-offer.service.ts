import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { SendOffer } from "../job-request.validation";

export const sendOffer: RequestHandler<
  { applicationId: string },
  any,
  SendOffer
> = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const customerId = req.user!.id;
    const { amount, timeline, description } = req.body;

    // 1. Validate application
    const application = await db.jobApplicationRequest
      .findById(applicationId)
      .populate("job")
      .populate("contractor", "full_name email");

    if (!application) {
      return sendBadRequest(res, "Application not found");
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

    // 6. Check wallet balance
    let wallet = await db.wallet.findOne({ user: customerId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: customerId,
        balance: 0,
        escrowBalance: 0,
      });
    }

    if (wallet.balance < amounts.totalCharge) {
      return sendBadRequest(
        res,
        `Insufficient balance. Required: $${amounts.totalCharge}, Available: $${wallet.balance}`
      );
    }

    // 7. Create offer
    const offer = await db.offer.create({
      job: job._id,
      customer: customerId,
      contractor: application.contractor._id,
      application: applicationId,
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

    // 8. Deduct from wallet and move to escrow
    wallet.balance -= amounts.totalCharge;
    wallet.escrowBalance += amounts.totalCharge;
    wallet.totalSpent += amounts.totalCharge;
    await wallet.save();

    // 9. Create transaction record
    await db.transaction.create({
      type: "escrow_hold",
      amount: amounts.totalCharge,
      from: customerId,
      to: customerId, // Escrow is still customer's money
      offer: offer._id,
      job: job._id,
      status: "completed",
      description: `Escrow hold for job offer: $${amounts.totalCharge}`,
      completedAt: new Date(),
    });

    // 10. Update application status
    application.status = "offer_sent";
    application.offerId = offer._id as any;
    await application.save();

    // 11. Send notification to contractor
    await NotificationService.sendToUser({
      userId: application.contractor._id.toString(),
      title: "New Offer Received",
      body: `You received an offer of $${amount} for "${job.title}"`,
      type: "booking_confirmed",
      data: {
        offerId: offer._id.toString(),
        jobId: job._id.toString(),
        amount: amount.toString(),
      },
    });

    return sendSuccess(res, 201, "Offer sent successfully", {
      offer,
      walletBalance: wallet.balance,
      amounts,
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    return sendInternalError(res, "Failed to send offer");
  }
};
