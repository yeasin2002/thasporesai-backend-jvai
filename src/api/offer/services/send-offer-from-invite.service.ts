import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";
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

    // 7. Get or create wallet (without balance check yet)
    let wallet = await db.wallet.findOne({ user: customerId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: customerId,
        balance: 0,
        escrowBalance: 0,
      });
    }

    // 8-11. Execute all database operations atomically with optimistic locking
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

      // Create offer (linked to unified application model)
      const [offer] = await db.offer.create(
        [
          {
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
            job: job._id,
            status: "completed",
            description: `Escrow hold for job offer (from invite): ${amounts.totalCharge}`,
            completedAt: new Date(),
          },
        ],
        { session }
      );

      // Update invite status to offered
      invite.status = "offered";
      await invite.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // 12. Send notification to contractor (outside transaction)
      await NotificationService.sendToUser({
        userId: (invite.contractor as any)._id.toString(),
        title: "New Offer Received",
        body: `You received an offer of ${amount} for "${job.title}"`,
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
        walletBalance: updatedWallet.balance,
        amounts,
        source: "invite",
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
    console.error("Error sending offer from invite:", {
      operation: "send_offer_from_invite",
      inviteId: req.params?.inviteId,
      customerId: req?.user?.id,
      amount: req.body?.amount,
      timeline: req.body?.timeline,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return sendInternalError(res, "Failed to send offer", error);
  }
};
