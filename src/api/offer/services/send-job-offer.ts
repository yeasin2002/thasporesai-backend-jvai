import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";
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

    //Todo: send also name with how am I engaged
    if (existingOffer) {
      return sendBadRequest(res, "An offer already exists for this job");
    }

    // 6. Calculate payment amounts
    const amounts = calculatePaymentAmounts(amount);

    // 7. Get or create wallet (without balance check yet)
    let wallet = await db.wallet.findOne({ user: customerId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: customerId,
        balance: 0,
        escrowBalance: 0,
      });
    }

    const inviteApplicationId = await db.inviteApplication.findOne({
      job: req.params.jobId,
      contractor: req.body.contractorId,
    });
    if (!inviteApplicationId) {
      return sendBadRequest(res, "Invite application not found");
    }

    // 8-10. Execute all database operations atomically with optimistic locking
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Atomically deduct from wallet with balance check (prevents race conditions)
      const updatedWallet = await db.wallet.findOneAndUpdate(
        {
          user: customerId,
          balance: { $gte: amounts.totalCharge }, // Atomic check - ensures sufficient balance
        },
        {
          $inc: {
            balance: -amounts.totalCharge,
            escrowBalance: amounts.totalCharge,
            totalSpent: amounts.totalCharge,
          },
        },
        { new: true, session }
      );

      // If wallet update failed, balance was insufficient
      if (!updatedWallet) {
        await session.abortTransaction();
        return sendBadRequest(
          res,
          `Insufficient balance. Required: ${amounts.totalCharge}, Available: ${wallet.balance}`
        );
      }

      // Create offer (no application or invite reference)
      const [offer] = await db.offer.create(
        [
          {
            job: jobId,
            customer: customerId,
            contractor: contractorId,
            // No application or invite - direct offer
            amount: amounts.jobBudget,
            platformFee: amounts.platformFee,
            serviceFee: amounts.serviceFee,
            contractorPayout: amounts.contractorPayout,
            totalCharge: amounts.totalCharge,
            timeline,
            description,
            status: "pending",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            engaged: inviteApplicationId._id,
          },
        ],
        { session }
      );

      // Create transaction record
      await db.transaction.create(
        [
          {
            type: "escrow_hold",
            amount: amounts.totalCharge,
            from: customerId,
            to: customerId, // Escrow is still customer's money
            offer: offer._id,
            job: jobId,
            status: "completed",
            description: `Escrow hold for direct job offer: ${amounts.totalCharge}`,
            completedAt: new Date(),
          },
        ],
        { session }
      );

      // update to pending
      await db.inviteApplication.updateOne(
        { _id: inviteApplicationId._id },
        { status: "offered" },
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // Populate customer and contractor data
      const populatedOffer: any = await db.offer
        .findById(offer._id)
        .populate("customer", "name email phone profile_img role")
        .populate("contractor", "name email phone profile_img role")
        .lean();

      // 11. Send notification to contractor (outside transaction)
      await NotificationService.sendToUser({
        userId: contractorId,
        title: "New Job Offer Received",
        body: `You received a direct offer of ${amount} for "${job.title}"`,
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
        walletBalance: updatedWallet.balance,
        amounts,
        source: "direct",
      });
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    // TODO: Integrate with error tracking service (e.g., Sentry) for production monitoring
    // Enhanced error logging with context
    console.error("Error sending direct job offer:", {
      operation: "send_job_offer",
      jobId: req.params?.jobId,
      customerId: req?.user?.id,
      contractorId: req.body?.contractorId,
      amount: req.body?.amount,
      timeline: req.body?.timeline,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return sendInternalError(res, "Failed to send offer", error);
  }
};
