import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import type { Agenda, Job } from "agenda";
import consola from "consola";
import mongoose from "mongoose";

// Job name constant
export const EXPIRE_OFFERS_JOB = "expire-offers";

/**
 * Expire Offers Job Handler
 * Automatically expires accepted offers that have passed their expiration date (7 days)
 * Performs database-only wallet refunds (admin → customer)
 * Resets application status and sends notifications
 */
export const expireOffersHandler = async (_job: Job) => {
  try {
    const now = new Date();

    consola.info(`⏰ Running ${EXPIRE_OFFERS_JOB} job at ${now.toISOString()}`);

    // Find all expired ACCEPTED offers (only accepted offers need refunds)
    const expiredOffers = await db.offer.find({
      status: "accepted",
      expiresAt: { $lt: now },
    });

    if (expiredOffers.length === 0) {
      consola.info("✅ No expired offers found");
      return { processed: 0, message: "No expired offers found" };
    }

    consola.info(`⏰ Processing ${expiredOffers.length} expired offers...`);

    let successCount = 0;
    let failureCount = 0;

    for (const offer of expiredOffers) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Get admin wallet and user ID
        const adminWallet = await AdminService.getAdminWallet();
        const adminUserId = await AdminService.getAdminUserId();

        // Deduct from admin wallet
        adminWallet.balance -= offer.totalCharge;
        await adminWallet.save({ session });

        // Get or create customer wallet
        let customerWallet = await db.wallet.findOne({
          user: offer.customer,
        });
        if (!customerWallet) {
          [customerWallet] = await db.wallet.create(
            [
              {
                user: offer.customer,
                balance: 0,
              },
            ],
            { session }
          );
        }

        // Add refund to customer wallet
        customerWallet.balance += offer.totalCharge;
        await customerWallet.save({ session });

        // Update offer status
        offer.status = "expired";
        await offer.save({ session });

        // Create refund transaction
        await db.transaction.create(
          [
            {
              type: "refund",
              amount: offer.totalCharge,
              from: adminUserId,
              to: offer.customer,
              offer: offer._id,
              job: offer.job,
              status: "completed",
              description: `Refund for expired offer (7 days): $${offer.totalCharge}`,
              completedAt: new Date(),
            },
          ],
          { session }
        );

        // Reset engaged application/invite status to allow new offers
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
            await engagement.save({ session });
          }
        }

        // Update job status back to open if it was assigned
        const jobDoc = await db.job.findById(offer.job);
        if (jobDoc && jobDoc.status === "assigned") {
          jobDoc.status = "open";
          jobDoc.contractorId = undefined;
          jobDoc.offerId = undefined;
          jobDoc.assignedAt = undefined;
          await jobDoc.save({ session });
        }

        // Commit transaction
        await session.commitTransaction();

        // Notify customer (outside transaction)
        await NotificationService.sendToUser({
          userId: offer.customer.toString(),
          title: "Offer Expired",
          body: `Your offer has expired after 7 days and $${offer.totalCharge} has been refunded to your wallet`,
          type: "general",
          data: {
            offerId: String(offer._id),
            jobId: offer.job.toString(),
            refundAmount: offer.totalCharge.toString(),
          },
        });

        // Notify contractor (outside transaction)
        await NotificationService.sendToUser({
          userId: offer.contractor.toString(),
          title: "Offer Expired",
          body: `The offer for this job has expired after 7 days`,
          type: "general",
          data: {
            offerId: String(offer._id),
            jobId: offer.job.toString(),
          },
        });

        consola.success(
          `✅ Expired offer ${String(offer._id)} and refunded $${
            offer.totalCharge
          }`
        );
        successCount++;
      } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        consola.error(`❌ Error expiring offer ${offer._id}:`, error);
        failureCount++;
      } finally {
        session.endSession();
      }
    }

    const result = {
      processed: expiredOffers.length,
      successful: successCount,
      failed: failureCount,
      message: `Processed ${expiredOffers.length} expired offers (${successCount} successful, ${failureCount} failed)`,
    };

    consola.success(
      `✅ Successfully processed ${successCount}/${expiredOffers.length} expired offers`
    );

    return result;
  } catch (error) {
    consola.error("❌ Error in expireOffers job:", error);
    throw error; // Agenda will handle retry logic
  }
};

/**
 * Define and schedule the expire offers job with Agenda
 */
export const defineExpireOffersJob = (agenda: Agenda) => {
  // Define the job
  agenda.define(EXPIRE_OFFERS_JOB, expireOffersHandler, {
    concurrency: 1, // Only one instance should run at a time
    lockLifetime: 5 * 60 * 1000, // 5 minutes lock lifetime
  });

  consola.success(`✅ Defined job: ${EXPIRE_OFFERS_JOB}`);
};

/**
 * Schedule the expire offers job to run every hour
 */
export const scheduleExpireOffersJob = async (agenda: Agenda) => {
  // Cancel any existing jobs to avoid duplicates
  await agenda.cancel({ name: EXPIRE_OFFERS_JOB });

  // Schedule to run every hour
  await agenda.every("1 hour", EXPIRE_OFFERS_JOB, {}, { skipImmediate: false });

  consola.success(
    `✅ Scheduled job: ${EXPIRE_OFFERS_JOB} (runs every hour, starting immediately)`
  );
};

/**
 * Initialize the expire offers job
 * Call this after Agenda is initialized
 */
export const initializeExpireOffersJob = async (agenda: Agenda) => {
  defineExpireOffersJob(agenda);
  await scheduleExpireOffersJob(agenda);
};
