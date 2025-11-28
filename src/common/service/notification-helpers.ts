/** biome-ignore-all lint/complexity/noStaticOnlyClass: <> */
import { NotificationService } from "./notification.service";

/**
 * Additional notification helper methods
 * Note: Most notification methods are now in NotificationService
 * This file contains only specialized helpers not in the main service
 */

export class NotificationHelpers {
  /**
   * Send notification when payment is secured (escrow held)
   * Notifies both contractor and customer
   */
  static async notifyPaymentSecured(
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
      type: "general",
      data: { jobId, amount },
    });

    // Notify customer
    await NotificationService.sendToUser({
      userId: customerId,
      title: "Payment Secured",
      body: `Your payment of $${amount} for "${jobTitle}" is being held securely until job completion`,
      type: "general",
      data: { jobId, amount },
    });
  }
}
