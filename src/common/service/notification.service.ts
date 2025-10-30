import { db } from "@/db";
import { getMessaging } from "@/lib/firebase";
import type { MulticastMessage } from "firebase-admin/messaging";
import type { Types } from "mongoose";

export interface NotificationPayload {
  userId: Types.ObjectId | string;
  title: string;
  body: string;
  type?:
    | "job_posted"
    | "job_application"
    | "booking_confirmed"
    | "booking_declined"
    | "message_received"
    | "payment_received"
    | "payment_released"
    | "job_completed"
    | "review_submitted"
    | "general";
  data?: Record<string, any>;
}

export interface BulkNotificationPayload {
  userIds: (Types.ObjectId | string)[];
  title: string;
  body: string;
  type?:
    | "job_posted"
    | "job_application"
    | "booking_confirmed"
    | "booking_declined"
    | "message_received"
    | "payment_received"
    | "payment_released"
    | "job_completed"
    | "review_submitted"
    | "general";
  data?: Record<string, any>;
}

/**
 * Notification Service
 * Provides methods to send push notifications via Firebase Cloud Messaging
 */
export class NotificationService {
  /**
   * Send notification to a single user
   * @param payload - Notification payload
   * @returns Success status and message
   */
  static async sendToUser(
    payload: NotificationPayload
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { userId, title, body, type = "general", data = {} } = payload;

      // Save notification to database
      const notification = await db.notification.create({
        userId,
        title,
        body,
        type,
        data,
        isSent: false,
      });

      // Get user's FCM tokens
      const fcmTokens = await db.fcmToken.find({
        userId,
        isActive: true,
      });

      if (fcmTokens.length === 0) {
        console.log(`No active FCM tokens found for user: ${userId}`);
        return {
          success: false,
          message: "No active devices found for user",
        };
      }

      // Prepare FCM message
      const tokens = fcmTokens.map((token) => token.token);
      const message: MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: {
          type,
          notificationId: String(notification._id),
          ...data,
        },
        tokens,
      };

      // Send via FCM
      const messaging = getMessaging();
      const response = await messaging.sendEachForMulticast(message);

      // Update notification status
      await db.notification.findByIdAndUpdate(notification._id, {
        isSent: true,
        sentAt: new Date(),
      });

      // Handle failed tokens (remove invalid ones)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });

        // Deactivate failed tokens
        await db.fcmToken.updateMany(
          { token: { $in: failedTokens } },
          { isActive: false }
        );
      }

      console.log(
        `✅ Notification sent to user ${userId}: ${response.successCount}/${tokens.length} devices`
      );

      return {
        success: true,
        message: `Notification sent to ${response.successCount} device(s)`,
      };
    } catch (error) {
      console.error("Error sending notification:", error);
      return {
        success: false,
        message: "Failed to send notification",
      };
    }
  }

  /**
   * Send notification to multiple users
   * @param payload - Bulk notification payload
   * @returns Success status and message
   */
  static async sendToMultipleUsers(
    payload: BulkNotificationPayload
  ): Promise<{ success: boolean; message: string; results: any[] }> {
    try {
      const { userIds, title, body, type = "general", data = {} } = payload;

      const results = await Promise.allSettled(
        userIds.map((userId) =>
          this.sendToUser({ userId, title, body, type, data })
        )
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;

      return {
        success: true,
        message: `Notifications sent to ${successCount}/${userIds.length} users`,
        results,
      };
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      return {
        success: false,
        message: "Failed to send bulk notifications",
        results: [],
      };
    }
  }

  /**
   * Send notification to all users with a specific role
   * @param role - User role (contractor, customer, admin)
   * @param title - Notification title
   * @param body - Notification body
   * @param type - Notification type
   * @param data - Additional data
   */
  static async sendToRole(
    role: "contractor" | "customer" | "admin",
    title: string,
    body: string,
    type?:
      | "job_posted"
      | "job_application"
      | "booking_confirmed"
      | "booking_declined"
      | "message_received"
      | "payment_received"
      | "payment_released"
      | "job_completed"
      | "review_submitted"
      | "general",
    data?: Record<string, any>
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get all users with the specified role
      const users = await db.user.find({ role, isSuspend: false });
      const userIds = users.map((user) => user._id) as (Types.ObjectId | string)[];

      if (userIds.length === 0) {
        return {
          success: false,
          message: `No active users found with role: ${role}`,
        };
      }

      const result = await this.sendToMultipleUsers({
        userIds,
        title,
        body,
        type,
        data,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      console.error("Error sending notification to role:", error);
      return {
        success: false,
        message: "Failed to send notification to role",
      };
    }
  }

  /**
   * Send notification when a new job is posted (to all contractors)
   */
  static async notifyNewJob(jobId: string, jobTitle: string): Promise<void> {
    await this.sendToRole(
      "contractor",
      "New Job Available",
      `A new job "${jobTitle}" has been posted. Check it out!`,
      "job_posted",
      { jobId }
    );
  }

  /**
   * Send notification when a contractor applies to a job
   */
  static async notifyJobApplication(
    customerId: string,
    contractorName: string,
    jobTitle: string
  ): Promise<void> {
    await this.sendToUser({
      userId: customerId,
      title: "New Job Application",
      body: `${contractorName} has applied to your job "${jobTitle}"`,
      type: "job_application",
    });
  }

  /**
   * Send notification when a booking is confirmed
   */
  static async notifyBookingConfirmed(
    contractorId: string,
    jobTitle: string
  ): Promise<void> {
    await this.sendToUser({
      userId: contractorId,
      title: "Booking Confirmed",
      body: `Your application for "${jobTitle}" has been accepted!`,
      type: "booking_confirmed",
    });
  }

  /**
   * Send notification when a new message is received
   */
  static async notifyNewMessage(
    recipientId: string,
    senderName: string
  ): Promise<void> {
    await this.sendToUser({
      userId: recipientId,
      title: "New Message",
      body: `${senderName} sent you a message`,
      type: "message_received",
    });
  }

  /**
   * Send notification when payment is received
   */
  static async notifyPaymentReceived(
    contractorId: string,
    amount: number
  ): Promise<void> {
    await this.sendToUser({
      userId: contractorId,
      title: "Payment Received",
      body: `You received a payment of $${amount}`,
      type: "payment_received",
    });
  }
}
