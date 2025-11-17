import { NotificationService } from "./notification.service";

/**
 * Additional notification helper methods for new notification types
 * These can be imported and used alongside the main NotificationService
 */

export class NotificationHelpers {
  /**
   * Send notification when customer invites a contractor
   */
  static async notifyJobInvite(
    contractorId: string,
    customerName: string,
    jobTitle: string,
    jobId: string
  ): Promise<void> {
    await NotificationService.sendToUser({
      userId: contractorId,
      title: "Job Invitation",
      body: `${customerName} has invited you to apply for "${jobTitle}"`,
      type: "job_invite",
      data: { jobId },
    });
  }

  /**
   * Send notification when contractor requests a job from customer
   */
  static async notifyJobRequest(
    customerId: string,
    contractorName: string,
    jobTitle: string,
    jobId: string
  ): Promise<void> {
    await NotificationService.sendToUser({
      userId: customerId,
      title: "Job Request",
      body: `${contractorName} has requested to work on your job "${jobTitle}"`,
      type: "job_request",
      data: { jobId },
    });
  }

  /**
   * Send notification when customer sends an offer to contractor
   */
  static async notifySentOffer(
    contractorId: string,
    customerName: string,
    jobTitle: string,
    offerAmount: number,
    offerId: string
  ): Promise<void> {
    await NotificationService.sendToUser({
      userId: contractorId,
      title: "New Offer Received",
      body: `${customerName} sent you an offer of $${offerAmount} for "${jobTitle}"`,
      type: "sent_offer",
      data: { offerId, offerAmount },
    });
  }

  /**
   * Send notification when contractor accepts an offer
   */
  static async notifyAcceptOffer(
    customerId: string,
    contractorName: string,
    jobTitle: string,
    offerId: string
  ): Promise<void> {
    await NotificationService.sendToUser({
      userId: customerId,
      title: "Offer Accepted",
      body: `${contractorName} has accepted your offer for "${jobTitle}"`,
      type: "accept_offer",
      data: { offerId },
    });
  }

  /**
   * Send notification when payment is completed (held by admin)
   */
  static async notifyPaymentComplete(
    contractorId: string,
    customerId: string,
    jobTitle: string,
    amount: number,
    jobId: string
  ): Promise<void> {
    // Notify contractor
    await NotificationService.sendToUser({
      userId: contractorId,
      title: "Order Started",
      body: `Payment of $${amount} for "${jobTitle}" is being held securely. You can start working!`,
      type: "payment_complete",
      data: { jobId, amount },
    });

    // Notify customer
    await NotificationService.sendToUser({
      userId: customerId,
      title: "Payment Secured",
      body: `Your payment of $${amount} for "${jobTitle}" is being held securely until job completion`,
      type: "payment_complete",
      data: { jobId, amount },
    });
  }
}
