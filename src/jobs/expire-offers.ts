import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";

/**
 * Expire Offers Job
 * Automatically expires pending offers that have passed their expiration date
 * Refunds customers and resets application status
 */
export const expireOffers = async () => {
  try {
    const now = new Date();

    // Find all expired pending offers
    const expiredOffers = await db.offer.find({
      status: "pending",
      expiresAt: { $lt: now },
    });

    if (expiredOffers.length === 0) {
      console.log("✅ No expired offers found");
      return;
    }

    console.log(`⏰ Processing ${expiredOffers.length} expired offers...`);

    for (const offer of expiredOffers) {
      try {
        // Update offer status
        offer.status = "expired";
        await offer.save();

        // Refund customer wallet
        await db.wallet.findOneAndUpdate(
          { user: offer.customer },
          {
            $inc: {
              balance: offer.totalCharge,
              escrowBalance: -offer.totalCharge,
            },
          }
        );

        // Create refund transaction
        await db.transaction.create({
          type: "refund",
          amount: offer.totalCharge,
          from: offer.customer,
          to: offer.customer,
          offer: offer._id,
          job: offer.job,
          status: "completed",
          description: `Refund for expired offer: $${offer.totalCharge}`,
          completedAt: new Date(),
        });

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
            // Clear offer reference (cast to any to avoid TypeScript error)
            engagement.offerId = undefined as any;
            await engagement.save();
          }
        }

        // Notify customer
        await NotificationService.sendToUser({
          userId: offer.customer.toString(),
          title: "Offer Expired",
          body: `Your offer has expired and $${offer.totalCharge} has been refunded to your wallet`,
          type: "general",
          data: {
            offerId: (offer._id as any).toString(),
            jobId: offer.job.toString(),
            refundAmount: offer.totalCharge.toString(),
          },
        });

        console.log(
          `✅ Expired offer ${(offer._id as any).toString()} and refunded $${
            offer.totalCharge
          }`
        );
      } catch (error) {
        console.error(`❌ Error expiring offer ${offer._id}:`, error);
      }
    }

    console.log(
      `✅ Successfully processed ${expiredOffers.length} expired offers`
    );
  } catch (error) {
    console.error("❌ Error in expireOffers job:", error);
  }
};

/**
 * Start the offer expiration job
 * Runs every hour
 */
export const startOfferExpirationJob = () => {
  console.log("🚀 Starting offer expiration job (runs every hour)");

  // Run immediately on startup
  expireOffers();

  // Run every hour
  setInterval(expireOffers, 60 * 60 * 1000);
};
