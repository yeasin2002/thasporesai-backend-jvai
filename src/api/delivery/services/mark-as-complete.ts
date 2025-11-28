import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import {
  sendBadRequest,
  sendForbidden,
  sendInternalError,
  sendNotFound,
  sendSuccess,
} from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

/**
 * Mark job as complete (Customer only)
 * POST /api/delivery/complete-delivery
 *
 * When customer marks job as complete:
 * 1. Validate job exists and is in_progress
 * 2. Validate customer owns the job
 * 3. Find associated offer
 * 4. Release payment from escrow to contractor
 * 5. Deduct service fee (20%) to admin
 * 6. Update job status to completed
 * 7. Update offer status to completed
 * 8. Update invite/application status to assigned
 * 9. Create transaction records
 * 10. Send notifications
 */
export const markAsComplete: RequestHandler = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { jobId } = req.body;
    const customerId = req.user?.id;

    if (!customerId) {
      await session.abortTransaction();
      return sendBadRequest(res, "User ID not found");
    }

    // 1. Validate job exists
    const job = await db.job.findById(jobId).session(session);

    if (!job) {
      await session.abortTransaction();
      return sendNotFound(res, "Job not found");
    }

    // 2. Validate customer owns the job
    if (job.customerId.toString() !== customerId) {
      await session.abortTransaction();
      return sendForbidden(res, "You can only complete your own jobs");
    }

    // 3. Validate job is in_progress
    if (job.status !== "in_progress") {
      await session.abortTransaction();
      return sendBadRequest(
        res,
        `Cannot complete job with status: ${job.status}. Job must be in_progress.`
      );
    }

    // 4. Find associated offer
    const offer = await db.offer
      .findOne({
        job: jobId,
        status: "accepted",
      })
      .session(session);

    if (!offer) {
      await session.abortTransaction();
      return sendNotFound(
        res,
        "No accepted offer found for this job. Cannot complete job without an accepted offer."
      );
    }

    // 5. Get customer wallet (for escrow release)
    const customerWallet = await db.wallet
      .findOne({ user: customerId })
      .session(session);

    if (!customerWallet) {
      await session.abortTransaction();
      return sendNotFound(res, "Customer wallet not found");
    }

    // 6. Validate escrow balance
    if (customerWallet.escrowBalance < offer.amount) {
      await session.abortTransaction();
      return sendBadRequest(
        res,
        `Insufficient escrow balance. Required: ${offer.amount}, Available: ${customerWallet.escrowBalance}`
      );
    }

    // 7. Get or create contractor wallet
    let contractorWallet = await db.wallet
      .findOne({ user: offer.contractor })
      .session(session);

    if (!contractorWallet) {
      const newWallets = await db.wallet.create(
        [
          {
            user: offer.contractor,
            balance: 0,
            escrowBalance: 0,
          },
        ],
        { session }
      );
      contractorWallet = newWallets[0];
    }

    // 8. Get or create admin wallet
    const adminUser = await db.user.findOne({ role: "admin" }).session(session);
    if (!adminUser) {
      await session.abortTransaction();
      return sendNotFound(res, "Admin user not found");
    }

    let adminWallet = await db.wallet
      .findOne({ user: adminUser._id })
      .session(session);

    if (!adminWallet) {
      const newAdminWallets = await db.wallet.create(
        [
          {
            user: adminUser._id,
            balance: 0,
            escrowBalance: 0,
          },
        ],
        { session }
      );
      adminWallet = newAdminWallets[0];
    }

    // 9. Get user details for notifications
    const customer = await db.user.findById(customerId).session(session);
    const contractor = await db.user
      .findById(offer.contractor)
      .session(session);

    if (!customer || !contractor) {
      await session.abortTransaction();
      return sendNotFound(res, "User details not found");
    }

    // 10. Process payment release
    // Release escrow from customer
    customerWallet.escrowBalance -= offer.amount;

    // Pay service fee to admin (20% of job amount)
    adminWallet.balance += offer.serviceFee;

    // Pay contractor (80% of job amount)
    contractorWallet.balance += offer.contractorPayout;
    contractorWallet.totalEarnings += offer.contractorPayout;

    // Save wallets
    await customerWallet.save({ session });
    await contractorWallet.save({ session });
    await adminWallet.save({ session });

    // 11. Update job status
    job.status = "completed";
    job.completedAt = new Date();
    await job.save({ session });

    // 12. Update offer status
    offer.status = "completed";
    offer.completedAt = new Date();
    await offer.save({ session });

    // 13. Update invite/application status if exists
    if (offer.engaged) {
      const engagement = await db.inviteApplication
        .findById(offer.engaged)
        .session(session);
      if (engagement) {
        engagement.status = "assigned";
        await engagement.save({ session });
      }
    }

    // 14. Create transaction records
    await db.transaction.create(
      [
        // Service fee to admin
        {
          type: "service_fee",
          amount: offer.serviceFee,
          from: offer.customer,
          to: adminUser._id,
          offer: offer._id,
          job: jobId,
          status: "completed",
          description: `Service fee (20%) for job completion: ${offer.serviceFee}`,
          completedAt: new Date(),
        },
        // Contractor payout
        {
          type: "contractor_payout",
          amount: offer.contractorPayout,
          from: offer.customer,
          to: offer.contractor,
          offer: offer._id,
          job: jobId,
          status: "completed",
          description: `Contractor payout (80%) for job completion: ${offer.contractorPayout}`,
          completedAt: new Date(),
        },
        // Escrow release
        {
          type: "escrow_release",
          amount: offer.amount,
          from: offer.customer,
          to: offer.customer,
          offer: offer._id,
          job: jobId,
          status: "completed",
          description: `Escrow released for job completion: ${offer.amount}`,
          completedAt: new Date(),
        },
      ],
      { session }
    );

    // 15. Commit transaction
    await session.commitTransaction();

    // 16. Send notification to contractor
    await NotificationService.sendToUser({
      userId: String(contractor._id),
      title: "Payment Released",
      body: `${customer.full_name} marked the job "${job.title}" as complete. You received ${offer.contractorPayout}`,
      type: "job_completed",
      data: {
        jobId: String(job._id),
        offerId: String(offer._id),
        amount: offer.contractorPayout.toString(),
        serviceFee: offer.serviceFee.toString(),
      },
    });

    // 17. Return success response
    return sendSuccess(res, 200, "Job marked as complete successfully", {
      job: {
        _id: job._id,
        title: job.title,
        status: job.status,
        completedAt: job.completedAt,
      },
      payment: {
        jobAmount: offer.amount,
        serviceFee: offer.serviceFee,
        contractorPayout: offer.contractorPayout,
        platformFee: offer.platformFee,
        totalAdminCommission: offer.platformFee + offer.serviceFee,
      },
      wallets: {
        customer: {
          balance: customerWallet.balance,
          escrowBalance: customerWallet.escrowBalance,
        },
        contractor: {
          balance: contractorWallet.balance,
          totalEarnings: contractorWallet.totalEarnings,
        },
      },
      message: `Job completed successfully. Contractor received ${offer.contractorPayout} (80% of ${offer.amount}). Service fee of ${offer.serviceFee} (20%) was deducted.`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error marking job as complete:", error);
    return sendInternalError(res, "Failed to mark job as complete", error);
  } finally {
    session.endSession();
  }
};
