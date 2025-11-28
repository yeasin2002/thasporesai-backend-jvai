import { db } from "@/db";
import { sendInternalError, sendSuccess, sendUnauthorized } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get all notifications for authenticated user
 * Returns notifications sorted by creation date (newest first)
 */
export const getNotifications: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendUnauthorized(res, "User not authenticated");
    }

    // Get notifications for user, sorted by newest first
    const notifications = await db.notification
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Populate user details from data field
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const enrichedData = { ...notification.data };

        // Populate contractor info if contractorId exists
        if (enrichedData.contractorId) {
          const contractor = await db.user
            .findById(enrichedData.contractorId)
            .select(
              "full_name email phone profile_img cover_img role bio description address availability is_verified starting_budget hourly_charge"
            )
            .lean();
          if (contractor) {
            enrichedData.contractor = contractor;
          }
        }

        // Populate customer info if customerId exists
        if (enrichedData.customerId) {
          const customer = await db.user
            .findById(enrichedData.customerId)
            .select(
              "full_name email phone profile_img cover_img role bio description address availability is_verified"
            )
            .lean();
          if (customer) {
            enrichedData.customer = customer;
          }
        }

        // Populate sender info if senderId exists
        if (enrichedData.senderId) {
          const sender = await db.user
            .findById(enrichedData.senderId)
            .select(
              "full_name email phone profile_img cover_img role bio description address availability is_verified"
            )
            .lean();
          if (sender) {
            enrichedData.sender = sender;
          }
        }

        return {
          ...notification,
          data: enrichedData,
        };
      })
    );

    return sendSuccess(
      res,
      200,
      "Notifications retrieved successfully",
      enrichedNotifications
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return sendInternalError(res, "Failed to fetch notifications", error);
  }
};
